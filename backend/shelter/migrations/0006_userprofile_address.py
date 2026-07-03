from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shelter", "0005_adoptionapplication_contract_document_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="address",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
