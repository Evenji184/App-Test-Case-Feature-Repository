from __future__ import annotations

from typing import Optional

import strawberry

from app.graphql.types.common import MutationResult, PageInfo


@strawberry.type
class UserType:
    id: str
    username: str
    email: str
    display_name: str | None
    phone: str | None
    avatar_url: str | None
    status: str
    is_super_admin: bool
    last_login_at: str | None
    last_login_ip: str | None
    remark: str | None
    created_at: str
    updated_at: str


@strawberry.type
class UserListType:
    items: list[UserType]
    page_info: PageInfo


@strawberry.type
class UserMutationResult(MutationResult):
    data: Optional[UserType] = None


@strawberry.input
class CreateUserInput:
    username: str
    email: str
    password: str
    display_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    remark: str | None = None
    is_super_admin: bool = False


@strawberry.input
class UpdateUserInput:
    email: str | None = None
    display_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    remark: str | None = None
    is_super_admin: bool | None = None
