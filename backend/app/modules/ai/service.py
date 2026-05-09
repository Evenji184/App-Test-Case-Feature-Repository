from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.logging import get_logger
from app.modules.ai.encryption import decrypt_api_key, encrypt_api_key, mask_api_key
from app.modules.ai.prompt_builder import build_generate_prompt
from app.modules.ai.provider_client import GenerateResult, ProviderClient, ProviderConfig
from app.utils.exceptions import NotFoundError, ValidationError
from app.utils.pagination import normalize_pagination

logger = get_logger(__name__)


class AiProviderService:

    @staticmethod
    async def _get_provider(prisma: Any, provider_id: str) -> Any:
        provider = await prisma.aiprovider.find_first(
            where={"id": provider_id, "deleted_at": None}
        )
        if not provider:
            raise NotFoundError("AI 供应商不存在", code="AI_PROVIDER_NOT_FOUND")
        return provider

    @staticmethod
    async def list_providers(
        prisma: Any, *, page: int, page_size: int
    ) -> tuple[list[Any], int, int, int]:
        current_page, current_page_size, skip = normalize_pagination(page, page_size)
        where: dict[str, Any] = {"deleted_at": None}
        total = await prisma.aiprovider.count(where=where)
        items = await prisma.aiprovider.find_many(
            where=where,
            skip=skip,
            take=current_page_size,
            order={"created_at": "desc"},
        )
        return items, total, current_page, current_page_size

    @staticmethod
    async def create_provider(
        prisma: Any, *, data: dict[str, Any], operator_id: str | None
    ) -> Any:
        raw_api_key = data.get("api_key", "")
        if not raw_api_key:
            raise ValidationError("API Key 不能为空")
        encrypted = encrypt_api_key(raw_api_key)
        hint = mask_api_key(raw_api_key)

        return await prisma.aiprovider.create(
            data={
                "name": data["name"],
                "website_url": data.get("website_url"),
                "api_key_encrypted": encrypted,
                "api_key_hint": hint,
                "request_url": data["request_url"],
                "model_name": data["model_name"],
                "provider_format": data.get("provider_format", "openai_compatible"),
                "is_default": data.get("is_default", False),
                "status": data.get("status", "active"),
                "remark": data.get("remark"),
                "created_by": operator_id,
                "updated_by": operator_id,
            }
        )

    @staticmethod
    async def update_provider(
        prisma: Any, *, provider_id: str, data: dict[str, Any], operator_id: str | None
    ) -> Any:
        await AiProviderService._get_provider(prisma, provider_id)
        payload: dict[str, Any] = {"updated_by": operator_id}

        raw_api_key = data.get("api_key")
        if raw_api_key:
            payload["api_key_encrypted"] = encrypt_api_key(raw_api_key)
            payload["api_key_hint"] = mask_api_key(raw_api_key)

        for field in (
            "name", "website_url", "request_url", "model_name",
            "provider_format", "is_default", "status", "remark",
        ):
            if field in data:
                payload[field] = data[field]

        if payload.get("is_default"):
            await prisma.aiprovider.update_many(
                where={"is_default": True, "deleted_at": None},
                data={"is_default": False, "updated_by": operator_id},
            )

        return await prisma.aiprovider.update(
            where={"id": provider_id}, data=payload
        )

    @staticmethod
    async def delete_provider(
        prisma: Any, *, provider_id: str, operator_id: str | None
    ) -> Any:
        await AiProviderService._get_provider(prisma, provider_id)
        return await prisma.aiprovider.update(
            where={"id": provider_id},
            data={
                "deleted_at": datetime.now(timezone.utc),
                "deleted_by": operator_id,
            },
        )

    @staticmethod
    async def test_connection(prisma: Any, *, provider_id: str) -> dict[str, Any]:
        provider = await AiProviderService._get_provider(prisma, provider_id)
        config = ProviderConfig(
            request_url=provider.request_url,
            model_name=provider.model_name,
            api_key=decrypt_api_key(provider.api_key_encrypted),
            provider_format=provider.provider_format,
        )
        return await ProviderClient.test_connection(config)

    @staticmethod
    async def generate_test_cases(
        prisma: Any,
        *,
        provider_id: str,
        node_ids: list[str],
        feature_ids: list[str],
        custom_instruction: str | None = None,
    ) -> GenerateResult:
        provider = await AiProviderService._get_provider(prisma, provider_id)

        # Collect nodes
        node_ids_set = set(node_ids)
        nodes_raw = await prisma.featurenode.find_many(
            where={"id": {"in": list(node_ids_set)}, "deleted_at": None}
        )
        # Fetch parent nodes for path context
        parent_ids = {n.parent_id for n in nodes_raw if n.parent_id}
        if parent_ids - node_ids_set:
            extra_nodes = await prisma.featurenode.find_many(
                where={"id": {"in": list(parent_ids - node_ids_set)}, "deleted_at": None}
            )
            nodes_raw = list(nodes_raw) + list(extra_nodes)

        # Collect features
        feature_where: dict[str, Any] = {"deleted_at": None}
        if feature_ids:
            feature_where["id"] = {"in": feature_ids}
        elif node_ids:
            feature_where["node_id"] = {"in": list(node_ids_set)}
        else:
            raise ValidationError("请至少选择一个节点或特征")

        features_raw = await prisma.feature.find_many(where=feature_where)

        if not features_raw:
            raise ValidationError("所选范围内没有找到特征数据")

        nodes_dicts = [
            {
                "id": n.id,
                "name": n.name,
                "code": n.code,
                "node_type": n.node_type,
                "path": n.path,
            }
            for n in nodes_raw
        ]
        features_dicts = [
            {
                "id": f.id,
                "title": f.title,
                "code": f.code,
                "summary": f.summary,
                "description": f.description,
                "platform": f.platform,
                "status": f.status,
                "priority": f.priority,
                "tags": f.tags,
                "node_id": f.node_id,
            }
            for f in features_raw
        ]

        system_prompt, user_prompt = build_generate_prompt(
            nodes=nodes_dicts,
            features=features_dicts,
            custom_instruction=custom_instruction,
        )

        config = ProviderConfig(
            request_url=provider.request_url,
            model_name=provider.model_name,
            api_key=decrypt_api_key(provider.api_key_encrypted),
            provider_format=provider.provider_format,
        )

        logger.info(
            "Generating test cases: provider=%s, nodes=%d, features=%d",
            provider.name, len(nodes_dicts), len(features_dicts),
        )
        return await ProviderClient.generate(
            config,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
