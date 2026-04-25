from __future__ import annotations

import json
from typing import Any


class AuditService:
    @staticmethod
    async def log_operation(
        prisma: Any,
        *,
        request_id: str | None,
        user_id: str | None,
        action: str,
        target_type: str,
        target_id: str | None = None,
        target_name: str | None = None,
        change_summary: str | None = None,
        before_data: dict[str, Any] | None = None,
        after_data: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        await prisma.auditlog.create(
            data={
                "request_id": request_id,
                "user_id": user_id,
                "action": action,
                "target_type": target_type,
                "target_id": target_id,
                "target_name": target_name,
                "change_summary": change_summary,
                "before_data": json.dumps(before_data, ensure_ascii=False) if before_data else None,
                "after_data": json.dumps(after_data, ensure_ascii=False) if after_data else None,
                "ip_address": ip_address,
                "user_agent": user_agent,
            }
        )

    @staticmethod
    async def log_login(
        prisma: Any,
        *,
        username: str,
        user_id: str | None,
        login_status: str,
        failure_reason: str | None,
        ip_address: str | None,
        user_agent: str | None,
    ) -> None:
        await prisma.loginlog.create(
            data={
                "username": username,
                "user_id": user_id,
                "login_status": login_status,
                "failure_reason": failure_reason,
                "ip_address": ip_address,
                "user_agent": user_agent,
            }
        )
