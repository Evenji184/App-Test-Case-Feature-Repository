from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.utils.exceptions import NotFoundError
from app.utils.pagination import normalize_pagination


class NodeService:
    @staticmethod
    async def _get_node(prisma: Any, node_id: str) -> Any:
        node = await prisma.featurenode.find_first(where={"id": node_id, "deleted_at": None})
        if not node:
            raise NotFoundError("节点不存在", code="NODE_NOT_FOUND")
        return node

    @staticmethod
    async def list_nodes(prisma: Any, *, page: int, page_size: int, keyword: str | None = None) -> tuple[list[Any], int, int, int]:
        current_page, current_page_size, skip = normalize_pagination(page, page_size)
        where: dict[str, Any] = {"deleted_at": None}
        if keyword:
            where["OR"] = [{"name": {"contains": keyword}}, {"code": {"contains": keyword}}, {"path": {"contains": keyword}}]
        total = await prisma.featurenode.count(where=where)
        items = await prisma.featurenode.find_many(where=where, skip=skip, take=current_page_size, order={"sort_order": "asc"})
        return items, total, current_page, current_page_size

    @staticmethod
    async def get_node_tree(prisma: Any) -> list[Any]:
        return await prisma.featurenode.find_many(where={"deleted_at": None}, order=[{"level": "asc"}, {"sort_order": "asc"}])

    @staticmethod
    async def create_node(prisma: Any, *, data: dict[str, Any], operator_id: str | None) -> Any:
        parent = None
        if data.get("parent_id"):
            parent = await NodeService._get_node(prisma, data["parent_id"])
        path = f"/{data['code']}" if not parent else f"{parent.path}/{data['code']}"
        level = 1 if not parent else parent.level + 1
        return await prisma.featurenode.create(data={**data, "path": path, "level": level, "created_by": operator_id, "updated_by": operator_id})

    @staticmethod
    async def update_node(prisma: Any, *, node_id: str, data: dict[str, Any], operator_id: str | None) -> Any:
        node = await NodeService._get_node(prisma, node_id)
        payload = {**data, "updated_by": operator_id}
        if "parent_id" in data:
            parent = await NodeService._get_node(prisma, data["parent_id"]) if data["parent_id"] else None
            payload["path"] = f"/{node.code}" if not parent else f"{parent.path}/{payload.get('code', node.code)}"
            payload["level"] = 1 if not parent else parent.level + 1
        elif "code" in data:
            parent = await NodeService._get_node(prisma, node.parent_id) if node.parent_id else None
            payload["path"] = f"/{data['code']}" if not parent else f"{parent.path}/{data['code']}"
        return await prisma.featurenode.update(where={"id": node_id}, data=payload)

    @staticmethod
    async def delete_node(prisma: Any, *, node_id: str, operator_id: str | None) -> Any:
        await NodeService._get_node(prisma, node_id)
        return await prisma.featurenode.update(where={"id": node_id}, data={"deleted_at": datetime.now(timezone.utc), "deleted_by": operator_id})

    @staticmethod
    async def set_visibility(prisma: Any, *, node_id: str, is_visible: bool, operator_id: str | None) -> Any:
        await NodeService._get_node(prisma, node_id)
        return await prisma.featurenode.update(where={"id": node_id}, data={"is_visible": is_visible, "updated_by": operator_id})

    @staticmethod
    async def copy_node(prisma: Any, *, node_id: str, target_parent_id: str | None, new_name: str | None, operator_id: str | None) -> Any:
        node = await NodeService._get_node(prisma, node_id)
        parent = await NodeService._get_node(prisma, target_parent_id) if target_parent_id else None
        code = f"{node.code}_copy_{uuid4().hex[:6]}"
        path = f"/{code}" if not parent else f"{parent.path}/{code}"
        return await prisma.featurenode.create(
            data={
                "parent_id": target_parent_id,
                "name": new_name or f"{node.name} 副本",
                "code": code,
                "node_type": node.node_type,
                "path": path,
                "level": 1 if not parent else parent.level + 1,
                "sort_order": node.sort_order,
                "is_visible": node.is_visible,
                "source_node_id": node.source_node_id or node.id,
                "copied_from_node_id": node.id,
                "copy_operation_id": str(uuid4()),
                "remark": node.remark,
                "created_by": operator_id,
                "updated_by": operator_id,
            }
        )

    @staticmethod
    async def move_node(prisma: Any, *, node_id: str, target_parent_id: str | None, operator_id: str | None) -> Any:
        node = await NodeService._get_node(prisma, node_id)
        parent = await NodeService._get_node(prisma, target_parent_id) if target_parent_id else None
        path = f"/{node.code}" if not parent else f"{parent.path}/{node.code}"
        return await prisma.featurenode.update(
            where={"id": node_id},
            data={
                "parent_id": target_parent_id,
                "path": path,
                "level": 1 if not parent else parent.level + 1,
                "moved_from_node_id": node.parent_id,
                "move_operation_id": str(uuid4()),
                "updated_by": operator_id,
            },
        )
