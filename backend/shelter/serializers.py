from django.contrib.auth import password_validation
from django.contrib.auth.models import User
from django.db import transaction
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    Adopter,
    AdoptionApplication,
    Animal,
    InventoryItem,
    InventoryMovement,
    MedicalRecord,
    AuditLog,
    Shelter,
    ShelterLocation,
    ShelterTask,
    UserProfile,
)


def file_url_or_empty(file_field):
    if not file_field:
        return ""
    try:
        if not file_field.storage.exists(file_field.name):
            return ""
    except Exception:
        return ""
    return file_field.url


def persist_uploaded_file(instance, field_name, uploaded_file):
    if not uploaded_file:
        return
    getattr(instance, field_name).save(uploaded_file.name, uploaded_file, save=False)


def normalize_email(value):
    return (value or "").strip().lower()


def normalize_username(value):
    return (value or "").strip()


def find_user_for_login(value):
    submitted_value = normalize_username(value)
    if not submitted_value:
        return None
    matched_shelter_admin = User.objects.filter(
        profile__shelter__code__iexact=submitted_value,
        profile__role=UserProfile.Role.ADMIN,
    ).first()
    if matched_shelter_admin:
        return matched_shelter_admin
    return (
        User.objects.filter(email__iexact=submitted_value).first()
        or User.objects.filter(username__iexact=submitted_value).first()
    )


def user_identity_conflicts(email=None, username=None, exclude_user=None):
    queryset = User.objects.all()
    if exclude_user:
        queryset = queryset.exclude(pk=exclude_user.pk)
    conflicts = {}
    if email and queryset.filter(email__iexact=email).exists():
        conflicts["email"] = "Ya existe una cuenta con este correo."
    if username and queryset.filter(username__iexact=username).exists():
        conflicts["username"] = "Ya existe una cuenta con este usuario."
    return conflicts


class UserProfileSerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source="get_role_display", read_only=True)
    shelter_code = serializers.CharField(source="shelter.code", read_only=True)
    shelter_name = serializers.CharField(source="shelter.name", read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "role", "role_label", "phone", "address", "position", "emergency_contact", "emergency_phone",
            "profile_photo", "profile_photo_url", "is_active_staff", "shelter", "shelter_code", "shelter_name",
        ]
        read_only_fields = ["shelter", "shelter_code", "shelter_name"]

    def get_profile_photo_url(self, obj):
        return file_url_or_empty(obj.profile_photo)


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=False)
    role = serializers.ChoiceField(
        write_only=True,
        required=False,
        choices=[UserProfile.Role.ADMIN, UserProfile.Role.VOLUNTEER, UserProfile.Role.VET, UserProfile.Role.ADOPTER],
    )
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    position = serializers.CharField(write_only=True, required=False, allow_blank=True)
    emergency_contact = serializers.CharField(write_only=True, required=False, allow_blank=True)
    emergency_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    profile_photo = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name", "email", "is_active", "password", "profile",
            "role", "phone", "address", "position", "emergency_contact", "emergency_phone", "profile_photo",
        ]

    def _profile_payload(self, validated_data):
        profile_data = validated_data.pop("profile", {}) or {}
        for field in ["role", "phone", "address", "position", "emergency_contact", "emergency_phone", "profile_photo"]:
            if field in validated_data:
                profile_data[field] = validated_data.pop(field)
        return profile_data

    def validate(self, attrs):
        attrs = super().validate(attrs)
        instance = getattr(self, "instance", None)
        current_email = normalize_email(getattr(instance, "email", ""))
        current_username = normalize_username(getattr(instance, "username", ""))

        if "email" in attrs:
            attrs["email"] = normalize_email(attrs["email"])
        if "username" in attrs:
            attrs["username"] = normalize_username(attrs["username"])

        email = attrs.get("email", current_email)
        username = attrs.get("username", current_username)

        if not instance and not username and email:
            username = email
            attrs["username"] = username

        if instance and "email" in attrs and "username" not in attrs and current_username.lower() == current_email:
            username = email
            attrs["username"] = username

        conflicts = user_identity_conflicts(email=email, username=username, exclude_user=instance)
        if conflicts:
            raise serializers.ValidationError(conflicts)

        password = attrs.get("password")
        if password:
            try:
                password_validation.validate_password(password, user=instance)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"password": list(exc.messages)})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        profile_data = self._profile_payload(validated_data)
        profile_photo = profile_data.pop("profile_photo", None)
        password = validated_data.pop("password", None) or "Sigera123*"
        user = User.objects.create_user(password=password, **validated_data)
        for key, value in profile_data.items():
            setattr(user.profile, key, value)
        persist_uploaded_file(user.profile, "profile_photo", profile_photo)
        user.profile.save()
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        profile_data = self._profile_payload(validated_data)
        profile_photo = profile_data.pop("profile_photo", None)
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        for key, value in profile_data.items():
            setattr(instance.profile, key, value)
        persist_uploaded_file(instance.profile, "profile_photo", profile_photo)
        instance.profile.save()
        return instance


class ShelterSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Shelter
        fields = [
            "id", "code", "name", "organization_document", "contact_name", "email", "phone", "address",
            "country", "region", "capacity", "operating_hours", "public_description", "adoption_policy", "notification_email",
            "notify_stock_alerts", "notify_medical_alerts", "logo", "logo_url", "created_at",
        ]
        read_only_fields = ["id", "code", "created_at", "logo_url"]

    def get_logo_url(self, obj):
        return file_url_or_empty(obj.logo)

    def create(self, validated_data):
        logo = validated_data.pop("logo", None)
        shelter = super().create(validated_data)
        persist_uploaded_file(shelter, "logo", logo)
        shelter.save()
        return shelter

    def update(self, instance, validated_data):
        logo = validated_data.pop("logo", None)
        shelter = super().update(instance, validated_data)
        persist_uploaded_file(shelter, "logo", logo)
        shelter.save()
        return shelter


class ShelterLocationSerializer(serializers.ModelSerializer):
    location_type_label = serializers.CharField(source="get_location_type_display", read_only=True)
    occupancy = serializers.SerializerMethodField()
    animals = serializers.SerializerMethodField()

    class Meta:
        model = ShelterLocation
        fields = "__all__"
        read_only_fields = ["shelter", "created_at", "occupancy", "animals"]

    def get_occupancy(self, obj):
        return obj.animals.exclude(status__in=["adopted", "deceased", "lost"]).count()

    def get_animals(self, obj):
        records = obj.animals.exclude(status__in=["adopted", "deceased", "lost"]).order_by("name")
        return [
            {
                "id": animal.id,
                "name": animal.name,
                "code": animal.code,
                "species": animal.get_species_display(),
                "status": animal.get_status_display(),
                "photo_url": file_url_or_empty(animal.photo),
            }
            for animal in records
        ]


class ShelterTaskSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    animal_name = serializers.CharField(source="animal.name", read_only=True)

    class Meta:
        model = ShelterTask
        fields = "__all__"
        read_only_fields = ["shelter", "created_by", "created_at", "completed_at"]

    def get_assigned_to_name(self, obj):
        if not obj.assigned_to:
            return ""
        return obj.assigned_to.get_full_name() or obj.assigned_to.username


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = "__all__"
        read_only_fields = ["id", "shelter", "actor", "action", "entity_type", "entity_id", "description", "created_at"]

    def get_actor_name(self, obj):
        if not obj.actor:
            return "Sistema"
        return obj.actor.get_full_name() or obj.actor.username


class MedicalRecordSerializer(serializers.ModelSerializer):
    record_type_label = serializers.CharField(source="get_record_type_display", read_only=True)
    health_status_label = serializers.CharField(source="get_health_status_display", read_only=True)
    veterinarian_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = "__all__"
        read_only_fields = ["created_at"]

    def get_veterinarian_name(self, obj):
        if not obj.veterinarian:
            return ""
        return obj.veterinarian.get_full_name() or obj.veterinarian.username

    def get_attachment_url(self, obj):
        return file_url_or_empty(obj.attachment)

    def create(self, validated_data):
        attachment = validated_data.pop("attachment", None)
        record = super().create(validated_data)
        persist_uploaded_file(record, "attachment", attachment)
        record.save()
        return record

    def update(self, instance, validated_data):
        attachment = validated_data.pop("attachment", None)
        record = super().update(instance, validated_data)
        persist_uploaded_file(record, "attachment", attachment)
        record.save()
        return record


