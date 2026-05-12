from __future__ import annotations

import json as json_lib
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ProviderConfig:
    request_url: str
    model_name: str
    api_key: str
    provider_format: str  # "openai_compatible" | "anthropic"


@dataclass
class GenerateResult:
    content: str
    model: str
    usage: dict[str, int] | None
    prompt_id: str | None = None


class ProviderClient:

    @staticmethod
    async def generate(
        config: ProviderConfig,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> GenerateResult:
        if config.provider_format == "anthropic":
            return await ProviderClient._call_anthropic(
                config,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        return await ProviderClient._call_openai_compatible(
            config,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    @staticmethod
    async def test_connection(config: ProviderConfig) -> dict[str, Any]:
        try:
            result = await ProviderClient.generate(
                config,
                system_prompt="You are a test assistant.",
                user_prompt="Reply with exactly: OK",
                temperature=0,
                max_tokens=10,
            )
            return {"success": True, "message": "连接测试成功", "model": result.model}
        except Exception as exc:
            logger.warning("AI provider connection test failed: %s", exc)
            return {"success": False, "message": f"连接测试失败: {exc}"}

    @staticmethod
    async def _send_request(url: str, payload: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
        """发送请求并解析JSON响应，禁用自动解码避免代理服务器错误Content-Encoding导致解压失败"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                response.decode_content = False
                raw_bytes = await response.aread()
                if not raw_bytes:
                    raise RuntimeError(f"AI 供应商返回空响应 (HTTP {response.status_code})")
                try:
                    data = json_lib.loads(raw_bytes)
                except (json_lib.JSONDecodeError, UnicodeDecodeError) as exc:
                    raise RuntimeError(f"AI 供应商响应解析失败: {exc}") from exc
                response.raise_for_status()
                if not isinstance(data, dict):
                    raise RuntimeError(f"AI 供应商响应格式异常: 期望 dict，得到 {type(data).__name__}")
                return data

    @staticmethod
    async def _call_openai_compatible(
        config: ProviderConfig,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> GenerateResult:
        url = config.request_url.rstrip("/")

        payload: dict[str, Any] = {
            "model": config.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
            "Accept-Encoding": "identity",
        }

        data = await ProviderClient._send_request(url, payload, headers)

        content = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
        usage = data.get("usage")
        return GenerateResult(
            content=content,
            model=data.get("model", config.model_name),
            usage={
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
            } if usage else None,
        )

    @staticmethod
    async def _call_anthropic(
        config: ProviderConfig,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> GenerateResult:
        url = config.request_url.rstrip("/")
        if not url.endswith("/v1/messages"):
            url += "/v1/messages"

        payload: dict[str, Any] = {
            "model": config.model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": user_prompt},
            ],
        }
        headers = {
            "x-api-key": config.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
            "Accept-Encoding": "identity",
        }

        data = await ProviderClient._send_request(url, payload, headers)

        content_blocks = data.get("content") or []
        text_parts = [block.get("text", "") for block in content_blocks if block.get("type") == "text" and block.get("text")]
        content = "\n".join(text_parts) if text_parts else ""
        usage = data.get("usage")
        return GenerateResult(
            content=content,
            model=data.get("model", config.model_name),
            usage={
                "prompt_tokens": usage.get("input_tokens", 0),
                "completion_tokens": usage.get("output_tokens", 0),
            } if usage else None,
        )