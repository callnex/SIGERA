from django.contrib import admin

from .models import (
    Adopter,
    AdoptionApplication,
    Animal,
    InventoryItem,
    InventoryMovement,
    MedicalRecord,
    Shelter,
    UserProfile,
)

admin.site.register(UserProfile)
admin.site.register(Shelter)
admin.site.register(Animal)
admin.site.register(MedicalRecord)
admin.site.register(InventoryItem)
admin.site.register(InventoryMovement)
admin.site.register(Adopter)
admin.site.register(AdoptionApplication)
