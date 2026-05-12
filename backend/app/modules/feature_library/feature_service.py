from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.modules.feature_library.node_service import NodeService
from app.utils.exceptions import ConflictError, NotFoundError
from app.utils.pagination import normalize_pagination


class FeatureService:
    @staticmethod
    async def _get_feature(prisma: Any, feature_id: str) -> Any:
        feature = await prisma.feature.find_first(where={"id": feature_id, "deleted_at": None})
        if not feature:
            raise NotFoundError("特征不存在", code="FEATURE_NOT_FOUND")
        return feature

    @staticmethod
    async def list_features(prisma: Any, *, page: int, page_size: int, keyword: str | None = None, node_ids: list[str] | None = None) -> tuple[list[Any], int, int, int]:
        current_page, current_page_size, skip = normalize_pagination(page, page_size)
        where: dict[str, Any] = {"deleted_at": None}
        if keyword:
            where["OR"] = [{"title": {"contains": keyword}}, {"code": {"contains": keyword}}, {"summary": {"contains": keyword}}]
        if node_ids:
            all_nodes = await prisma.featurenode.find_many(where={"deleted_at": None})
            selected_paths = [n.path for n in all_nodes if n.id in node_ids]
            expanded_ids: set[str] = set(node_ids)
            for n in all_nodes:
                for sp in selected_paths:
                    if n.path == sp or n.path.startswith(sp + "/"):
                        expanded_ids.add(n.id)
            where["node_id"] = {"in": list(expanded_ids)}
        total = await prisma.feature.count(where=where)
        items = await prisma.feature.find_many(where=where, skip=skip, take=current_page_size, order={"updated_at": "desc"})
        return items, total, current_page, current_page_size

    @staticmethod
    async def create_feature(prisma: Any, *, data: dict[str, Any], operator_id: str | None) -> Any:
        await NodeService._get_node(prisma, data["node_id"])
        return await prisma.feature.create(data={**data, "created_by": operator_id, "updated_by": operator_id})

    @staticmethod
    async def update_feature(prisma: Any, *, feature_id: str, data: dict[str, Any], operator_id: str | None, expected_updated_at: str | None = None) -> Any:
        feature = await FeatureService._get_feature(prisma, feature_id)
        if expected_updated_at is not None:
            current_updated_at = feature.updated_at.isoformat() if hasattr(feature.updated_at, "isoformat") else str(feature.updated_at)
            if current_updated_at != expected_updated_at:
                raise ConflictError("特征已被其他用户修改，请刷新后重试")
        return await prisma.feature.update(where={"id": feature_id}, data={**data, "updated_by": operator_id})

    @staticmethod
    async def delete_feature(prisma: Any, *, feature_id: str, operator_id: str | None) -> Any:
        await FeatureService._get_feature(prisma, feature_id)
        return await prisma.feature.update(where={"id": feature_id}, data={"deleted_at": datetime.now(timezone.utc), "deleted_by": operator_id})

    @staticmethod
    async def set_visibility(prisma: Any, *, feature_id: str, is_visible: bool, operator_id: str | None) -> Any:
        await FeatureService._get_feature(prisma, feature_id)
        return await prisma.feature.update(where={"id": feature_id}, data={"is_visible": is_visible, "updated_by": operator_id})

    @staticmethod
    async def copy_feature(prisma: Any, *, feature_id: str, target_node_id: str, operator_id: str | None) -> Any:
        feature = await FeatureService._get_feature(prisma, feature_id)
        await NodeService._get_node(prisma, target_node_id)
        return await prisma.feature.create(
            data={
                "node_id": target_node_id,
                "title": f"{feature.title} 副本",
                "code": f"{feature.code}_copy_{uuid4().hex[:6]}",
                "summary": feature.summary,
                "description": feature.description,
                "platform": feature.platform,
                "status": feature.status,
                "priority": feature.priority,
                "version": feature.version,
                "tags": feature.tags,
                "is_visible": feature.is_visible,
                "source_feature_id": feature.source_feature_id or feature.id,
                "copied_from_id": feature.id,
                "copy_operation_id": str(uuid4()),
                "last_copied_at": datetime.now(timezone.utc),
                "remark": feature.remark,
                "created_by": operator_id,
                "updated_by": operator_id,
            }
        )

    @staticmethod
    async def move_feature(prisma: Any, *, feature_id: str, target_node_id: str, operator_id: str | None) -> Any:
        feature = await FeatureService._get_feature(prisma, feature_id)
        await NodeService._get_node(prisma, target_node_id)
        return await prisma.feature.update(
            where={"id": feature_id},
            data={
                "node_id": target_node_id,
                "moved_from_node_id": feature.node_id,
                "move_operation_id": str(uuid4()),
                "last_moved_at": datetime.now(timezone.utc),
                "updated_by": operator_id,
            },
        )
