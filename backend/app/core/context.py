from __future__ import annotations

from typing import Any

from fastapi import Request
from strawberry.fastapi import BaseContext

from app.db.prisma import prisma_manager


class GraphQLContext(BaseContext):
    """GraphQL 请求上下文。"""

    prisma: Any
    request_id: str
    user: dict[str, Any] | None = None
    permissions: set[str] | None = None
    trace_id: str | None = None


async def get_graphql_context(request: Request) -> GraphQLContext:
    """构建 Strawberry GraphQLcontext。"""

    request_id = getattr(request.state, "request_id", "unknown")
    user = getattr(request.state, "user", None)
    ctx = GraphQLContext()
    ctx.request = request
    ctx.prisma = prisma_manager.client
    ctx.request_id = request_id
    ctx.user = user
    ctx.permissions = None
    ctx.trace_id = getattr(request.state, "trace_id", None)
    return ctx