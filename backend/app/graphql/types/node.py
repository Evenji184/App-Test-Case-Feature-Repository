from __future__ import annotations

from typing import Optional

import strawberry

from app.graphql.types.common import MutationResult, PageInfo


@strawberry.type
class NodeType:
    id: str
    parent_id: str | None
    name: str
    code: str
    node_type: str
    path: str
    level: int
    sort_order: int
    is_visible: bool
    is_locked: bool
    remark: str | None
    created_at: str
    updated_at: str


@strawberry.type
class NodeTreeType:
    id: str
    parent_id: str | None
    name: str
    code: str
    node_type: str
    path: str
    level: int
    sort_order: int
    is_visible: bool
    children: list["NodeTreeType"]


@strawberry.type
class NodeListType:
    items: list[NodeType]
    page_info: PageInfo


@strawberry.type
class NodeMutationResult(MutationResult):
    data: Optional[NodeType] = None


@strawberry.input
class CreateNodeInput:
    parent_id: str | None = None
    name: str
    code: str
    node_type: str = "folder"
    sort_order: int = 0
    remark: str | None = None


@strawberry.input
class UpdateNodeInput:
    parent_id: str | None = None
    name: str | None = None
    code: str | None = None
    node_type: str | None = None
    sort_order: int | None = None
    remark: str | None = None
