from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from shelter.models import (
    Adopter,
    AdoptionApplication,
    Animal,
    InventoryItem,
    InventoryMovement,
    MedicalRecord,
    Shelter,
    UserProfile,
)


class Command(BaseCommand):
    help = "Carga datos iniciales para probar SIGERA."

    def handle(self, *args, **options):
        shelter = self.shelter()
        admin = self.user("admin@sigera.org", "Administrador", "SIGERA", UserProfile.Role.ADMIN, True, shelter)
        vet = self.user("vet@sigera.org", "Elena", "Martinez", UserProfile.Role.VET, False, shelter)
        volunteer = self.user("voluntario@sigera.org", "Carlos", "Gomez", UserProfile.Role.VOLUNTEER, False, shelter)

        luna = self.animal(
            shelter=shelter,
            code="CAN-4921",
            name="Luna",
            species=Animal.Species.DOG,
            breed="Golden Retriever Mix",
            sex=Animal.Sex.FEMALE,
            size=Animal.Size.LARGE,
            approximate_age="3 anos",
            weight_kg=28,
            color="Dorado",
            intake_reason="Rescate urbano",
            location="Pabellon A, Jaula 4",
            status=Animal.Status.AVAILABLE,
            behavior_notes="Docil, carinosa y sociable con ninos.",
            public_description="Luna es una companera afectuosa, juguetona y tranquila. Busca una familia que disfrute paseos y tardes en casa.",
            personality_tags="Carinosa,Juguetona,Sociable,Buena con ninos,Energia media",
            vaccinated=True,
            sterilized=True,
            dewormed=True,
            adoption_ready=True,
            is_public=True,
            photo="animals/luna.png",
        )
        simba = self.animal(
            shelter=shelter,
            code="FEL-2026-102",
            name="Simba",
            species=Animal.Species.CAT,
            breed="Domestico pelo corto",
            sex=Animal.Sex.MALE,
            size=Animal.Size.SMALL,
            approximate_age="4 meses",
            color="Negro y blanco",
            intake_reason="Abandono",
            location="Gateria Principal",
            status=Animal.Status.AVAILABLE,
            public_description="Simba es curioso y tranquilo. Necesita un hogar paciente donde pueda sentirse seguro.",
            personality_tags="Curioso,Tranquilo,Tierno",
            vaccinated=True,
            sterilized=True,
            dewormed=False,
            adoption_ready=True,
            is_public=True,
            photo="animals/simba.png",
        )
        toby = self.animal(
            shelter=shelter,
            code="CAN-2026-350",
            name="Toby",
            species=Animal.Species.DOG,
            breed="Terrier Mix",
            sex=Animal.Sex.MALE,
            size=Animal.Size.MEDIUM,
            approximate_age="5 anos",
            color="Marron",
            location="Pabellon B, Jaula 12",
            status=Animal.Status.ADOPTED,
            public_description="Toby es leal y tranquilo, ideal para paseos relajados.",
            vaccinated=True,
            sterilized=False,
            dewormed=True,
            adoption_ready=False,
            is_public=False,
        )
        self.animal(
            shelter=shelter,
            code="FEL-2026-115",
            name="Milo",
            species=Animal.Species.CAT,
            breed="Tabby",
            sex=Animal.Sex.MALE,
            size=Animal.Size.SMALL,
            approximate_age="1 ano",
            status=Animal.Status.AVAILABLE,
            location="Gateria Principal",
            public_description="Milo es observador, dulce y perfecto para un hogar calmado.",
            vaccinated=True,
            adoption_ready=True,
            is_public=True,
            photo="animals/milo.png",
        )
        self.animal(
            shelter=shelter,
            code="CAN-2026-120",
            name="Zeus",
            species=Animal.Species.DOG,
            breed="Pastor Aleman",
            sex=Animal.Sex.MALE,
            size=Animal.Size.LARGE,
            approximate_age="2 anos",
            status=Animal.Status.TREATMENT,
            location="Area medica",
            adoption_ready=False,
        )

        MedicalRecord.objects.get_or_create(
            animal=luna,
            record_type=MedicalRecord.RecordType.VACCINE,
            date=date.today() - timedelta(days=10),
            diagnosis="Vacunacion multiple de refuerzo",
            medication="Vanguard Plus 5/L",
            dosage="1 ml SC",
            veterinarian=vet,
            health_status=MedicalRecord.HealthStatus.READY,
            next_event="Rabia (refuerzo)",
            next_event_date=date.today() + timedelta(days=5),
        )
        MedicalRecord.objects.get_or_create(
            animal=luna,
            record_type=MedicalRecord.RecordType.TREATMENT,
            date=date.today() - timedelta(days=2),
            diagnosis="Otitis externa leve",
            medication="Otomax",
            dosage="4 gotas c/12h",
            veterinarian=vet,
            health_status=MedicalRecord.HealthStatus.TREATMENT,
            notes="Limpieza y aplicacion de gotas.",
        )

        food = self.item(shelter, "Croquetas Perro Adulto", "Marca XYZ", InventoryItem.Category.FOOD, "kg", 125, 50)
        cleaning = self.item(shelter, "Desinfectante de Pisos", "Cloro concentrado", InventoryItem.Category.CLEANING, "L", 15, 20)
        vaccine = self.item(shelter, "Vacuna Antirrabica", "Refrigeracion requerida", InventoryItem.Category.MEDICINE, "dosis", 2, 15)
        self.item(shelter, "Gasas Esteriles", "Paquetes de 100", InventoryItem.Category.MEDICINE, "paquetes", 45, 20)
        self.movement(food, InventoryMovement.MovementType.IN, 25, "Donacion", volunteer)
        self.movement(cleaning, InventoryMovement.MovementType.OUT, 5, "Limpieza diaria", volunteer)
        self.movement(vaccine, InventoryMovement.MovementType.OUT, 1, "Aplicacion medica", vet)

        maria = self.adopter("Maria Rodriguez", "45.678.123", "+57 300 123 4567", "maria.r@email.com")
        carlos = self.adopter("Carlos Garcia", "12345678A", "+57 311 987 6543", "carlos.g@email.com")
        laura = self.adopter("Laura Mendez", "78.901.234", "+57 310 555 2323", "laura.m@email.com")
        AdoptionApplication.objects.get_or_create(animal=luna, adopter=maria, defaults={"motivation": "Quiere darle un hogar estable.", "status": AdoptionApplication.Status.PENDING})
        AdoptionApplication.objects.get_or_create(animal=simba, adopter=carlos, defaults={"motivation": "Tiene experiencia con gatos.", "status": AdoptionApplication.Status.APPROVED})
        AdoptionApplication.objects.get_or_create(
            animal=toby,
            adopter=laura,
            defaults={
                "motivation": "Busca companero tranquilo.",
                "status": AdoptionApplication.Status.FORMALIZED,
                "official_adoption_date": timezone.now().date(),
                "shelter_responsible": admin,
            },
        )

        self.stdout.write(self.style.SUCCESS("Datos iniciales cargados. Usuario: admin@sigera.org / Sigera123*"))

    def shelter(self):
        shelter, _ = Shelter.objects.get_or_create(
            code="SIG-PRINCIPAL",
            defaults={
                "name": "Refugio SIGERA Principal",
                "organization_document": "NIT-000000000",
                "contact_name": "Administracion SIGERA",
                "email": "admin@sigera.org",
                "phone": "+57 300 000 0000",
                "address": "Bogota D.C., Colombia",
            },
        )
        return shelter

    def user(self, email, first_name, last_name, role, superuser=False, shelter=None):
        user, created = User.objects.get_or_create(
            username=email,
            defaults={"email": email, "first_name": first_name, "last_name": last_name, "is_staff": superuser, "is_superuser": superuser},
        )
        if created:
            user.set_password("Sigera123*")
            user.save()
        user.profile.role = role
        user.profile.is_active_staff = True
        user.profile.shelter = shelter
        user.profile.save(update_fields=["role", "is_active_staff", "shelter"])
        return user

    def animal(self, **data):
        animal, _ = Animal.objects.update_or_create(code=data["code"], defaults=data)
        return animal

    def item(self, shelter, name, brand, category, unit, stock, minimum):
        item, _ = InventoryItem.objects.update_or_create(
            name=name,
            shelter=shelter,
            defaults={"brand": brand, "category": category, "unit": unit, "current_stock": stock, "minimum_stock": minimum},
        )
        return item

    def movement(self, item, movement_type, quantity, reason, user):
        if not InventoryMovement.objects.filter(item=item, movement_type=movement_type, reason=reason).exists():
            InventoryMovement.objects.create(item=item, movement_type=movement_type, quantity=quantity, reason=reason, created_by=user)

    def adopter(self, full_name, document, phone, email):
        adopter, _ = Adopter.objects.update_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "document": document,
                "phone": phone,
                "address": "Direccion registrada",
                "housing_type": "Casa",
                "owns_or_rents": "Propietario",
                "has_pets": True,
                "experience": "Experiencia previa con mascotas.",
            },
        )
        return adopter
