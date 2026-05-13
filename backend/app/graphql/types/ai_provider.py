from __future__ import annotations

from typing import Optional

import strawberry

from app.graphql.types.common import MutationResult, PageInfo


@strawberry.type
class AiProviderType:
    id: str
    name: str
    website_url: str | None
    api_key_hint: str
    request_url: str
    model_name: str
    provider_format: str
    is_default: bool
    status: str
    remark: str | None
    created_at: str
    updated_at: str


@strawberry.type
class AiProviderListType:
    items: list[AiProviderType]
    page_info: PageInfo


@strawberry.type
class AiProviderMutationResult(MutationResult):
    data: Optional[AiProviderType] = None


@strawberry.type
class AiGenerateResult(MutationResult):
    content: Optional[str] = None
    model: Optional[str] = None
    usage: Optional[str] = None


@strawberry.type
class PromptType:
    id: str
    name: str | None
    content: str
    provider_id: str
    provider_name: str
    model: str | None
    created_by_id: str | None
    created_by_name: str | None
    node_ids: str | None
    feature_ids: str | None
    custom_instruction: str | None
    created_at: str
    updated_at: str


@strawberry.type
class PromptListType:
    items: list[PromptType]
    page_info: PageInfo


@strawberry.input
class CreateAiProviderInput:
    name: str
    website_url: str | None = None
    api_key: str
    request_url: str
    model_name: str
    provider_format: str = "openai_compatible"
    is_default: bool = False
    status: str = "active"
    remark: str | None = None


@strawberry.input
class UpdateAiProviderInput:
    name: str | None = None
    website_url: str | None = None
    api_key: str | None = None
    request_url: str | None = None
    model_name: str | None = None
    provider_format: str | None = None
    is_default: bool | None = None
    status: str | None = None
    remark: str | None = None


@strawberry.input
class GeneratePromptInput:
    provider_id: str
    name: str | None = None
    node_ids: list[str] = strawberry.field(default_factory=list)
    feature_ids: list[str] = strawberry.field(default_factory=list)
    custom_instruction: str | None = None