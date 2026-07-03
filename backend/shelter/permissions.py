from rest_framework.permissions import SAFE_METHODS, BasePermission

STAFF_ROLES = {"admin", "volunteer", "vet"}


def role(user):
    return getattr(getattr(user, "profile", None), "role", None)


def shelter(user):
    return getattr(getattr(user, "profile", None), "shelter", None)


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and role(request.user) == "admin"
            and shelter(request.user)
        )


class InternalReadWriteByRole(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not shelter(request.user):
            return False
        user_role = role(request.user)
        if request.method in SAFE_METHODS:
            return user_role in getattr(view, "read_roles", STAFF_ROLES)
        return user_role in getattr(view, "write_roles", {"admin"})
