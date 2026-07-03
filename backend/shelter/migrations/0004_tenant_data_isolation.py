from django.db import migrations, models
import django.db.models.deletion


def assign_existing_data_to_primary_shelter(apps, schema_editor):
    Shelter = apps.get_model("shelter", "Shelter")
    Animal = apps.get_model("shelter", "Animal")
    InventoryItem = apps.get_model("shelter", "InventoryItem")
    UserProfile = apps.get_model("shelter", "UserProfile")

    shelter, _ = Shelter.objects.get_or_create(
        code="SIG-PRIMARY",
        defaults={
            "name": "Refugio SIGERA Principal",
            "organization_document": "NIT-000000000",
            "contact_name": "Administracion SIGERA",
            "email": "admin@sigera.org",
            "phone": "+57 300 000 0000",
            "address": "Bogota D.C., Colombia",
        },
    )
    Animal.objects.filter(shelter__isnull=True).update(shelter=shelter)
    InventoryItem.objects.filter(shelter__isnull=True).update(shelter=shelter)
    UserProfile.objects.exclude(role="adopter").filter(shelter__isnull=True).update(shelter=shelter)


class Migration(migrations.Migration):

    dependencies = [
        ("shelter", "0003_animal_country_animal_region"),
    ]

    operations = [
        migrations.AddField(
            model_name="animal",
            name="shelter",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="animals", to="shelter.shelter"),
        ),
        migrations.AddField(
            model_name="inventoryitem",
            name="shelter",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="inventory_items", to="shelter.shelter"),
        ),
        migrations.RunPython(assign_existing_data_to_primary_shelter, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="animal",
            name="shelter",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="animals", to="shelter.shelter"),
        ),
        migrations.AlterField(
            model_name="inventoryitem",
            name="shelter",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="inventory_items", to="shelter.shelter"),
        ),
    ]
