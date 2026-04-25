from __future__ import annotations

from typing import Any

from strawberry.types import Info

from app.core.security import decode_access_token
from app.modules.rbac.service import RBACService
from app.utils.exceptions import AuthenticationError, AuthorizationError


async def get_current_user(info: Info) -> Any:
    if info.context.user is not None:
        return info.context.user
    authorization = info.context.request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise AuthenticationError()
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise AuthenticationError() from exc
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError()
    user = await info.context.prisma.user.find_first(where={"id": user_id, "deleted_at": None})
    if not user or user.status != "active":
        raise AuthenticationError()
    info.context.user = user
    info.context.permissions = await RBACService.get_user_permissions(info.context.prisma, user.id)
    info.context.request.state.user = user
    return user


async def require_permission(info: Info, permission_code: str) -> Any:
    user = await get_current_user(info)
    if getattr(user, "is_super_admin", False):
        return user
    permissions = info.context.permissions or await RBACService.get_user_permissions(info.context.prisma, user.id)
    if permission_code not in permissions:
        raise AuthorizationError(f"缺少权限: {permission_code}")
    return user
