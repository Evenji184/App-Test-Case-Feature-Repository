from __future__ import annotations

from typing import Optional

import strawberry

from app.graphql.types.common import ErrorType, MutationResult


@strawberry.type
class AuthUserType:
    id: str
    username: str
    email: str
    display_name: str | None
    status: str
    is_super_admin: bool


@strawberry.type
class LoginPayload:
    access_token: str
    token_type: str
    permissions: list[str]
    user: AuthUserType


@strawberry.type
class LoginResult(MutationResult):
    data: Optional[LoginPayload] = None