class AnimalSerializer(serializers.ModelSerializer):
    species_label = serializers.CharField(source="get_species_display", read_only=True)
    sex_label = serializers.CharField(source="get_sex_display", read_only=True)
    size_label = serializers.CharField(source="get_size_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    photo_url = serializers.SerializerMethodField()
    medical_records = MedicalRecordSerializer(many=True, read_only=True)
    adoption_processes = serializers.SerializerMethodField()
    location_name = serializers.CharField(source="location_ref.name", read_only=True)

    class Meta:
        model = Animal
        fields = "__all__"
        read_only_fields = ["shelter", "created_at", "updated_at"]

    def get_photo_url(self, obj):
        return file_url_or_empty(obj.photo)

    def create(self, validated_data):
        photo = validated_data.pop("photo", None)
        animal = super().create(validated_data)
        persist_uploaded_file(animal, "photo", photo)
        animal.save()
        return animal

    def update(self, instance, validated_data):
        photo = validated_data.pop("photo", None)
        animal = super().update(instance, validated_data)
        persist_uploaded_file(animal, "photo", photo)
        animal.save()
        return animal

    def get_adoption_processes(self, obj):
        return [
            {
                "id": application.id,
                "adopter_name": application.adopter.full_name,
                "adopter_email": application.adopter.email,
                "status": application.get_status_display(),
                "motivation": application.motivation,
                "official_adoption_date": application.official_adoption_date,
                "interview_date": application.interview_date,
                "home_visit_date": application.home_visit_date,
                "follow_up_due_date": application.follow_up_due_date,
                "decision_notes": application.decision_notes,
                "follow_up_notes": application.follow_up_notes,
            }
            for application in obj.adoption_applications.select_related("adopter").order_by("-created_at")
        ]


class PublicAnimalSerializer(AnimalSerializer):
    shelter_name = serializers.SerializerMethodField()

    class Meta(AnimalSerializer.Meta):
        fields = [
            "id",
            "code",
            "name",
            "species",
            "species_label",
            "breed",
            "sex",
            "sex_label",
            "size",
            "size_label",
            "approximate_age",
            "weight_kg",
            "public_description",
            "personality_tags",
            "location",
            "country",
            "region",
            "shelter_name",
            "vaccinated",
            "sterilized",
            "dewormed",
            "photo_url",
        ]

    def get_shelter_name(self, obj):
        if obj.shelter_id:
            return obj.shelter.name
        country_names = {"AR": "Argentina", "BO": "Bolivia", "BR": "Brasil", "CL": "Chile", "CO": "Colombia", "CR": "Costa Rica", "CU": "Cuba", "DO": "Republica Dominicana", "EC": "Ecuador", "SV": "El Salvador", "GT": "Guatemala", "HT": "Haiti", "HN": "Honduras", "MX": "Mexico", "NI": "Nicaragua", "PA": "Panama", "PY": "Paraguay", "PE": "Peru", "PR": "Puerto Rico", "UY": "Uruguay", "VE": "Venezuela"}
        return f"Refugio SIGERA, {obj.region}, {country_names.get(obj.country, obj.country)}"


class InventoryItemSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    stock_status = serializers.CharField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = "__all__"
        read_only_fields = ["shelter"]


class InventoryMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    movement_type_label = serializers.CharField(source="get_movement_type_display", read_only=True)

    class Meta:
        model = InventoryMovement
        fields = "__all__"
        read_only_fields = ["created_at", "created_by"]

    def validate(self, attrs):
        item = attrs.get("item", getattr(self.instance, "item", None))
        movement_type = attrs.get("movement_type", getattr(self.instance, "movement_type", None))
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", None))
        if quantity is not None and quantity <= 0:
            raise serializers.ValidationError({"quantity": "La cantidad debe ser mayor que cero."})
        if item and movement_type == InventoryMovement.MovementType.OUT and quantity and quantity > item.current_stock:
            raise serializers.ValidationError({"quantity": "No hay existencias suficientes para registrar esta salida."})
        return attrs


class AdopterSerializer(serializers.ModelSerializer):
    adopted_animals = serializers.SerializerMethodField()
    applications = serializers.SerializerMethodField()

    class Meta:
        model = Adopter
        fields = "__all__"
        read_only_fields = ["created_at"]

    def get_adopted_animals(self, obj):
        apps = obj.applications.filter(status__in=["formalized", "follow_up"]).select_related("animal")
        request = self.context.get("request")
        shelter = getattr(getattr(getattr(request, "user", None), "profile", None), "shelter", None)
        if shelter:
            apps = apps.filter(animal__shelter=shelter)
        return [{"id": app.animal.id, "name": app.animal.name, "species": app.animal.get_species_display()} for app in apps]

    def get_applications(self, obj):
        apps = obj.applications.select_related("animal").order_by("-created_at")
        request = self.context.get("request")
        shelter = getattr(getattr(getattr(request, "user", None), "profile", None), "shelter", None)
        if shelter:
            apps = apps.filter(animal__shelter=shelter)
        return [
            {
                "id": app.id,
                "animal_id": app.animal.id,
                "animal_name": app.animal.name,
                "animal_species": app.animal.get_species_display(),
                "animal_breed": app.animal.breed,
                "animal_status": app.animal.get_status_display(),
                "animal_photo_url": self._animal_photo_url(app.animal),
                "animal_sex": app.animal.get_sex_display(),
                "animal_size": app.animal.get_size_display(),
                "animal_country": app.animal.country,
                "animal_region": app.animal.region,
                "animal_location": app.animal.location,
                "animal_shelter": app.animal.shelter.name,
                "status": app.get_status_display(),
                "status_key": app.status,
                "motivation": app.motivation,
                "official_adoption_date": app.official_adoption_date,
                "interview_date": app.interview_date,
                "home_visit_date": app.home_visit_date,
                "follow_up_due_date": app.follow_up_due_date,
                "follow_up_notes": app.follow_up_notes,
                "decision_notes": app.decision_notes,
                "created_at": app.created_at,
                "updated_at": app.updated_at,
            }
            for app in apps
        ]

    def _animal_photo_url(self, animal):
        return file_url_or_empty(animal.photo)

    def create(self, validated_data):
        identity_document = validated_data.pop("identity_document", None)
        adopter = super().create(validated_data)
        persist_uploaded_file(adopter, "identity_document", identity_document)
        adopter.save()
        return adopter

    def update(self, instance, validated_data):
        identity_document = validated_data.pop("identity_document", None)
        adopter = super().update(instance, validated_data)
        persist_uploaded_file(adopter, "identity_document", identity_document)
        adopter.save()
        return adopter


class AdoptionApplicationSerializer(serializers.ModelSerializer):
    animal_detail = PublicAnimalSerializer(source="animal", read_only=True)
    adopter_detail = AdopterSerializer(source="adopter", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = AdoptionApplication
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class PublicApplicationSerializer(serializers.Serializer):
    animal = serializers.PrimaryKeyRelatedField(queryset=Animal.objects.filter(is_public=True, adoption_ready=True))
    full_name = serializers.CharField(max_length=160)
    document_type = serializers.CharField(max_length=30, required=False, allow_blank=True)
    document = serializers.CharField(max_length=60)
    identity_document = serializers.FileField(required=True, allow_empty_file=False)
    phone = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    address = serializers.CharField(max_length=255)
    housing_type = serializers.CharField(max_length=80)
    owns_or_rents = serializers.CharField(max_length=80)
    has_pets = serializers.BooleanField()
    experience = serializers.CharField(allow_blank=True, required=False)
    motivation = serializers.CharField()

    def create(self, validated_data):
        animal = validated_data.pop("animal")
        password = validated_data.pop("password")
        motivation = validated_data.pop("motivation")
        email = normalize_email(validated_data["email"])
        validated_data["email"] = email
        user = find_user_for_login(email)
        created = user is None
        if created:
            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=validated_data["full_name"].split(" ")[0],
                password=password,
            )
        else:
            user.email = email
        if created:
            user.profile.role = UserProfile.Role.ADOPTER
            user.profile.phone = validated_data["phone"]
            user.profile.save()
        adopter, _ = Adopter.objects.update_or_create(
            email=email,
            defaults={**validated_data, "user": user},
        )
        application = AdoptionApplication.objects.create(
            animal=animal,
            adopter=adopter,
            motivation=motivation,
            status=AdoptionApplication.Status.PENDING,
        )
        animal.status = Animal.Status.ADOPTION_PROCESS
        animal.save(update_fields=["status", "updated_at"])
        return application


class AdopterRegistrationSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    document_type = serializers.ChoiceField(choices=["CC", "CE", "Pasaporte", "Otro"])
    document = serializers.CharField(max_length=60)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = normalize_email(value)
        conflicts = user_identity_conflicts(email=email, username=email)
        if conflicts:
            raise serializers.ValidationError(conflicts.get("email") or conflicts.get("username"))
        return email

    def validate(self, attrs):
        if Adopter.objects.filter(document_type=attrs["document_type"], document=attrs["document"]).exists():
            raise serializers.ValidationError({"document": "Este documento ya esta registrado."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            password=password,
        )
        user.profile.role = UserProfile.Role.ADOPTER
        user.profile.phone = validated_data["phone"]
        user.profile.save(update_fields=["role", "phone"])
        return Adopter.objects.create(
            user=user,
            full_name=f"{validated_data['first_name']} {validated_data['last_name']}".strip(),
            document_type=validated_data["document_type"],
            document=validated_data["document"],
            phone=validated_data["phone"],
            email=validated_data["email"],
        )

    def to_representation(self, instance):
        return {
            "account_type": "adopter",
            "email": instance.email,
            "message": "Cuenta creada. Podras adjuntar tu documento al iniciar una solicitud de adopcion.",
        }


class ShelterRegistrationSerializer(serializers.Serializer):
    shelter_name = serializers.CharField(max_length=180)
    organization_document = serializers.CharField(max_length=80)
    contact_first_name = serializers.CharField(max_length=80)
    contact_last_name = serializers.CharField(max_length=80)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    address = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = normalize_email(value)
        conflicts = user_identity_conflicts(email=email, username=email)
        if conflicts:
            raise serializers.ValidationError(conflicts.get("email") or conflicts.get("username"))
        return email

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")
        contact_name = f"{validated_data.pop('contact_first_name')} {validated_data.pop('contact_last_name')}".strip()
        shelter = Shelter.objects.create(
            name=validated_data["shelter_name"],
            organization_document=validated_data["organization_document"],
            contact_name=contact_name,
            email=validated_data["email"],
            phone=validated_data["phone"],
            address=validated_data["address"],
        )
        name_parts = contact_name.split(maxsplit=1)
        user = User.objects.create_user(
            username=shelter.code,
            email=validated_data["email"],
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else "",
            password=password,
        )
        user.profile.role = UserProfile.Role.ADMIN
        user.profile.phone = validated_data["phone"]
        user.profile.shelter = shelter
        user.profile.save(update_fields=["role", "phone", "shelter"])
        return shelter

    def to_representation(self, instance):
        return {
            "account_type": "shelter",
            "shelter_name": instance.name,
            "shelter_code": instance.code,
            "message": "Refugio registrado. Usa este codigo y tu contrasena para ingresar.",
        }


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def save(self, **kwargs):
        email = self.validated_data["email"].lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if not user:
            return
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/restablecer-contrasena/{uid}/{token}"
        send_mail(
            "Recupera tu contrasena de SIGERA",
            f"Recibimos una solicitud para restablecer tu contrasena. Usa este enlace: {reset_url}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("El enlace de recuperacion no es valido.")
        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError("El enlace de recuperacion vencio o ya fue utilizado.")
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])


class FlexibleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow shelter users to log in with either email or shelter code."""

    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        submitted_value = normalize_username(attrs.get("username"))
        if submitted_value:
            matched_user = find_user_for_login(submitted_value)
            if matched_user:
                attrs["username"] = matched_user.username
        return super().validate(attrs)
