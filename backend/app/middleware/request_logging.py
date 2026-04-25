from __future__ import annotations

import json
import time
from typing import Any
from uuid import uuid4

from fastapi import Request

from app.core.logging import get_logger
from app.db.prisma import prisma_manager

logger = get_logger(__name__)


def _safe_json_dumps(data: Any, limit: int = 1000) -> str | None:
    if data is None:
        return None
    try:
        text = json.dumps(data, ensure_ascii=False, default=str)
    except Exception:
        text = str(data)
    return text[:limit]


async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    trace_id = str(uuid4())
    request.state.trace_id = trace_id
    request_body_text: str | None = None
    operation_name: str | None = None
    query_summary: str | None = None
    variables_summary: str | None = None

    if request.method in {"POST", "PUT", "PATCH"}:
        body = await request.body()
        request_body_text = body.decode("utf-8", errors="ignore")[:4000] if body else None
        if request.url.path.endswith("/graphql") and request_body_text:
            try:
                payload = json.loads(request_body_text)
                operation_name = payload.get("operationName")
                query_summary = (payload.get("query") or "")[:500]
                variables_summary = _safe_json_dumps(payload.get("variables"), limit=1000)
            except json.JSONDecodeError:
                pass

        async def receive() -> dict[str, Any]:
            return {"type": "http.request", "body": body, "more_body": False}

        request._receive = receive

    response = await call_next(request)
    duration_ms = int((time.perf_counter() - start) * 1000)
    user = getattr(request.state, "user", None)
    log_payload = {
        "timestamp": time.time(),
        "trace_id": trace_id,
        "request_id": getattr(request.state, "request_id", None),
        "method": request.method,
        "path": request.url.path,
        "operation_name": operation_name,
        "query_summary": query_summary,
        "variables_summary": variables_summary,
        "duration_ms": duration_ms,
        "user_id": getattr(user, "id", None),
        "username": getattr(user, "username", None),
        "status_code": response.status_code,
    }
    logger.info(_safe_json_dumps(log_payload, limit=4000) or "{}")

    prisma = prisma_manager.client
    if prisma.is_connected():
        try:
            await prisma.requestlog.create(
                data={
                    "request_id": getattr(request.state, "request_id", trace_id),
                    "user_id": getattr(user, "id", None),
                    "method": request.method,
                    "path": request.url.path,
                    "query_string": str(request.url.query) or None,
                    "request_body": _safe_json_dumps(
                        {
                            "operationName": operation_name,
                            "query": query_summary,
                            "variables": variables_summary,
                        },
                        limit=4000,
                    )
                    if request.url.path.endswith("/graphql")
                    else request_body_text,
                    "response_status": response.status_code,
                    "response_body": None,
                    "duration_ms": duration_ms,
                    "ip_address": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                    "trace_id": trace_id,
                }
            )
        except Exception as exc:
            logger.warning("request log persistence failed: %s", exc)

    response.headers["X-Trace-ID"] = trace_id
    return response
