from __future__ import annotations

from collections import defaultdict
from typing import Any


class RBACService:
    @staticmethod
    async def get_user_permissions(prisma: Any, user_id: str) -> set[str]:
        user_roles = await prisma.userrole.find_many(
            where={"user_id": user_id, "deleted_at": None},
            include={
                "role": {
                    "include": {
                        "role_permissions": {
                            "where": {"deleted_at": None},
                            "include": {"permission": True},
                        }
                    }
                }
            },
        )
        permissions: set[str] = set()
        for user_role in user_roles:
            role = getattr(user_role, "role", None)
            if not role or getattr(role, "deleted_at", None) is not None or getattr(role, "status", None) != "active":
                continue
            for role_permission in getattr(role, "role_permissions", []):
                permission = getattr(role_permission, "permission", None)
                if permission and getattr(permission, "deleted_at", None) is None:
                    permissions.add(permission.code)
        return permissions

    @staticmethod
    async def user_has_permission(prisma: Any, user: Any, permission_code: str) -> bool:
        if not user:
            return False
        if getattr(user, "is_super_admin", False):
            return True
        permissions = await RBACService.get_user_permissions(prisma, user.id)
        return permission_code in permissions

    @staticmethod
    async def get_permission_tree(prisma: Any) -> list[dict[str, Any]]:
        permissions = await prisma.permission.find_many(where={"deleted_at": None}, order={"module": "asc"})
        grouped: dict[str, dict[str, list[dict[str, Any]]]] = defaultdict(lambda: defaultdict(list))
        for permission in permissions:
            grouped[permission.module][permission.resource].append(
                {
                    "id": permission.id,
                    "name": permission.name,
                    "code": permission.code,
                    "module": permission.module,
                    "resource": permission.resource,
                    "action": permission.action,
                    "description": permission.description,
                }
            )
        result: list[dict[str, Any]] = []
        for module, resources in grouped.items():
            result.append(
                {
                    "module": module,
                    "resources": [
                        {"resource": resource, "permissions": items}
                        for resource, items in resources.items()
                    ],
                }
            )
        return result
