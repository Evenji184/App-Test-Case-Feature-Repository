from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """应用配置。

    统一管理环境变量，作为后续 GraphQL、RBAC、审计日志等模块的基础。
    """

    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(default="APP Feature Repository Backend", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    environment: Literal["development", "testing", "staging", "production"] = Field(
        default="development",
        alias="ENVIRONMENT",
    )
    debug: bool = Field(default=True, alias="DEBUG")

    # 后端服务地址
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8001, alias="PORT")

    # 前端服务地址（用于生成 CORS 和重定向）
    frontend_host: str = Field(default="localhost", alias="FRONTEND_HOST")
    frontend_port: int = Field(default=5173, alias="FRONTEND_PORT")
    frontend_scheme: str = Field(default="http", alias="FRONTEND_SCHEME")

    secret_key: str = Field(default="change-me-in-production", alias="SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    database_url: str = Field(
        default="mysql://evenji:evenji@localhost:3306/app_feature_repository",
        alias="DATABASE_URL",
    )

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_json: bool = Field(default=False, alias="LOG_JSON")

    # 跨域白名单：逗号分隔，显式配置优先；留空则根据 FRONTEND_HOST/PORT 自动生成
    cors_origins: str = Field(default="", alias="CORS_ORIGINS")

    # IP 访问白名单：逗号分隔；留空则允许所有 IP 访问
    ip_whitelist: str = Field(default="", alias="IP_WHITELIST")

    def get_cors_origins(self) -> list[str]:
        """返回最终 CORS origins：显式配置优先，否则根据前端地址自动生成。"""
        if self.cors_origins:
            return [s.strip() for s in self.cors_origins.split(",") if s.strip()]
        origins = [f"{self.frontend_scheme}://{self.frontend_host}:{self.frontend_port}"]
        if self.frontend_port in (80, 443):
            origins.append(f"{self.frontend_scheme}://{self.frontend_host}")
        return origins

    def get_ip_whitelist(self) -> list[str]:
        """返回 IP 白名单列表；空则允许所有。"""
        if self.ip_whitelist:
            return [s.strip() for s in self.ip_whitelist.split(",") if s.strip()]
        return []


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """返回缓存后的配置实例。"""

    return Settings()
