from datetime import date, timedelta

from django.contrib.auth.models import User
from django.db import models
from django.db.models import Count, Q
from django.http import FileResponse
from django.utils import timezone
from django.utils.text import slugify
import tempfile
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from rest_framework import generics, parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Adopter,
    AdoptionApplication,
    Animal,
    AuditLog,
    InventoryItem,
    InventoryMovement,
    MedicalRecord,
    ShelterLocation,
    ShelterTask,
)
from .permissions import InternalReadWriteByRole, IsAdminRole
from .serializers import (
    AdopterSerializer,
    AdoptionApplicationSerializer,
    AnimalSerializer,
    InventoryItemSerializer,
    InventoryMovementSerializer,
    MedicalRecordSerializer,
    PublicAnimalSerializer,
    PublicApplicationSerializer,
    AdopterRegistrationSerializer,
    AuditLogSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ShelterRegistrationSerializer,
    ShelterLocationSerializer,
    ShelterSerializer,
    ShelterTaskSerializer,
    UserSerializer,
)


class SearchFilterMixin:
    search_fields = []
    filter_fields = []

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        if search and self.search_fields:
            query = Q()
            for field in self.search_fields:
                query |= Q(**{f"{field}__icontains": search})
            queryset = queryset.filter(query)
        for field in self.filter_fields:
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset


def current_shelter(user):
    return getattr(getattr(user, "profile", None), "shelter", None)


def log_action(user, shelter, action, instance, description):
    AuditLog.objects.create(
        shelter=shelter,
        actor=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        entity_type=instance.__class__.__name__ if instance else "Animal",
        entity_id=getattr(instance, "pk", None),
        description=description,
    )


