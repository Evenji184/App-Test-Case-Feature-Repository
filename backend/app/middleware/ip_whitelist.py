from __future__ import annotations

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# 不受 IP 白名单限制的路径
_EXEMPT_PATHS: frozenset[str] = frozenset({"/health"})


def _get_client_ip(request: Request) -> str:
    """从请求中提取真实客户端 IP，优先读取代理头。"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host
    return "unknown"


async def ip_whitelist_middleware(request: Request, call_next) -> Response:
    settings = get_settings()
    whitelist = settings.get_ip_whitelist()

    if not whitelist:
        return await call_next(request)

    if request.url.path in _EXEMPT_PATHS:
        return await call_next(request)

    client_ip = _get_client_ip(request)

    if client_ip in whitelist:
        return await call_next(request)

    logger.warning("IP whitelist blocked: %s %s from %s", request.method, request.url.path, client_ip)
    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "error": {
                "code": "FORBIDDEN",
                "message": "访问被拒绝",
            },
        },
    )
