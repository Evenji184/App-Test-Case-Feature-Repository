from __future__ import annotations

from typing import Any, Callable

from strawberry.extensions.field_extension import FieldExtension
from strawberry.permission import BasePermission
from strawberry.types import Info

from app.modules.auth.dependencies import get_current_user, require_permission


class IsAuthenticated(BasePermission):
    message = "未认证"

    async def has_permission(self, source: Any, info: Info, **kwargs: Any) -> bool:
        await get_current_user(info)
        return True


class PermissionExtension(FieldExtension):
    def __init__(self, permission_code: str) -> None:
        self.permission_code = permission_code

    async def resolve_async(self, next_: Callable[..., Any], source: Any, info: Info, **kwargs: Any) -> Any:
        await require_permission(info, self.permission_code)
        return await next_(source, info, **kwargs)


async def require_permission_guard(info: Info, permission_code: str) -> Any:
    return await require_permission(info, permission_code)