class ShelterScopedQuerySetMixin:
    shelter_lookup = "shelter"
    shelter_distinct = False

    def get_shelter(self):
        return current_shelter(self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        shelter = self.get_shelter()
        if not shelter:
            return queryset.none()
        queryset = queryset.filter(**{self.shelter_lookup: shelter})
        return queryset.distinct() if self.shelter_distinct else queryset

    def require_related_shelter(self, instance):
        if instance.shelter_id != self.get_shelter().id:
            raise PermissionDenied("Este registro pertenece a otro refugio.")


class AnimalViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = Animal.objects.prefetch_related("medical_records").all()
    serializer_class = AnimalSerializer
    permission_classes = [InternalReadWriteByRole]
    read_roles = {"admin", "volunteer", "vet"}
    write_roles = {"admin", "vet"}
    search_fields = ["name", "code", "breed"]
    filter_fields = ["species", "sex", "size", "status", "location_ref"]

    def perform_create(self, serializer):
        location = serializer.validated_data.get("location_ref")
        if location and location.shelter_id != self.get_shelter().id:
            raise PermissionDenied("La ubicacion pertenece a otro refugio.")
        animal = serializer.save(shelter=self.get_shelter())
        log_action(self.request.user, self.get_shelter(), "animal_created", animal, f"Registro de {animal.name} creado.")

    def perform_update(self, serializer):
        location = serializer.validated_data.get("location_ref", serializer.instance.location_ref)
        if location and location.shelter_id != self.get_shelter().id:
            raise PermissionDenied("La ubicacion pertenece a otro refugio.")
        animal = serializer.save()
        log_action(self.request.user, self.get_shelter(), "animal_updated", animal, f"Registro de {animal.name} actualizado.")

    def perform_destroy(self, instance):
        animal_name = instance.name
        animal_id = instance.id
        instance.delete()
        log_action(self.request.user, self.get_shelter(), "animal_deleted", None, f"Registro de {animal_name} (ID {animal_id}) eliminado.")


class MedicalRecordViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.select_related("animal", "veterinarian").all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [InternalReadWriteByRole]
    shelter_lookup = "animal__shelter"
    read_roles = {"admin", "vet"}
    write_roles = {"admin", "vet"}
    search_fields = ["animal__name", "diagnosis", "medication"]
    filter_fields = ["animal", "record_type", "health_status"]

    def perform_create(self, serializer):
        self.require_related_shelter(serializer.validated_data["animal"])
        record = serializer.save(veterinarian=self.request.user)
        log_action(self.request.user, self.get_shelter(), "medical_record_created", record, f"Registro medico agregado a {record.animal.name}.")

    def perform_update(self, serializer):
        self.require_related_shelter(serializer.validated_data.get("animal", serializer.instance.animal))
        record = serializer.save()
        log_action(self.request.user, self.get_shelter(), "medical_record_updated", record, f"Registro medico de {record.animal.name} actualizado.")


class InventoryItemViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [InternalReadWriteByRole]
    read_roles = {"admin", "volunteer", "vet"}
    write_roles = {"admin", "volunteer", "vet"}
    search_fields = ["name", "brand"]
    filter_fields = ["category"]

    def perform_create(self, serializer):
        item = serializer.save(shelter=self.get_shelter())
        log_action(self.request.user, self.get_shelter(), "inventory_item_created", item, f"Articulo {item.name} creado.")

    def perform_update(self, serializer):
        item = serializer.save()
        log_action(self.request.user, self.get_shelter(), "inventory_item_updated", item, f"Articulo {item.name} actualizado.")


class InventoryMovementViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = InventoryMovement.objects.select_related("item", "created_by").all()
    serializer_class = InventoryMovementSerializer
    permission_classes = [InternalReadWriteByRole]
    shelter_lookup = "item__shelter"
    read_roles = {"admin", "volunteer", "vet"}
    write_roles = {"admin", "volunteer", "vet"}
    filter_fields = ["item", "movement_type"]

    def perform_create(self, serializer):
        self.require_related_shelter(serializer.validated_data["item"])
        movement = serializer.save(created_by=self.request.user)
        log_action(
            self.request.user,
            self.get_shelter(),
            "inventory_movement_created",
            movement,
            f"{movement.get_movement_type_display()} de {movement.quantity} {movement.item.unit} para {movement.item.name}.",
        )

    def perform_update(self, serializer):
        self.require_related_shelter(serializer.validated_data.get("item", serializer.instance.item))
        serializer.save()


class AdopterViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = Adopter.objects.prefetch_related("applications__animal").all()
    serializer_class = AdopterSerializer
    permission_classes = [InternalReadWriteByRole]
    shelter_lookup = "applications__animal__shelter"
    shelter_distinct = True
    read_roles = {"admin", "volunteer"}
    write_roles = {"admin"}
    search_fields = ["full_name", "document", "email"]


class AdoptionApplicationViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = AdoptionApplication.objects.select_related("animal", "adopter", "shelter_responsible").all()
    serializer_class = AdoptionApplicationSerializer
    permission_classes = [InternalReadWriteByRole]
    shelter_lookup = "animal__shelter"
    read_roles = {"admin", "volunteer"}
    write_roles = {"admin", "volunteer"}
    search_fields = ["animal__name", "adopter__full_name", "adopter__email"]
    filter_fields = ["status"]

    def perform_create(self, serializer):
        self.require_related_shelter(serializer.validated_data["animal"])
        application = serializer.save()
        log_action(self.request.user, self.get_shelter(), "adoption_application_created", application, f"Solicitud para {application.animal.name} creada.")

    def perform_update(self, serializer):
        self.require_related_shelter(serializer.validated_data.get("animal", serializer.instance.animal))
        application = serializer.save()
        if application.status in {
            AdoptionApplication.Status.PENDING,
            AdoptionApplication.Status.REVIEW,
            AdoptionApplication.Status.INTERVIEW,
            AdoptionApplication.Status.HOME_VISIT,
            AdoptionApplication.Status.APPROVED,
        }:
            application.animal.status = Animal.Status.ADOPTION_PROCESS
            application.animal.save(update_fields=["status", "updated_at"])
        elif application.status == AdoptionApplication.Status.REJECTED:
            has_active = application.animal.adoption_applications.exclude(pk=application.pk).filter(
                status__in=[
                    AdoptionApplication.Status.PENDING,
                    AdoptionApplication.Status.REVIEW,
                    AdoptionApplication.Status.INTERVIEW,
                    AdoptionApplication.Status.HOME_VISIT,
                    AdoptionApplication.Status.APPROVED,
                ]
            ).exists()
            if not has_active:
                application.animal.status = Animal.Status.AVAILABLE
                application.animal.save(update_fields=["status", "updated_at"])
        log_action(self.request.user, self.get_shelter(), "adoption_application_updated", application, f"Solicitud de {application.animal.name}: {application.get_status_display()}.")

    @action(detail=True, methods=["post"])
    def formalize(self, request, pk=None):
        application = self.get_object()
        application.status = AdoptionApplication.Status.FORMALIZED
        application.official_adoption_date = request.data.get("official_adoption_date") or timezone.now().date()
        application.shelter_responsible = request.user
        application.save()
        application.animal.status = Animal.Status.ADOPTED
        application.animal.is_public = False
        application.animal.save(update_fields=["status", "is_public", "updated_at"])
        log_action(request.user, self.get_shelter(), "adoption_formalized", application, f"Adopcion de {application.animal.name} formalizada.")
        return Response(self.get_serializer(application).data)


class UserViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = User.objects.select_related("profile", "profile__shelter").all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    shelter_lookup = "profile__shelter"
    search_fields = ["first_name", "last_name", "email", "username"]

    def perform_create(self, serializer):
        user = serializer.save()
        user.profile.shelter = self.get_shelter()
        user.profile.is_active_staff = True
        user.profile.save(update_fields=["shelter", "is_active_staff"])
        log_action(self.request.user, self.get_shelter(), "staff_created", user, f"Usuario {user.get_full_name() or user.username} creado.")

    def perform_update(self, serializer):
        user = serializer.save()
        log_action(self.request.user, self.get_shelter(), "staff_updated", user, f"Usuario {user.get_full_name() or user.username} actualizado.")

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise PermissionDenied("No puedes eliminar tu propio usuario.")
        name = instance.get_full_name() or instance.username
        instance.delete()
        log_action(self.request.user, self.get_shelter(), "staff_deleted", None, f"Usuario {name} eliminado.")


class ShelterLocationViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = ShelterLocation.objects.all()
    serializer_class = ShelterLocationSerializer
    permission_classes = [InternalReadWriteByRole]
    read_roles = {"admin"}
    write_roles = {"admin"}
    search_fields = ["name"]
    filter_fields = ["location_type", "is_active"]

    def perform_create(self, serializer):
        location = serializer.save(shelter=self.get_shelter())
        log_action(self.request.user, self.get_shelter(), "location_created", location, f"Ubicacion {location.name} creada.")

    def perform_update(self, serializer):
        location = serializer.save()
        log_action(self.request.user, self.get_shelter(), "location_updated", location, f"Ubicacion {location.name} actualizada.")


class ShelterTaskViewSet(ShelterScopedQuerySetMixin, SearchFilterMixin, viewsets.ModelViewSet):
    queryset = ShelterTask.objects.select_related("assigned_to", "animal", "created_by").all()
    serializer_class = ShelterTaskSerializer
    permission_classes = [InternalReadWriteByRole]
    read_roles = {"admin", "vet", "volunteer"}
    write_roles = {"admin", "vet", "volunteer"}
    search_fields = ["title", "description", "animal__name"]
    filter_fields = ["status", "priority", "assigned_to"]

    def _validate_related_records(self, serializer):
        shelter = self.get_shelter()
        animal = serializer.validated_data.get("animal", getattr(serializer.instance, "animal", None))
        assigned_to = serializer.validated_data.get("assigned_to", getattr(serializer.instance, "assigned_to", None))
        if animal and animal.shelter_id != shelter.id:
            raise PermissionDenied("El animal pertenece a otro refugio.")
        if assigned_to and current_shelter(assigned_to) != shelter:
            raise PermissionDenied("El usuario pertenece a otro refugio.")

    def perform_create(self, serializer):
        self._validate_related_records(serializer)
        task = serializer.save(shelter=self.get_shelter(), created_by=self.request.user)
        log_action(self.request.user, self.get_shelter(), "task_created", task, f"Tarea {task.title} creada.")

    def perform_update(self, serializer):
        self._validate_related_records(serializer)
        task = serializer.save()
        if task.status == ShelterTask.Status.COMPLETED and not task.completed_at:
            task.completed_at = timezone.now()
            task.save(update_fields=["completed_at"])
        log_action(self.request.user, self.get_shelter(), "task_updated", task, f"Tarea {task.title}: {task.get_status_display()}.")


class AuditLogViewSet(ShelterScopedQuerySetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class MyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        user = request.user
        for field in ["first_name", "last_name", "email"]:
            if field in request.data:
                setattr(user, field, request.data[field])
        if "email" in request.data:
            user.username = request.data["email"] or user.username
        user.save(update_fields=["first_name", "last_name", "email", "username"])
        profile = user.profile
        for field in ["phone", "address", "position", "emergency_contact", "emergency_phone"]:
            if field in request.data:
                setattr(profile, field, request.data[field])
        if request.FILES.get("profile_photo"):
            profile.profile_photo = request.FILES["profile_photo"]
        profile.save()
        log_action(user, current_shelter(user), "profile_updated", user, "Perfil de usuario actualizado.")
        return Response(UserSerializer(user, context={"request": request}).data)


class AdopterMeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def get_adopter(self, request):
        try:
            return request.user.adopter_profile
        except Adopter.DoesNotExist:
            return None

    def get(self, request):
        adopter = self.get_adopter(request)
        if not adopter:
            return Response({"detail": "No existe un perfil de adoptante para esta cuenta."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdopterSerializer(adopter, context={"request": request}).data)

    def patch(self, request):
        adopter = self.get_adopter(request)
        if not adopter:
            return Response({"detail": "No existe un perfil de adoptante para esta cuenta."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        user_fields = ["first_name", "last_name", "email"]
        changed_user_fields = []
        for field in user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
                changed_user_fields.append(field)
        if "email" in request.data and request.data["email"]:
            user.username = request.data["email"]
            changed_user_fields.append("username")
        if changed_user_fields:
            user.save(update_fields=sorted(set(changed_user_fields)))

        profile = user.profile
        for field in ["phone", "address", "position", "emergency_contact", "emergency_phone"]:
            if field in request.data:
                setattr(profile, field, request.data[field])
        if request.FILES.get("profile_photo"):
            profile.profile_photo = request.FILES["profile_photo"]
        profile.role = "adopter"
        profile.save()

        full_name = f"{user.first_name} {user.last_name}".strip()
        if full_name:
            adopter.full_name = full_name
        for field in ["phone", "email", "address", "housing_type", "owns_or_rents", "experience"]:
            if field in request.data:
                setattr(adopter, field, request.data[field])
        if "has_pets" in request.data:
            adopter.has_pets = str(request.data["has_pets"]).lower() in ["1", "true", "si", "yes", "on"]
        if request.FILES.get("identity_document"):
            adopter.identity_document = request.FILES["identity_document"]
        adopter.save()
        return Response(AdopterSerializer(adopter, context={"request": request}).data)


class ShelterSettingsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(ShelterSerializer(current_shelter(request.user), context={"request": request}).data)

    def patch(self, request):
        shelter = current_shelter(request.user)
        serializer = ShelterSerializer(shelter, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        shelter = serializer.save()
        log_action(request.user, shelter, "shelter_settings_updated", shelter, "Configuracion del refugio actualizada.")
        return Response(ShelterSerializer(shelter, context={"request": request}).data)


class AdopterRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = AdopterRegistrationSerializer


class ShelterRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ShelterRegistrationSerializer


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Si existe una cuenta con ese correo, recibira un enlace de recuperacion."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Contrasena actualizada correctamente."})


class PublicCatalogView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Animal.objects.select_related("shelter").filter(is_public=True, adoption_ready=True).exclude(status=Animal.Status.ADOPTED)
        if self.request.query_params.get("mine") == "1" and self.request.user.is_authenticated:
            shelter = current_shelter(self.request.user)
            if shelter:
                queryset = queryset.filter(shelter=shelter)
        for field in ["species", "sex", "size", "country", "region"]:
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset.order_by("shelter_id", "name", "-updated_at")

    def get_serializer_class(self):
        return PublicApplicationSerializer if self.request.method == "POST" else PublicAnimalSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(AdoptionApplicationSerializer(application, context={"request": request}).data, status=status.HTTP_201_CREATED)


class PublicAnimalDetailView(generics.RetrieveAPIView):
    queryset = Animal.objects.select_related("shelter").filter(is_public=True, adoption_ready=True)
    serializer_class = PublicAnimalSerializer
    permission_classes = [AllowAny]


class ReportSummaryView(APIView):
    permission_classes = [InternalReadWriteByRole]

    def get(self, request):
        shelter = current_shelter(request.user)
        report_type = request.query_params.get("type", "adoptions")
        today = timezone.localdate()
        animals = Animal.objects.filter(shelter=shelter)
        applications = AdoptionApplication.objects.filter(animal__shelter=shelter)
        inventory = InventoryItem.objects.filter(shelter=shelter)
        locations = ShelterLocation.objects.filter(shelter=shelter, is_active=True)
        tasks = ShelterTask.objects.filter(shelter=shelter)
        animals_total = animals.count()
        adopted_month = applications.filter(
            status__in=[AdoptionApplication.Status.FORMALIZED, AdoptionApplication.Status.FOLLOW_UP],
            official_adoption_date__month=today.month,
            official_adoption_date__year=today.year,
        ).count()
        stock_critical = inventory.filter(current_stock__lte=models.F("minimum_stock")).count()
        by_species = animals.values("species").annotate(total=Count("id"))

        alerts = []
        for item in inventory.filter(current_stock__lte=models.F("minimum_stock")).order_by("current_stock", "name")[:3]:
            alerts.append(
                {
                    "type": "inventory",
                    "severity": "critical",
                    "title": "Stock critico",
                    "detail": f"{item.name}: quedan {item.current_stock} {item.unit}",
                }
            )
        for animal in animals.filter(status=Animal.Status.TREATMENT).order_by("name")[:3]:
            alerts.append(
                {
                    "type": "medical",
                    "severity": "warning",
                    "title": "Tratamiento activo",
                    "detail": f"{animal.name} requiere seguimiento medico.",
                }
            )
        for item in inventory.filter(expiry_date__isnull=False, expiry_date__lte=today + timedelta(days=30)).order_by("expiry_date")[:3]:
            alerts.append(
                {
                    "type": "inventory",
                    "severity": "warning",
                    "title": "Vencimiento proximo",
                    "detail": f"{item.name} vence el {item.expiry_date}.",
                }
            )
        for task in tasks.exclude(status__in=[ShelterTask.Status.COMPLETED, ShelterTask.Status.CANCELLED]).filter(due_date__lte=timezone.now()).order_by("due_date")[:3]:
            alerts.append(
                {
                    "type": "task",
                    "severity": "warning",
                    "title": "Tarea pendiente",
                    "detail": task.title,
                }
            )

        adoption_trend = []
        month_labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        for offset in range(5, -1, -1):
            total_months = today.year * 12 + today.month - 1 - offset
            year, month_index = divmod(total_months, 12)
            month = month_index + 1
            start = date(year, month, 1)
            next_month = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
            monthly_adoptions = applications.filter(
                status__in=[AdoptionApplication.Status.FORMALIZED, AdoptionApplication.Status.FOLLOW_UP],
                official_adoption_date__gte=start,
                official_adoption_date__lt=next_month,
            )
            adoption_trend.append(
                {
                    "mes": month_labels[month - 1],
                    "perros": monthly_adoptions.filter(animal__species=Animal.Species.DOG).count(),
                    "gatos": monthly_adoptions.filter(animal__species=Animal.Species.CAT).count(),
                }
            )
        if report_type == "animals":
            report_data = [
                {"label": "Perros", "total": animals.filter(species=Animal.Species.DOG).count()},
                {"label": "Gatos", "total": animals.filter(species=Animal.Species.CAT).count()},
                {"label": "Otros", "total": animals.filter(species=Animal.Species.OTHER).count()},
            ]
        elif report_type == "inventory":
            report_data = [
                {"label": item.name, "total": float(item.current_stock), "minimum": float(item.minimum_stock)}
                for item in inventory.filter(current_stock__lte=models.F("minimum_stock")).order_by("current_stock")[:8]
            ]
        else:
            report_data = adoption_trend
        return Response(
            {
                "animals_total": animals_total,
                "available": animals.filter(status=Animal.Status.AVAILABLE).count(),
                "adopted_month": adopted_month,
                "stock_critical": stock_critical,
                "applications_pending": applications.filter(status=AdoptionApplication.Status.PENDING).count(),
                "tasks_pending": tasks.exclude(status__in=[ShelterTask.Status.COMPLETED, ShelterTask.Status.CANCELLED]).count(),
                "capacity": sum(location.capacity for location in locations),
                "occupancy": animals.exclude(status__in=[Animal.Status.ADOPTED, Animal.Status.DECEASED, Animal.Status.LOST]).count(),
                "species": list(by_species),
                "alerts": alerts,
                "adoption_trend": adoption_trend,
                "report_type": report_type,
                "report_data": report_data,
            }
        )


class DemoDataResetView(APIView):
    """Reset only the current shelter's operational data with connected demo records."""

    permission_classes = [IsAdminRole]

    def post(self, request):
        shelter = current_shelter(request.user)
        today = timezone.localdate()
        applications = AdoptionApplication.objects.filter(animal__shelter=shelter)
        applications.delete()
        ShelterTask.objects.filter(shelter=shelter).delete()
        Animal.objects.filter(shelter=shelter).delete()
        InventoryItem.objects.filter(shelter=shelter).delete()

        kennel, _ = ShelterLocation.objects.get_or_create(
            shelter=shelter,
            name="Pabellon A",
            defaults={"location_type": ShelterLocation.LocationType.KENNEL, "capacity": 12, "notes": "Zona de perros disponibles."},
        )
        cattery, _ = ShelterLocation.objects.get_or_create(
            shelter=shelter,
            name="Gateria principal",
            defaults={"location_type": ShelterLocation.LocationType.CATTERY, "capacity": 10, "notes": "Zona tranquila para felinos."},
        )
        medical_area, _ = ShelterLocation.objects.get_or_create(
            shelter=shelter,
            name="Area medica",
            defaults={"location_type": ShelterLocation.LocationType.MEDICAL, "capacity": 4, "notes": "Atencion y recuperacion veterinaria."},
        )

        code_prefix = f"D{str(shelter.id).zfill(3)}"
        luna = Animal.objects.create(
            code=f"{code_prefix}-LUNA",
            shelter=shelter,
            name="Luna",
            species=Animal.Species.DOG,
            breed="Mestiza",
            sex=Animal.Sex.FEMALE,
            size=Animal.Size.MEDIUM,
            approximate_age="2 anos",
            color="Dorada",
            intake_reason="Rescate urbano",
            location="Pabellon A, Jaula 4",
            location_ref=kennel,
            country="CO",
            region="Bogota D.C.",
            status=Animal.Status.AVAILABLE,
            behavior_notes="Sociable, carinosa y tranquila.",
            public_description="Luna es una companera afectuosa y juguetona que busca una familia responsable.",
            personality_tags="Carinosa, Sociable, Tranquila",
            photo="animals/luna.png",
            vaccinated=True,
            sterilized=True,
            dewormed=True,
            adoption_ready=True,
            is_public=True,
        )
        milo = Animal.objects.create(
            code=f"{code_prefix}-MILO",
            shelter=shelter,
            name="Milo",
            species=Animal.Species.CAT,
            breed="Tabby",
            sex=Animal.Sex.MALE,
            size=Animal.Size.SMALL,
            approximate_age="1 ano",
            color="Atigrado",
            intake_reason="Entrega voluntaria",
            location="Gateria principal",
            location_ref=cattery,
            country="CO",
            region="Bogota D.C.",
            status=Animal.Status.AVAILABLE,
            behavior_notes="Observador y dulce.",
            public_description="Milo es curioso y disfruta de espacios tranquilos.",
            personality_tags="Curioso, Dulce",
            photo="animals/milo.png",
            vaccinated=True,
            sterilized=True,
            adoption_ready=True,
            is_public=True,
        )
        bruno = Animal.objects.create(
            code=f"{code_prefix}-BRUNO",
            shelter=shelter,
            name="Bruno",
            species=Animal.Species.DOG,
            breed="Criollo",
            sex=Animal.Sex.MALE,
            size=Animal.Size.LARGE,
            approximate_age="3 anos",
            color="Cafe",
            intake_reason="Rescate urbano",
            location="Area medica, Box 2",
            location_ref=medical_area,
            country="CO",
            region="Bogota D.C.",
            status=Animal.Status.TREATMENT,
            behavior_notes="En recuperacion y bajo observacion veterinaria.",
            photo="animals/simba.png",
        )
        toby = Animal.objects.create(
            code=f"{code_prefix}-TOBY",
            shelter=shelter,
            name="Toby",
            species=Animal.Species.DOG,
            breed="Terrier mestizo",
            sex=Animal.Sex.MALE,
            size=Animal.Size.SMALL,
            approximate_age="4 anos",
            color="Blanco y cafe",
            intake_reason="Entrega voluntaria",
            location="",
            country="CO",
            region="Bogota D.C.",
            status=Animal.Status.ADOPTED,
            photo="animals/luna.png",
        )
        MedicalRecord.objects.create(
            animal=bruno,
            record_type=MedicalRecord.RecordType.TREATMENT,
            diagnosis="Recuperacion postoperatoria",
            medication="Antiinflamatorio",
            dosage="1 tableta cada 12 horas",
            veterinarian=request.user,
            health_status=MedicalRecord.HealthStatus.RECOVERY,
            next_event="Control veterinario",
            next_event_date=today,
            notes="Registro de demostracion para pruebas del refugio.",
        )
        adopter, _ = Adopter.objects.update_or_create(
            email=f"demo-{shelter.id}@sigera.local",
            defaults={
                "full_name": "Adoptante de demostracion",
                "document_type": "CC",
                "document": f"DEMO-{shelter.id}",
                "phone": "3000000000",
                "address": "Bogota D.C.",
            },
        )
        AdoptionApplication.objects.create(
            animal=toby,
            adopter=adopter,
            status=AdoptionApplication.Status.FORMALIZED,
            motivation="Proceso de demostracion completado.",
            official_adoption_date=today,
            shelter_responsible=request.user,
            follow_up_notes="Contacto inicial pendiente.",
        )
        InventoryItem.objects.bulk_create(
            [
                InventoryItem(
                    shelter=shelter,
                    name="Alimento para perros",
                    category=InventoryItem.Category.FOOD,
                    brand="SIGERA Demo",
                    unit="kg",
                    current_stock=18,
                    minimum_stock=10,
                ),
                InventoryItem(
                    shelter=shelter,
                    name="Vacuna antirrabica",
                    category=InventoryItem.Category.MEDICINE,
                    unit="dosis",
                    current_stock=2,
                    minimum_stock=8,
                ),
                InventoryItem(
                    shelter=shelter,
                    name="Desinfectante",
                    category=InventoryItem.Category.CLEANING,
                    unit="L",
                    current_stock=5,
                    minimum_stock=8,
                ),
            ]
        )
        ShelterTask.objects.create(
            shelter=shelter,
            title="Control veterinario de Bruno",
            description="Revisar recuperacion postoperatoria y actualizar el expediente medico.",
            priority=ShelterTask.Priority.HIGH,
            due_date=timezone.now(),
            animal=bruno,
            created_by=request.user,
        )
        ShelterTask.objects.create(
            shelter=shelter,
            title="Preparar perfil de Luna para adopcion",
            description="Verificar fotos y condiciones antes de entrevistas.",
            priority=ShelterTask.Priority.MEDIUM,
            due_date=timezone.now(),
            animal=luna,
            created_by=request.user,
        )
        log_action(request.user, shelter, "demo_data_reset", shelter, "Datos de prueba del refugio restaurados.")
        return Response(
            {
                "detail": "Datos de prueba restaurados para este refugio.",
                "animals": [luna.id, milo.id, bruno.id, toby.id],
            }
        )


class AdoptionReportPdfView(APIView):
    permission_classes = [InternalReadWriteByRole]
    read_roles = {"admin", "vet", "volunteer"}

    def get(self, request):
        shelter = current_shelter(request.user)
        today = timezone.localdate()
        applications = AdoptionApplication.objects.select_related("animal", "adopter").filter(animal__shelter=shelter).order_by("-created_at")
        animals = Animal.objects.filter(shelter=shelter)
        inventory = InventoryItem.objects.filter(shelter=shelter)
        trend = []
        month_labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        for offset in range(5, -1, -1):
            total_months = today.year * 12 + today.month - 1 - offset
            year, month_index = divmod(total_months, 12)
            month = month_index + 1
            start = date(year, month, 1)
            next_month = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
            month_apps = applications.filter(
                status__in=[AdoptionApplication.Status.FORMALIZED, AdoptionApplication.Status.FOLLOW_UP],
                official_adoption_date__gte=start,
                official_adoption_date__lt=next_month,
            )
            trend.append({
                "label": month_labels[month - 1],
                "perros": month_apps.filter(animal__species=Animal.Species.DOG).count(),
                "gatos": month_apps.filter(animal__species=Animal.Species.CAT).count(),
            })

        output = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        output.close()
        output = output.name
        pdf = canvas.Canvas(output, pagesize=letter)
        width, height = letter
        blue = colors.HexColor("#0B63F6")
        navy = colors.HexColor("#061C5F")
        soft_blue = colors.HexColor("#EAF4FF")
        line = colors.HexColor("#BFD8FF")

        pdf.setFillColor(soft_blue)
        pdf.roundRect(54, 704, width - 108, 72, 12, fill=1, stroke=0)
        pdf.setFillColor(blue)
        pdf.circle(86, 740, 15, fill=1, stroke=0)
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawCentredString(86, 735, "S")
        pdf.setFillColor(navy)
        pdf.setFont("Helvetica-Bold", 18)
        pdf.drawString(112, 748, "SIGERA - Reporte operativo de adopciones")
        pdf.setFont("Helvetica", 9)
        pdf.drawString(112, 730, f"Refugio: {shelter.name} | Codigo: {shelter.code}")
        pdf.drawString(112, 716, f"Generado: {today}")

        cards = [
            ("Animales registrados", animals.count()),
            ("Disponibles", animals.filter(status=Animal.Status.AVAILABLE).count()),
            ("Solicitudes", applications.count()),
            ("Stock critico", inventory.filter(current_stock__lte=models.F("minimum_stock")).count()),
        ]
        x = 72
        for label, value in cards:
            pdf.setFillColor(colors.white)
            pdf.setStrokeColor(line)
            pdf.roundRect(x, 632, 108, 54, 8, fill=1, stroke=1)
            pdf.setFillColor(navy)
            pdf.setFont("Helvetica-Bold", 18)
            pdf.drawString(x + 12, 660, str(value))
            pdf.setFont("Helvetica", 7.5)
            pdf.drawString(x + 12, 644, label)
            x += 116

        pdf.setFillColor(navy)
        pdf.setFont("Helvetica-Bold", 13)
        pdf.drawString(72, 594, "Tendencia de adopciones")
        base_x, base_y, bar_w = 92, 522, 16
        max_value = max([item["perros"] + item["gatos"] for item in trend] + [1])
        pdf.setStrokeColor(line)
        pdf.line(72, base_y, width - 72, base_y)
        for index, item in enumerate(trend):
            px = base_x + index * 72
            dog_h = (item["perros"] / max_value) * 58
            cat_h = (item["gatos"] / max_value) * 58
            pdf.setFillColor(blue)
            pdf.rect(px, base_y, bar_w, dog_h, fill=1, stroke=0)
            pdf.setFillColor(colors.HexColor("#7EA6F4"))
            pdf.rect(px + bar_w + 4, base_y, bar_w, cat_h, fill=1, stroke=0)
            pdf.setFillColor(navy)
            pdf.setFont("Helvetica", 8)
            pdf.drawCentredString(px + bar_w, base_y - 14, item["label"])
        pdf.setFillColor(navy)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(72, 486, "Perros y gatos formalizados en los ultimos seis meses. El grafico permite detectar meses de mayor salida.")

        y = 448
        pdf.setFont("Helvetica-Bold", 13)
        pdf.drawString(72, y, "Detalle de solicitudes recientes")
        y -= 22
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(72, y, "Fecha")
        pdf.drawString(136, y, "Animal")
        pdf.drawString(236, y, "Adoptante")
        pdf.drawString(420, y, "Estado")
        y -= 10
        pdf.setStrokeColor(line)
        pdf.line(72, y, width - 72, y)
        y -= 16
        pdf.setFont("Helvetica", 8)
        for app in applications[:24]:
            pdf.drawString(72, y, str(app.created_at.date()))
            pdf.drawString(136, y, app.animal.name[:22])
            pdf.drawString(236, y, app.adopter.full_name[:34])
            pdf.drawString(420, y, app.get_status_display()[:28])
            y -= 16
            if y < 72:
                pdf.showPage()
                y = 740
        pdf.save()
        return FileResponse(open(output, "rb"), as_attachment=True, filename="reporte_adopciones_sigera.pdf")


def draw_wrapped_text(pdf, text, x, y, max_chars=92, line_height=14):
    words = str(text or "").split()
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if len(candidate) > max_chars:
            pdf.drawString(x, y, line)
            y -= line_height
            line = word
        else:
            line = candidate
    if line:
        pdf.drawString(x, y, line)
        y -= line_height
    return y


class MedicalExpedientPdfView(APIView):
    permission_classes = [InternalReadWriteByRole]
    read_roles = {"admin", "vet"}

    def get(self, request, pk):
        shelter = current_shelter(request.user)
        animal = Animal.objects.select_related("shelter", "location_ref").prefetch_related("medical_records").filter(pk=pk, shelter=shelter).first()
        if not animal:
            raise PermissionDenied("No tienes acceso a este expediente medico.")

        output = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        output.close()
        output = output.name
        pdf = canvas.Canvas(output, pagesize=letter)
        width, height = letter
        blue = colors.HexColor("#0B63F6")
        navy = colors.HexColor("#061C5F")
        soft_blue = colors.HexColor("#EAF4FF")
        line = colors.HexColor("#BFD8FF")

        def new_page(title_y=740):
            pdf.setFillColor(soft_blue)
            pdf.roundRect(54, title_y - 56, width - 108, 66, 10, fill=1, stroke=0)
            pdf.setFillColor(blue)
            pdf.circle(82, title_y - 22, 14, fill=1, stroke=0)
            pdf.setFillColor(colors.white)
            pdf.setFont("Helvetica-Bold", 14)
            pdf.drawCentredString(82, title_y - 27, "S")
            pdf.setFillColor(navy)
            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawString(106, title_y - 12, "SIGERA - Expediente Medico")
            pdf.setFont("Helvetica", 9)
            pdf.drawString(106, title_y - 30, f"Refugio: {animal.shelter.name}")
            pdf.drawString(106, title_y - 44, f"Generado: {timezone.localdate()}")
            return title_y - 88

        y = new_page()
        country_names = {"CO": "Colombia", "AR": "Argentina", "BO": "Bolivia", "BR": "Brasil", "CL": "Chile", "CR": "Costa Rica", "CU": "Cuba", "DO": "Republica Dominicana", "EC": "Ecuador", "SV": "El Salvador", "GT": "Guatemala", "HT": "Haiti", "HN": "Honduras", "MX": "Mexico", "NI": "Nicaragua", "PA": "Panama", "PY": "Paraguay", "PE": "Peru", "PR": "Puerto Rico", "UY": "Uruguay", "VE": "Venezuela"}
        pdf.setStrokeColor(line)
        pdf.setFillColor(colors.white)
        pdf.roundRect(72, y - 102, width - 144, 116, 8, fill=1, stroke=1)
        pdf.setFillColor(navy)
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(90, y - 8, animal.name)
        pdf.setFont("Helvetica", 10)
        pdf.drawString(90, y - 30, f"Codigo: {animal.code}")
        pdf.drawString(90, y - 46, f"Especie: {animal.get_species_display()} | Raza: {animal.breed or 'No registrada'} | Sexo: {animal.get_sex_display()}")
        pdf.drawString(90, y - 62, f"Edad: {animal.approximate_age or 'No registrada'} | Estado: {animal.get_status_display()}")
        location_name = animal.location or (animal.location_ref.name if animal.location_ref_id else "")
        pdf.drawString(90, y - 78, f"Ubicacion: {location_name or 'No registrada'}")
        pdf.drawString(90, y - 94, f"Region: {animal.region or 'No registrada'} | Pais: {country_names.get(animal.country, animal.country or 'No registrado')}")
        y -= 136

        pdf.setFillColor(navy)
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(72, y, "Historial clinico")
        y -= 22
        records = animal.medical_records.select_related("veterinarian").all()
        if not records:
            pdf.setFont("Helvetica", 10)
            pdf.drawString(72, y, "Este animal no tiene registros medicos.")
        for record in records:
            if y < 115:
                pdf.showPage()
                y = new_page()
            professional = record.veterinarian.get_full_name() or record.veterinarian.username if record.veterinarian else "No registrado"
            pdf.setStrokeColor(line)
            pdf.setFillColor(colors.HexColor("#F7FBFF"))
            pdf.roundRect(72, y - 92, width - 144, 106, 7, fill=1, stroke=1)
            pdf.setFillColor(navy)
            pdf.setFont("Helvetica-Bold", 10)
            pdf.drawString(88, y - 4, f"{record.date} - {record.get_record_type_display()} - {record.get_health_status_display()}")
            pdf.setFont("Helvetica", 9)
            pdf.drawString(88, y - 19, f"Profesional: {professional}")
            y -= 34
            y = draw_wrapped_text(pdf, f"Diagnostico: {record.diagnosis}", 88, y, 92, 13)
            if record.medication or record.dosage:
                y = draw_wrapped_text(pdf, f"Medicacion y dosis: {record.medication or 'No aplica'} {record.dosage or ''}", 88, y, 92, 13)
            if record.next_event or record.next_event_date:
                y = draw_wrapped_text(pdf, f"Proximo evento: {record.next_event or 'Sin descripcion'} {record.next_event_date or ''}", 88, y, 92, 13)
            if record.notes:
                y = draw_wrapped_text(pdf, f"Observaciones: {record.notes}", 88, y, 92, 13)
            y -= 12
            y -= 16

        pdf.save()
        filename = f"expediente_medico_{slugify(animal.name) or animal.id}.pdf"
        return FileResponse(open(output, "rb"), as_attachment=True, filename=filename)
