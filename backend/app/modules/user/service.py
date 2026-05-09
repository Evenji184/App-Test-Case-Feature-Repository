from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.core.security import hash_password
from app.utils.exceptions import NotFoundError, ValidationError
from app.utils.pagination import normalize_pagination

logger = logging.getLogger(__name__)


class UserService:
    @staticmethod
    async def list_users(prisma: Any, *, page: int, page_size: int, keyword: str | None = None) -> tuple[list[Any], int, int, int]:
        current_page, current_page_size, skip = normalize_pagination(page, page_size)
        where: dict[str, Any] = {"deleted_at": None}
        if keyword:
            where["OR"] = [
                {"username": {"contains": keyword}},
                {"email": {"contains": keyword}},
                {"display_name": {"contains": keyword}},
            ]
        total = await prisma.user.count(where=where)
        items = await prisma.user.find_many(
            where=where,
            skip=skip,
            take=current_page_size,
            order={"created_at": "desc"},
        )
        return items, total, current_page, current_page_size

    @staticmethod
    async def get_user_by_id(prisma: Any, user_id: str) -> Any:
        user = await prisma.user.find_first(where={"id": user_id, "deleted_at": None})
        if not user:
            raise NotFoundError("用户不存在", code="USER_NOT_FOUND")
        return user

    @staticmethod
    async def create_user(prisma: Any, *, data: dict[str, Any], operator_id: str | None) -> Any:
        existing = await prisma.user.find_first(
            where={"deleted_at": None, "OR": [{"username": data["username"]}, {"email": data["email"]}]}
        )
        if existing:
            raise ValidationError("用户名或邮箱已存在")
        try:
            return await prisma.user.create(
                data={
                    **{k: v for k, v in data.items() if k != "password"},
                    "password_hash": hash_password(data["password"]),
                    "status": data.get("status", "disabled"),
                    "created_by": operator_id,
                    "updated_by": operator_id,
                }
            )
        except Exception as exc:
            logger.error("创建用户数据库异常: %s", exc)
            raise ValidationError(f"创建用户失败: {exc}") from exc

    @staticmethod
    async def update_user(prisma: Any, *, user_id: str, data: dict[str, Any], operator_id: str | None) -> Any:
        await UserService.get_user_by_id(prisma, user_id)
        payload = {**data, "updated_by": operator_id}
        payload.pop("password", None)
        return await prisma.user.update(where={"id": user_id}, data=payload)

    @staticmethod
    async def set_user_status(prisma: Any, *, user_id: str, status: str, operator_id: str | None) -> Any:
        await UserService.get_user_by_id(prisma, user_id)
        return await prisma.user.update(where={"id": user_id}, data={"status": status, "updated_by": operator_id})

    @staticmethod
    async def assign_roles(prisma: Any, *, user_id: str, role_ids: list[str], operator_id: str | None) -> None:
        await UserService.get_user_by_id(prisma, user_id)
        existing = await prisma.userrole.find_many(where={"user_id": user_id, "deleted_at": None})
        for item in existing:
            await prisma.userrole.update(
                where={"id": item.id},
                data={"deleted_at": datetime.now(timezone.utc), "deleted_by": operator_id},
            )
        for role_id in role_ids:
            await prisma.userrole.create(
                data={"user_id": user_id, "role_id": role_id, "created_by": operator_id, "updated_by": operator_id}
            )
        if role_ids:
            await prisma.user.update(
                where={"id": user_id},
                data={"status": "active", "updated_by": operator_id},
            )
