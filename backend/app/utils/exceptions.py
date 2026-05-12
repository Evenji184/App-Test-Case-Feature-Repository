from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class AppError(Exception):
    message: str
    code: str = "APP_ERROR"
    status_code: int = 400
    details: dict[str, Any] | None = None

    def __str__(self) -> str:
        return self.message


class AuthenticationError(AppError):
    def __init__(self, message: str = "未认证或登录已失效") -> None:
        super().__init__(message=message, code="AUTHENTICATION_ERROR", status_code=401)


class AuthorizationError(AppError):
    def __init__(self, message: str = "无权限执行该操作") -> None:
        super().__init__(message=message, code="AUTHORIZATION_ERROR", status_code=403)


class NotFoundError(AppError):
    def __init__(self, message: str = "资源不存在", code: str = "NOT_FOUND") -> None:
        super().__init__(message=message, code=code, status_code=404)


class ValidationError(AppError):
    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message=message, code="VALIDATION_ERROR", status_code=422, details=details)


class ConflictError(AppError):
    def __init__(self, message: str = "数据已被其他用户修改，请刷新后重试") -> None:
        super().__init__(message=message, code="CONFLICT", status_code=409)
