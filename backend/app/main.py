from __future__ import annotations

from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.core.config import get_settings
from app.core.context import get_graphql_context
from app.core.logging import get_logger, setup_logging
from app.db.prisma import prisma_manager
from app.graphql.schema import schema
from app.middleware.request_logging import request_logging_middleware
from app.middleware.ip_whitelist import ip_whitelist_middleware
from app.utils.exceptions import AppError

settings = get_settings()
setup_logging(settings)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Application startup")
    logger.info("CORS origins: %s", settings.get_cors_origins())
    logger.info("IP whitelist: %s", settings.get_ip_whitelist() or "(empty, allow all)")
    try:
        await prisma_manager.connect()
    except Exception as exc:  # pragma: no cover - 启动时记录错误，允许服务先启动
        logger.warning("Prisma connection skipped: %s", exc)
    yield
    await prisma_manager.disconnect()
    logger.info("Application shutdown")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def access_log_middleware(request: Request, call_next):
    return await request_logging_middleware(request, call_next)


@app.middleware("http")
async def ip_filter_middleware(request: Request, call_next):
    return await ip_whitelist_middleware(request, call_next)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request.state.request_id = str(uuid4())
    request.state.user = None
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.warning(
        "Application error: %s",
        exc.message,
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            "request_id": getattr(request.state, "request_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled server error",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "服务器内部错误",
            },
            "request_id": getattr(request.state, "request_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
    )


@app.get("/health", tags=["system"])
async def healthcheck() -> dict[str, object]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "database_connected": await prisma_manager.healthcheck(),
    }


graphql_app = GraphQLRouter(schema=schema, context_getter=get_graphql_context)
app.include_router(graphql_app, prefix="/graphql", tags=["graphql"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
