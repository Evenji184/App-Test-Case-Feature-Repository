from __future__ import annotations

from typing import Optional

import strawberry

from app.graphql.types.common import MutationResult, PageInfo


@strawberry.type
class RoleType:
    id: str
    name: str
    code: str
    description: str | None
    is_system: bool
    status: str
    permission_ids: list[str]
    created_at: str
    updated_at: str


@strawberry.type
class RoleListType:
    items: list[RoleType]
    page_info: PageInfo


@strawberry.type
class RoleMutationResult(MutationResult):
    data: Optional[RoleType] = None


@strawberry.input
class CreateRoleInput:
    name: str
    code: str
    description: str | None = None
    is_system: bool = False


@strawberry.input
class UpdateRoleInput:
    name: str | None = None
    description: str | None = None
    status: str | None = None
