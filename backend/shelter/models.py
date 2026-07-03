from decimal import Decimal

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
import secrets


def shelter_code():
    return f"SIG-{secrets.token_hex(3).upper()}"


class Shelter(models.Model):
    code = models.CharField(max_length=12, unique=True, editable=False, default=shelter_code)
    name = models.CharField(max_length=180)
    organization_document = models.CharField(max_length=80, blank=True)
    contact_name = models.CharField(max_length=160)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    address = models.CharField(max_length=255)
    country = models.CharField(max_length=2, default="CO")
    region = models.CharField(max_length=80, default="Bogota D.C.")
    capacity = models.PositiveIntegerField(default=0)
    operating_hours = models.CharField(max_length=180, blank=True)
    public_description = models.TextField(blank=True)
    adoption_policy = models.TextField(blank=True)
    notification_email = models.EmailField(blank=True)
    notify_stock_alerts = models.BooleanField(default=True)
    notify_medical_alerts = models.BooleanField(default=True)
    logo = models.ImageField(upload_to="shelters/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = shelter_code()
        while Shelter.objects.exclude(pk=self.pk).filter(code=self.code).exists():
            self.code = shelter_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class UserProfile(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrador"
        VOLUNTEER = "volunteer", "Voluntario"
        VET = "vet", "Veterinario"
        ADOPTER = "adopter", "Adoptante"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ADOPTER)
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    position = models.CharField(max_length=120, blank=True)
    emergency_contact = models.CharField(max_length=160, blank=True)
    emergency_phone = models.CharField(max_length=30, blank=True)
    profile_photo = models.ImageField(upload_to="profiles/", blank=True)
    is_active_staff = models.BooleanField(default=True)
    shelter = models.ForeignKey(Shelter, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.get_role_display()}"


class ShelterLocation(models.Model):
    class LocationType(models.TextChoices):
        KENNEL = "kennel", "Canil"
        CATTERY = "cattery", "Gateria"
        MEDICAL = "medical", "Area medica"
        QUARANTINE = "quarantine", "Cuarentena"
        OTHER = "other", "Otra"

    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="locations")
    name = models.CharField(max_length=120)
    location_type = models.CharField(max_length=30, choices=LocationType.choices, default=LocationType.OTHER)
    capacity = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["shelter", "name"], name="unique_shelter_location_name")]

    def __str__(self):
        return f"{self.shelter.name} - {self.name}"


