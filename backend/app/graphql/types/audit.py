from __future__ import annotations

import strawberry

from app.graphql.types.common import PageInfo


@strawberry.type
class AuditLogType:
    id: str
    user_id: str | None
    request_id: str | None
    action: str
    target_type: str
    target_id: str | None
    target_name: str | None
    change_summary: str | None
    before_data: str | None
    after_data: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: str


@strawberry.type
class AuditLogListType:
    items: list[AuditLogType]
    page_info: PageInfo


@strawberry.type
class RequestLogType:
    id: str
    request_id: str
    user_id: str | None
    method: str
    path: str
    query_string: str | None
    request_body: str | None
    response_status: int
    duration_ms: int
    ip_address: str | None
    user_agent: str | None
    trace_id: str | None
    created_at: str


@strawberry.type
class RequestLogListType:
    items: list[RequestLogType]
    page_info: PageInfo
