from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.audit.service import AuditService
from app.modules.rbac.service import RBACService
from app.utils.exceptions import AuthenticationError, ValidationError


class AuthService:
    @staticmethod
    async def authenticate(prisma: Any, *, username: str, password: str, request_meta: dict[str, str | None]) -> dict[str, Any]:
        user = await prisma.user.find_first(where={"username": username, "deleted_at": None})
        if not user or not verify_password(password, user.password_hash):
            await AuditService.log_login(
                prisma,
                username=username,
                user_id=None,
                login_status="failed",
                failure_reason="用户名或密码错误",
                ip_address=request_meta.get("ip_address"),
                user_agent=request_meta.get("user_agent"),
            )
            raise AuthenticationError("用户名或密码错误")
        if user.status != "active":
            raise AuthenticationError("用户已被禁用")

        await prisma.user.update(
            where={"id": user.id},
            data={
                "last_login_at": datetime.now(timezone.utc),
                "last_login_ip": request_meta.get("ip_address"),
            },
        )
        permissions = await RBACService.get_user_permissions(prisma, user.id)
        token = create_access_token({"sub": user.id, "username": user.username})
        await AuditService.log_login(
            prisma,
            username=username,
            user_id=user.id,
            login_status="success",
            failure_reason=None,
            ip_address=request_meta.get("ip_address"),
            user_agent=request_meta.get("user_agent"),
        )
        return {"user": user, "access_token": token, "permissions": sorted(permissions)}

    @staticmethod
    async def reset_password(prisma: Any, *, user_id: str, new_password: str, operator_id: str | None) -> None:
        if len(new_password) < 6:
            raise ValidationError("密码长度不能少于 6 位")
        await prisma.user.update(
            where={"id": user_id},
            data={"password_hash": hash_password(new_password), "updated_by": operator_id},
        )

    @staticmethod
    async def change_password(prisma: Any, *, user_id: str, old_password: str, new_password: str) -> None:
        user = await prisma.user.find_first(where={"id": user_id, "deleted_at": None})
        if not user:
            raise AuthenticationError("用户不存在")
        if not verify_password(old_password, user.password_hash):
            raise ValidationError("旧密码不正确")
        if len(new_password) < 6:
            raise ValidationError("密码长度不能少于 6 位")
        await prisma.user.update(
            where={"id": user_id},
            data={"password_hash": hash_password(new_password), "updated_by": user_id},
        )
