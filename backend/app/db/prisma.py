from __future__ import annotations

from prisma import Prisma

from app.core.logging import get_logger

logger = get_logger(__name__)


class PrismaManager:
    """Prisma 客户端生命周期管理。"""

    def __init__(self) -> None:
        self.client = Prisma(auto_register=True)

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
