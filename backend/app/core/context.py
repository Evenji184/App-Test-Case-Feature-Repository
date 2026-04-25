from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Request

from app.db.prisma import prisma_manager


@dataclass(slots=True)
class GraphQLContext:
    """GraphQL 请求上下文。

    后续可在此扩展用户权限、审计信息、DataLoader 等能力。
    """

    request: Request
    prisma: Any
    request_id: str
    user: dict[str, Any] | None = None
    permissions: set[str] | None = None
    trace_id: str | None = None


async def get_graphql_context(request: Request) -> GraphQLContext:
    """构建 Strawberry GraphQL context。"""

    request_id = getattr(request.state, "request_id", "unknown")
    user = getattr(request.state, "user", None)
    return GraphQLContext(
        request=request,
        prisma=prisma_manager.client,
        request_id=request_id,
        user=user,
        permissions=None,
        trace_id=getattr(request.state, "trace_id", None),
    )
