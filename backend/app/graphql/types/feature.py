from __future__ import annotations

from typing import Optional

import strawberry

from app.graphql.types.common import MutationResult, PageInfo


@strawberry.type
class FeatureType:
    id: str
    node_id: str
    title: str
    code: str
    summary: str | None
    description: str | None
    platform: str | None
    status: str
    priority: str
    version: str | None
    tags: str | None
    is_visible: bool
    is_archived: bool
    remark: str | None
    created_at: str
    updated_at: str


@strawberry.type
class FeatureListType:
    items: list[FeatureType]
    page_info: PageInfo


@strawberry.type
class FeatureMutationResult(MutationResult):
    data: Optional[FeatureType] = None


@strawberry.input
class CreateFeatureInput:
    node_id: str
    title: str
    code: str
    summary: str | None = None
    description: str | None = None
    platform: str | None = None
    status: str = "draft"
    priority: str = "medium"
    version: str | None = None
    tags: str | None = None
    remark: str | None = None


@strawberry.input
class UpdateFeatureInput:
    node_id: str | None = None
    title: str | None = None
    code: str | None = None
    summary: str | None = None
    description: str | None = None
    platform: str | None = None
    status: str | None = None
    priority: str | None = None
    version: str | None = None
    tags: str | None = None
    remark: str | None = None
