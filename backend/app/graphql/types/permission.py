from __future__ import annotations

import strawberry


@strawberry.type
class PermissionType:
    id: str
    name: str
    code: str
    module: str
    resource: str
    action: str
    description: str | None


@strawberry.type
class PermissionResourceGroup:
    resource: str
    permissions: list[PermissionType]


@strawberry.type
class PermissionModuleGroup:
    module: str
    resources: list[PermissionResourceGroup]
