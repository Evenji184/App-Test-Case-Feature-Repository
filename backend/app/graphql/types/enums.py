from __future__ import annotations

import strawberry


@strawberry.enum
class UserStatusEnum:
    ACTIVE = "active"
    DISABLED = "disabled"


@strawberry.enum
class RoleStatusEnum:
    ACTIVE = "active"
    DISABLED = "disabled"


@strawberry.enum
class FeatureStatusEnum:
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


@strawberry.enum
class PriorityEnum:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