class Animal(models.Model):
    class Species(models.TextChoices):
        DOG = "dog", "Perro"
        CAT = "cat", "Gato"
        OTHER = "other", "Otro"

    class Sex(models.TextChoices):
        MALE = "male", "Macho"
        FEMALE = "female", "Hembra"
        UNKNOWN = "unknown", "Desconocido"

    class Size(models.TextChoices):
        SMALL = "small", "Pequeno"
        MEDIUM = "medium", "Mediano"
        LARGE = "large", "Grande"

    class Status(models.TextChoices):
        INTAKE = "intake", "Ingresado"
        OBSERVATION = "observation", "En observacion"
        TREATMENT = "treatment", "En tratamiento"
        AVAILABLE = "available", "Disponible"
        ADOPTION_PROCESS = "adoption_process", "En proceso de adopcion"
        ADOPTED = "adopted", "Adoptado"
        DECEASED = "deceased", "Fallecido"
        LOST = "lost", "Perdido"

    code = models.CharField(max_length=20, unique=True)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="animals")
    name = models.CharField(max_length=120)
    species = models.CharField(max_length=20, choices=Species.choices)
    breed = models.CharField(max_length=120, blank=True)
    sex = models.CharField(max_length=20, choices=Sex.choices, default=Sex.UNKNOWN)
    size = models.CharField(max_length=20, choices=Size.choices, default=Size.MEDIUM)
    approximate_age = models.CharField(max_length=80, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    color = models.CharField(max_length=120, blank=True)
    intake_date = models.DateField(default=timezone.now)
    intake_reason = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=120, blank=True)
    location_ref = models.ForeignKey(ShelterLocation, on_delete=models.SET_NULL, null=True, blank=True, related_name="animals")
    country = models.CharField(max_length=2, default="CO")
    region = models.CharField(max_length=80, default="Bogota D.C.")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.INTAKE)
    behavior_notes = models.TextField(blank=True)
    public_description = models.TextField(blank=True)
    personality_tags = models.CharField(max_length=255, blank=True)
    vaccinated = models.BooleanField(default=False)
    sterilized = models.BooleanField(default=False)
    dewormed = models.BooleanField(default=False)
    adoption_ready = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    photo = models.ImageField(upload_to="animals/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class MedicalRecord(models.Model):
    class RecordType(models.TextChoices):
        CONSULTATION = "consultation", "Consulta general"
        VACCINE = "vaccine", "Vacunacion"
        DEWORMING = "deworming", "Desparasitacion"
        TREATMENT = "treatment", "Tratamiento"
        SURGERY = "surgery", "Cirugia"

    class HealthStatus(models.TextChoices):
        HEALTHY = "healthy", "Saludable"
        TREATMENT = "treatment", "En tratamiento"
        RECOVERY = "recovery", "En recuperacion"
        CRITICAL = "critical", "Critico"
        NOT_READY = "not_ready", "No apto para adopcion"
        READY = "ready", "Apto para adopcion"

    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name="medical_records")
    record_type = models.CharField(max_length=30, choices=RecordType.choices)
    date = models.DateField(default=timezone.now)
    diagnosis = models.CharField(max_length=255)
    medication = models.CharField(max_length=120, blank=True)
    dosage = models.CharField(max_length=120, blank=True)
    veterinarian = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    health_status = models.CharField(max_length=30, choices=HealthStatus.choices, default=HealthStatus.HEALTHY)
    next_event = models.CharField(max_length=160, blank=True)
    next_event_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    attachment = models.FileField(upload_to="medical-records/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.animal.name} - {self.get_record_type_display()} - {self.date}"


class InventoryItem(models.Model):
    class Category(models.TextChoices):
        FOOD = "food", "Alimentos"
        MEDICINE = "medicine", "Medicamentos"
        CLEANING = "cleaning", "Limpieza"
        OTHER = "other", "Otros"

    name = models.CharField(max_length=160)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="inventory_items")
    brand = models.CharField(max_length=120, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices)
    unit = models.CharField(max_length=40)
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    supplier = models.CharField(max_length=160, blank=True)
    storage_location = models.CharField(max_length=120, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="COP")
    stock_status_override = models.CharField(
        max_length=20,
        blank=True,
        choices=[("", "Automatico"), ("ok", "Optimo"), ("low", "Bajo"), ("critical", "Critico")],
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name"]

    @property
    def stock_status(self):
        if self.stock_status_override:
            return self.stock_status_override
        if self.current_stock <= self.minimum_stock:
            return "critical"
        if self.current_stock <= self.minimum_stock * Decimal("1.25"):
            return "low"
        return "ok"

    def __str__(self):
        return self.name


class InventoryMovement(models.Model):
    class MovementType(models.TextChoices):
        IN = "in", "Entrada"
        OUT = "out", "Salida"

    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="movements")
    movement_type = models.CharField(max_length=10, choices=MovementType.choices)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=160, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            if self.movement_type == self.MovementType.IN:
                self.item.current_stock += self.quantity
            else:
                self.item.current_stock -= self.quantity
            self.item.save(update_fields=["current_stock", "updated_at"])


class Adopter(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="adopter_profile")
    full_name = models.CharField(max_length=160)
    document_type = models.CharField(max_length=30, blank=True)
    document = models.CharField(max_length=60)
    identity_document = models.FileField(upload_to="adopter-documents/", blank=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField()
    address = models.CharField(max_length=255, blank=True)
    housing_type = models.CharField(max_length=80, blank=True)
    owns_or_rents = models.CharField(max_length=80, blank=True)
    has_pets = models.BooleanField(default=False)
    experience = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class AdoptionApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        REVIEW = "review", "En revision"
        INTERVIEW = "interview", "Entrevista"
        HOME_VISIT = "home_visit", "Visita domiciliaria"
        APPROVED = "approved", "Aprobada"
        REJECTED = "rejected", "Rechazada"
        FORMALIZED = "formalized", "Formalizada"
        FOLLOW_UP = "follow_up", "Seguimiento"

    animal = models.ForeignKey(Animal, on_delete=models.PROTECT, related_name="adoption_applications")
    adopter = models.ForeignKey(Adopter, on_delete=models.PROTECT, related_name="applications")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    motivation = models.TextField()
    official_adoption_date = models.DateField(null=True, blank=True)
    shelter_responsible = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    follow_up_notes = models.TextField(blank=True)
    decision_notes = models.TextField(blank=True)
    interview_date = models.DateTimeField(null=True, blank=True)
    home_visit_date = models.DateTimeField(null=True, blank=True)
    follow_up_due_date = models.DateField(null=True, blank=True)
    contract_document = models.FileField(upload_to="adoption-contracts/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.animal.name} - {self.adopter.full_name}"


class ShelterTask(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        IN_PROGRESS = "in_progress", "En proceso"
        COMPLETED = "completed", "Completada"
        CANCELLED = "cancelled", "Cancelada"

    class Priority(models.TextChoices):
        LOW = "low", "Baja"
        MEDIUM = "medium", "Media"
        HIGH = "high", "Alta"
        URGENT = "urgent", "Urgente"

    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    due_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tasks")
    animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_tasks")
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["status", "due_date", "-created_at"]

    def __str__(self):
        return self.title


class AuditLog(models.Model):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="audit_logs")
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=120)
    entity_type = models.CharField(max_length=80)
    entity_id = models.PositiveIntegerField(null=True, blank=True)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action}: {self.description}"
