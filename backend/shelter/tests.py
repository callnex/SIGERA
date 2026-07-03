from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Animal, InventoryItem, MedicalRecord, Shelter, ShelterLocation, UserProfile


class TenantIsolationTests(APITestCase):
    def setUp(self):
        self.shelter_one = Shelter.objects.create(
            name="Refugio Uno",
            organization_document="NIT-001",
            contact_name="Admin Uno",
            email="uno@example.com",
            phone="3000000001",
            address="Bogota",
        )
        self.shelter_two = Shelter.objects.create(
            name="Refugio Dos",
            organization_document="NIT-002",
            contact_name="Admin Dos",
            email="dos@example.com",
            phone="3000000002",
            address="Medellin",
        )
        self.admin_one = self.create_staff("admin-uno", UserProfile.Role.ADMIN, self.shelter_one)
        self.vet_one = self.create_staff("vet-uno", UserProfile.Role.VET, self.shelter_one)
        Animal.objects.create(code="TENANT-ONE", name="Luna Uno", species=Animal.Species.DOG, shelter=self.shelter_one)
        Animal.objects.create(code="TENANT-TWO", name="Luna Dos", species=Animal.Species.CAT, shelter=self.shelter_two)
        InventoryItem.objects.create(name="Alimento Uno", category=InventoryItem.Category.FOOD, unit="kg", shelter=self.shelter_one)
        InventoryItem.objects.create(name="Alimento Dos", category=InventoryItem.Category.FOOD, unit="kg", shelter=self.shelter_two)

    def create_staff(self, username, role, shelter):
        user = User.objects.create_user(username=username, password="temporary-pass")
        user.profile.role = role
        user.profile.shelter = shelter
        user.profile.save(update_fields=["role", "shelter"])
        return user

    def test_admin_only_receives_its_shelter_records(self):
        self.client.force_authenticate(self.admin_one)

        animals = self.client.get("/api/animals/")
        inventory = self.client.get("/api/inventory-items/")

        self.assertEqual(animals.status_code, status.HTTP_200_OK)
        self.assertEqual([animal["name"] for animal in animals.data], ["Luna Uno"])
        self.assertEqual(inventory.status_code, status.HTTP_200_OK)
        self.assertEqual([item["name"] for item in inventory.data], ["Alimento Uno"])

    def test_admin_created_staff_inherits_the_admin_shelter(self):
        self.client.force_authenticate(self.admin_one)

        response = self.client.post(
            "/api/users/",
            {
                "username": "voluntario-uno",
                "email": "voluntario-uno@example.com",
                "first_name": "Voluntario",
                "last_name": "Uno",
                "password": "temporary-pass",
                "profile": {"role": "volunteer"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        profile = User.objects.get(username="voluntario-uno").profile
        self.assertEqual(profile.shelter, self.shelter_one)
        self.assertEqual(profile.role, UserProfile.Role.VOLUNTEER)

    def test_admin_can_create_staff_from_multipart_payload(self):
        self.client.force_authenticate(self.admin_one)

        response = self.client.post(
            "/api/users/",
            {
                "username": "antoni@example.com",
                "email": "antoni@example.com",
                "first_name": "Antoni",
                "last_name": "Malte",
                "password": "Temporary-pass-123",
                "phone": "322406454",
                "address": "Cra 54",
                "position": "Veterinario",
                "emergency_contact": "25412454",
                "emergency_phone": "5454254",
                "role": "vet",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(email="antoni@example.com")
        self.assertEqual(created_user.profile.role, UserProfile.Role.VET)
        self.assertEqual(created_user.profile.shelter, self.shelter_one)

    def test_admin_cannot_create_staff_with_case_insensitive_duplicate_email(self):
        User.objects.create_user(
            username="existing@example.com",
            email="existing@example.com",
            password="temporary-pass",
        )
        self.client.force_authenticate(self.admin_one)

        response = self.client.post(
            "/api/users/",
            {
                "username": "Existing@Example.com",
                "email": "Existing@Example.com",
                "first_name": "Existing",
                "last_name": "User",
                "password": "Temporary-pass-123",
                "role": "volunteer",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_veterinarian_can_access_inventory_and_medical_records(self):
        self.client.force_authenticate(self.vet_one)

        inventory = self.client.get("/api/inventory-items/")
        medical = self.client.get("/api/medical-records/")

        self.assertEqual(inventory.status_code, status.HTTP_200_OK)
        self.assertEqual(medical.status_code, status.HTTP_200_OK)

    def test_demo_reset_only_replaces_current_shelter_data(self):
        self.client.force_authenticate(self.admin_one)

        response = self.client.post("/api/demo/reset/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Animal.objects.filter(shelter=self.shelter_one).count(), 4)
        self.assertTrue(Animal.objects.filter(shelter=self.shelter_one, name="Luna", is_public=True).exists())
        self.assertEqual(Animal.objects.filter(shelter=self.shelter_two).count(), 1)
        self.assertTrue(InventoryItem.objects.filter(shelter=self.shelter_two, name="Alimento Dos").exists())

    def test_public_catalog_shows_the_animal_shelter_name(self):
        animal = Animal.objects.get(code="TENANT-ONE")
        animal.status = Animal.Status.AVAILABLE
        animal.adoption_ready = True
        animal.is_public = True
        animal.save(update_fields=["status", "adoption_ready", "is_public", "updated_at"])

        response = self.client.get("/api/catalog/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        public_animal = next(item for item in response.data if item["code"] == "TENANT-ONE")
        self.assertEqual(public_animal["shelter_name"], self.shelter_one.name)

    def test_staff_can_update_own_profile(self):
        self.client.force_authenticate(self.admin_one)
        admin_response = self.client.patch("/api/profile/", {"position": "Coordinadora", "phone": "3000000009"}, format="json")

        self.assertEqual(admin_response.status_code, status.HTTP_200_OK)
        self.admin_one.profile.refresh_from_db()
        self.assertEqual(self.admin_one.profile.position, "Coordinadora")

        self.client.force_authenticate(self.vet_one)
        vet_response = self.client.patch("/api/profile/", {"position": "Veterinario"}, format="json")
        self.assertEqual(vet_response.status_code, status.HTTP_200_OK)
        self.vet_one.profile.refresh_from_db()
        self.assertEqual(self.vet_one.profile.position, "Veterinario")

    def test_profile_update_rejects_duplicate_email_with_validation_error(self):
        duplicate_user = User.objects.create_user(
            username="duplicate@example.com",
            email="duplicate@example.com",
            password="temporary-pass",
        )
        duplicate_user.profile.role = UserProfile.Role.VOLUNTEER
        duplicate_user.profile.shelter = self.shelter_one
        duplicate_user.profile.save(update_fields=["role", "shelter"])

        self.client.force_authenticate(self.admin_one)
        response = self.client.patch("/api/profile/", {"email": "Duplicate@Example.com"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_shelter_admin_can_log_in_with_email_even_if_username_is_shelter_code(self):
        self.admin_one.email = "admin-uno@example.com"
        self.admin_one.save(update_fields=["email"])

        response = self.client.post(
            "/api/auth/token/",
            {"username": "ADMIN-UNO@example.com", "password": "temporary-pass"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_location_is_created_inside_the_administrator_shelter(self):
        self.client.force_authenticate(self.admin_one)

        response = self.client.post(
            "/api/locations/",
            {"name": "Canil Norte", "location_type": "kennel", "capacity": 8},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ShelterLocation.objects.get(name="Canil Norte").shelter, self.shelter_one)

    def test_inventory_output_cannot_exceed_available_stock(self):
        item = InventoryItem.objects.get(name="Alimento Uno")
        item.current_stock = 2
        item.save(update_fields=["current_stock"])
        self.client.force_authenticate(self.admin_one)

        response = self.client.post(
            "/api/inventory-movements/",
            {"item": item.id, "movement_type": "out", "quantity": 3, "reason": "Entrega diaria"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_export_medical_expedient_pdf_for_own_shelter(self):
        animal = Animal.objects.get(code="TENANT-ONE")
        MedicalRecord.objects.create(
            animal=animal,
            record_type=MedicalRecord.RecordType.CONSULTATION,
            diagnosis="Chequeo general",
            health_status=MedicalRecord.HealthStatus.HEALTHY,
            veterinarian=self.vet_one,
        )
        self.client.force_authenticate(self.admin_one)

        response = self.client.get(f"/api/animals/{animal.id}/medical-expedient.pdf")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("application/pdf", response["Content-Type"])
