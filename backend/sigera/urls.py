from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from shelter import views

router = DefaultRouter()
router.register("animals", views.AnimalViewSet)
router.register("medical-records", views.MedicalRecordViewSet)
router.register("inventory-items", views.InventoryItemViewSet)
router.register("inventory-movements", views.InventoryMovementViewSet)
router.register("adopters", views.AdopterViewSet)
router.register("adoption-applications", views.AdoptionApplicationViewSet)
router.register("users", views.UserViewSet)
router.register("locations", views.ShelterLocationViewSet)
router.register("tasks", views.ShelterTaskViewSet)
router.register("audit-logs", views.AuditLogViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/register/adopter/", views.AdopterRegistrationView.as_view(), name="register_adopter"),
    path("api/auth/register/shelter/", views.ShelterRegistrationView.as_view(), name="register_shelter"),
    path("api/auth/password-reset/", views.PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("api/auth/password-reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("api/auth/me/", views.MeView.as_view(), name="me"),
    path("api/profile/", views.MyProfileView.as_view(), name="my_profile"),
    path("api/adopter/me/", views.AdopterMeView.as_view(), name="adopter_me"),
    path("api/shelter-settings/", views.ShelterSettingsView.as_view(), name="shelter_settings"),
    path("api/catalog/", views.PublicCatalogView.as_view(), name="public_catalog"),
    path("api/catalog/<int:pk>/", views.PublicAnimalDetailView.as_view(), name="public_animal_detail"),
    path("api/reports/summary/", views.ReportSummaryView.as_view(), name="report_summary"),
    path("api/reports/adoptions.pdf", views.AdoptionReportPdfView.as_view(), name="adoption_report_pdf"),
    path("api/animals/<int:pk>/medical-expedient.pdf", views.MedicalExpedientPdfView.as_view(), name="medical_expedient_pdf"),
    path("api/demo/reset/", views.DemoDataResetView.as_view(), name="demo_data_reset"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/", include(router.urls)),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
