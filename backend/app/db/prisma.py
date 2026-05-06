from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.logging import get_logger

if TYPE_CHECKING:
    from prisma import Prisma

logger = get_logger(__name__)


class PrismaManager:
    """Prisma 客户端生命周期管理。"""

    def __init__(self) -> None:
        self.client = self._create_client()

    @staticmethod
    def _create_client() -> Prisma:
        try:
            from prisma import Prisma
        except RuntimeError as exc:
            if "The Client hasn't been generated yet" not in str(exc):
                raise
            raise RuntimeError(
                "Prisma Client 尚未生成，无法启动后端。"
                "请先在 backend 目录执行 `python -m prisma generate`，"
                "或直接运行 `backend/scripts/init-db.sh` / `backend/scripts/init-db.bat` 完成初始化。"
            ) from exc

        return Prisma(auto_register=True)

    async def connect(self) -> None:
        if self.client.is_connected():
            return
        await self.client.connect()
        logger.info("Prisma client connected")

    async def disconnect(self) -> None:
        if not self.client.is_connected():
            return
        await self.client.disconnect()
        logger.info("Prisma client disconnected")

    async def healthcheck(self) -> bool:
        return self.client.is_connected()


prisma_manager = PrismaManager()
