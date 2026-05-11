from __future__ import annotations

from typing import Any

import strawberry
from strawberry.types import Info

from app.core.logging import get_logger
from app.graphql.directives.auth import IsAuthenticated
from app.graphql.types.audit import AuditLogListType, AuditLogType, LoginLogListType, LoginLogType, RequestLogListType, RequestLogType
from app.graphql.types.auth import AuthUserType, LoginPayload, LoginResult
from app.graphql.types.common import ErrorType, MutationResult, PageInfo, PaginationInput
from app.graphql.types.feature import CreateFeatureInput, FeatureListType, FeatureMutationResult, FeatureType, UpdateFeatureInput
from app.graphql.types.node import CreateNodeInput, NodeListType, NodeMutationResult, NodeTreeType, NodeType, UpdateNodeInput
from app.graphql.types.permission import PermissionModuleGroup, PermissionResourceGroup, PermissionType
from app.graphql.types.role import CreateRoleInput, RoleListType, RoleMutationResult, RoleType, UpdateRoleInput
from app.graphql.types.user import CreateUserInput, UpdateUserInput, UserListType, UserMutationResult, UserType
from app.graphql.types.ai_provider import AiGenerateResult, AiProviderListType, AiProviderMutationResult, AiProviderType, CreateAiProviderInput, GenerateTestCasesInput, UpdateAiProviderInput
from app.modules.ai.service import AiProviderService
from app.modules.audit.service import AuditService
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.auth.service import AuthService
from app.modules.feature_library.feature_service import FeatureService
from app.modules.feature_library.node_service import NodeService
from app.modules.rbac.service import RBACService
from app.modules.user.service import UserService
from app.utils.exceptions import AppError
from app.utils.pagination import build_page_info
from app.utils.tree import build_tree

logger = get_logger(__name__)


def _dt(value: Any) -> str | None:
    return value.isoformat() if value else None


def _error_result(exc: AppError) -> ErrorType:
    return ErrorType(code=exc.code, message=exc.message)


async def _user_type_with_roles(prisma: Any, user: Any) -> UserType:
    user_roles = await prisma.userrole.find_many(where={"user_id": user.id, "deleted_at": None})
    role_ids = [ur.role_id for ur in user_roles]
    return UserType(id=user.id, username=user.username, email=user.email, display_name=user.display_name, phone=user.phone, avatar_url=user.avatar_url, status=user.status, is_super_admin=user.is_super_admin, role_ids=role_ids, last_login_at=_dt(user.last_login_at), last_login_ip=user.last_login_ip, remark=user.remark, created_at=_dt(user.created_at) or "", updated_at=_dt(user.updated_at) or "")


async def _role_type_with_permissions(prisma: Any, role: Any) -> RoleType:
    role_permissions = await prisma.rolepermission.find_many(where={"role_id": role.id, "deleted_at": None})
    permission_ids = [rp.permission_id for rp in role_permissions]
    return RoleType(id=role.id, name=role.name, code=role.code, description=role.description, is_system=role.is_system, status=role.status, permission_ids=permission_ids, created_at=_dt(role.created_at) or "", updated_at=_dt(role.updated_at) or "")


def _auth_user_type(user: Any) -> AuthUserType:
    return AuthUserType(id=user.id, username=user.username, email=user.email, display_name=user.display_name, status=user.status, is_super_admin=user.is_super_admin)


def _role_type(role: Any) -> RoleType:
    return RoleType(id=role.id, name=role.name, code=role.code, description=role.description, is_system=role.is_system, status=role.status, created_at=_dt(role.created_at) or "", updated_at=_dt(role.updated_at) or "")


def _node_type(node: Any) -> NodeType:
    return NodeType(id=node.id, parent_id=node.parent_id, name=node.name, code=node.code, node_type=node.node_type, path=node.path, level=node.level, sort_order=node.sort_order, is_visible=node.is_visible, is_locked=node.is_locked, remark=node.remark, created_at=_dt(node.created_at) or "", updated_at=_dt(node.updated_at) or "")


def _feature_type(feature: Any) -> FeatureType:
    return FeatureType(id=feature.id, node_id=feature.node_id, title=feature.title, code=feature.code, summary=feature.summary, description=feature.description, platform=feature.platform, status=feature.status, priority=feature.priority, version=feature.version, tags=feature.tags, is_visible=feature.is_visible, is_archived=feature.is_archived, remark=feature.remark, created_at=_dt(feature.created_at) or "", updated_at=_dt(feature.updated_at) or "")


def _audit_type(item: Any) -> AuditLogType:
    return AuditLogType(id=item.id, user_id=item.user_id, request_id=item.request_id, action=item.action, target_type=item.target_type, target_id=item.target_id, target_name=item.target_name, change_summary=item.change_summary, before_data=item.before_data, after_data=item.after_data, ip_address=item.ip_address, user_agent=item.user_agent, created_at=_dt(item.created_at) or "")


def _request_log_type(item: Any) -> RequestLogType:
    return RequestLogType(id=item.id, request_id=item.request_id, user_id=item.user_id, method=item.method, path=item.path, query_string=item.query_string, request_body=item.request_body, response_status=item.response_status, duration_ms=item.duration_ms, ip_address=item.ip_address, user_agent=item.user_agent, trace_id=item.trace_id, created_at=_dt(item.created_at) or "")


def _login_log_type(item: Any) -> LoginLogType:
    return LoginLogType(id=item.id, user_id=item.user_id, username=item.username, login_type=item.login_type, login_status=item.login_status, failure_reason=item.failure_reason, ip_address=item.ip_address, user_agent=item.user_agent, occurred_at=_dt(item.occurred_at) or "")


def _ai_provider_type(provider: Any) -> AiProviderType:
    return AiProviderType(id=provider.id, name=provider.name, website_url=provider.website_url, api_key_hint=provider.api_key_hint, request_url=provider.request_url, model_name=provider.model_name, provider_format=provider.provider_format, is_default=provider.is_default, status=provider.status, remark=provider.remark, created_at=_dt(provider.created_at) or "", updated_at=_dt(provider.updated_at) or "")


async def _audit_log(info: Info, *, action: str, target_type: str, target: Any, summary: str, before_data: dict[str, Any] | None = None, after_data: dict[str, Any] | None = None) -> None:
    request = info.context.request
    user = info.context.user
    await AuditService.log_operation(info.context.prisma, request_id=info.context.request_id, user_id=getattr(user, "id", None), action=action, target_type=target_type, target_id=getattr(target, "id", None), target_name=getattr(target, "name", None) or getattr(target, "title", None) or getattr(target, "username", None), change_summary=summary, before_data=before_data, after_data=after_data, ip_address=request.client.host if request.client else None, user_agent=request.headers.get("user-agent"))


@strawberry.type
class Query:
    @strawberry.field(permission_classes=[IsAuthenticated])
    async def current_user(self, info: Info) -> UserType:
        return await _user_type_with_roles(info.context.prisma, await get_current_user(info))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def user_list(self, info: Info, pagination: PaginationInput = PaginationInput(), keyword: str | None = None) -> UserListType:
        await require_permission(info, "user:list")
        items, total, page, page_size = await UserService.list_users(info.context.prisma, page=pagination.page, page_size=pagination.page_size, keyword=keyword)
        return UserListType(items=[await _user_type_with_roles(info.context.prisma, item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=page, page_size=page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def role_list(self, info: Info, pagination: PaginationInput = PaginationInput()) -> RoleListType:
        await require_permission(info, "role:list")
        total = await info.context.prisma.role.count(where={"deleted_at": None})
        items = await info.context.prisma.role.find_many(where={"deleted_at": None}, skip=(pagination.page - 1) * pagination.page_size, take=pagination.page_size, order={"created_at": "desc"})
        return RoleListType(items=[await _role_type_with_permissions(info.context.prisma, item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=pagination.page, page_size=pagination.page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def permission_tree(self, info: Info) -> list[PermissionModuleGroup]:
        await require_permission(info, "permission:list")
        tree = await RBACService.get_permission_tree(info.context.prisma)
        return [PermissionModuleGroup(module=module["module"], resources=[PermissionResourceGroup(resource=resource["resource"], permissions=[PermissionType(**permission) for permission in resource["permissions"]]) for resource in module["resources"]]) for module in tree]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def node_tree(self, info: Info) -> list[NodeTreeType]:
        await require_permission(info, "node:list")
        nodes = await NodeService.get_node_tree(info.context.prisma)
        tree = build_tree([{"id": item.id, "parent_id": item.parent_id, "name": item.name, "code": item.code, "node_type": item.node_type, "path": item.path, "level": item.level, "sort_order": item.sort_order, "is_visible": item.is_visible} for item in nodes])

        def convert(items: list[dict[str, Any]]) -> list[NodeTreeType]:
            return [NodeTreeType(**{**item, "children": convert(item["children"])}) for item in items]

        return convert(tree)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def node_list(self, info: Info, pagination: PaginationInput = PaginationInput()) -> NodeListType:
        await require_permission(info, "node:list")
        items, total, page, page_size = await NodeService.list_nodes(info.context.prisma, page=pagination.page, page_size=pagination.page_size)
        return NodeListType(items=[_node_type(item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=page, page_size=page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def node_detail(self, info: Info, node_id: str) -> NodeType:
        await require_permission(info, "node:detail")
        return _node_type(await NodeService._get_node(info.context.prisma, node_id))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def search_nodes(self, info: Info, keyword: str, pagination: PaginationInput = PaginationInput()) -> NodeListType:
        await require_permission(info, "node:list")
        items, total, page, page_size = await NodeService.list_nodes(info.context.prisma, page=pagination.page, page_size=pagination.page_size, keyword=keyword)
        return NodeListType(items=[_node_type(item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=page, page_size=page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def feature_list(self, info: Info, pagination: PaginationInput = PaginationInput(), node_ids: list[str] | None = None) -> FeatureListType:
        await require_permission(info, "feature:list")
        items, total, page, page_size = await FeatureService.list_features(info.context.prisma, page=pagination.page, page_size=pagination.page_size, node_ids=node_ids)
        return FeatureListType(items=[_feature_type(item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=page, page_size=page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def feature_detail(self, info: Info, feature_id: str) -> FeatureType:
        await require_permission(info, "feature:detail")
        return _feature_type(await FeatureService._get_feature(info.context.prisma, feature_id))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def search_features(self, info: Info, keyword: str, pagination: PaginationInput = PaginationInput()) -> FeatureListType:
        await require_permission(info, "feature:list")
        items, total, page, page_size = await FeatureService.list_features(info.context.prisma, page=pagination.page, page_size=pagination.page_size, keyword=keyword)
        return FeatureListType(items=[_feature_type(item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=page, page_size=page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def audit_log_list(self, info: Info, pagination: PaginationInput = PaginationInput()) -> AuditLogListType:
        await require_permission(info, "audit:list")
        total = await info.context.prisma.auditlog.count()
        items = await info.context.prisma.auditlog.find_many(skip=(pagination.page - 1) * pagination.page_size, take=pagination.page_size, order={"created_at": "desc"})
        return AuditLogListType(items=[_audit_type(item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=pagination.page, page_size=pagination.page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def request_log_list(self, info: Info, pagination: PaginationInput = PaginationInput()) -> RequestLogListType:
        await require_permission(info, "request_log:list")
        total = await info.context.prisma.requestlog.count()
        items = await info.context.prisma.requestlog.find_many(skip=(pagination.page - 1) * pagination.page_size, take=pagination.page_size, order={"created_at": "desc"})
        return RequestLogListType(items=[_request_log_type(item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=pagination.page, page_size=pagination.page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def login_log_list(self, info: Info, pagination: PaginationInput = PaginationInput()) -> LoginLogListType:
        await require_permission(info, "audit:login:view")
        total = await info.context.prisma.loginlog.count()
        items = await info.context.prisma.loginlog.find_many(skip=(pagination.page - 1) * pagination.page_size, take=pagination.page_size, order={"occurred_at": "desc"})
        return LoginLogListType(items=[_login_log_type(item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=pagination.page, page_size=pagination.page_size)))

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def ai_provider_list(self, info: Info, pagination: PaginationInput = PaginationInput()) -> AiProviderListType:
        await require_permission(info, "ai:provider:list")
        items, total, page, page_size = await AiProviderService.list_providers(info.context.prisma, page=pagination.page, page_size=pagination.page_size)
        return AiProviderListType(items=[_ai_provider_type(item) for item in items], page_info=PageInfo(**build_page_info(total=total, page=page, page_size=page_size)))


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def login(self, info: Info, username: str, password: str) -> LoginResult:
        try:
            result = await AuthService.authenticate(info.context.prisma, username=username, password=password, request_meta={"ip_address": info.context.request.client.host if info.context.request.client else None, "user_agent": info.context.request.headers.get("user-agent")})
            logger.info("用户登录成功: username=%s", username)
            return LoginResult(success=True, message="登录成功", data=LoginPayload(access_token=result["access_token"], token_type="Bearer", permissions=result["permissions"], user=_auth_user_type(result["user"])))
        except AppError as exc:
            logger.warning("用户登录失败: username=%s, reason=%s", username, exc.message)
            return LoginResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def logout(self, info: Info) -> MutationResult:
        user = await get_current_user(info)
        logger.info("用户登出: username=%s", user.username)
        return MutationResult(success=True, message="登出成功", error=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def reset_password(self, info: Info, user_id: str, new_password: str) -> MutationResult:
        try:
            operator = await require_permission(info, "user:reset_password")
            await AuthService.reset_password(info.context.prisma, user_id=user_id, new_password=new_password, operator_id=operator.id)
            logger.info("重置密码: operator=%s, target_user_id=%s", operator.username, user_id)
            await _audit_log(info, action="reset_password", target_type="User", target=type("T", (), {"id": user_id, "username": user_id})(), summary="重置用户密码")
            return MutationResult(success=True, message="密码重置成功", error=None)
        except AppError as exc:
            logger.warning("重置密码失败: operator_id=%s, target_user_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), user_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_user(self, info: Info, input: CreateUserInput) -> UserMutationResult:
        try:
            operator = await require_permission(info, "user:create")
            user = await UserService.create_user(info.context.prisma, data=vars(input), operator_id=operator.id)
            logger.info("创建用户: operator=%s, username=%s", operator.username, user.username)
            await _audit_log(info, action="create_user", target_type="User", target=user, summary=f"创建用户 {user.username}", after_data={"username": user.username, "email": user.email})
            return UserMutationResult(success=True, message="用户创建成功", data=await _user_type_with_roles(info.context.prisma, user), error=None)
        except AppError as exc:
            logger.warning("创建用户失败: operator=%s, reason=%s", getattr(info.context.user, 'id', '?'), exc.message)
            return UserMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)
        except Exception as exc:
            logger.error("创建用户异常: operator=%s, error=%s", getattr(info.context.user, 'id', '?'), exc)
            return UserMutationResult(success=False, message="创建用户失败，请稍后重试", error=ErrorType(code="INTERNAL_ERROR", message=str(exc)), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_user(self, info: Info, user_id: str, input: UpdateUserInput) -> UserMutationResult:
        try:
            operator = await require_permission(info, "user:update")
            before = await UserService.get_user_by_id(info.context.prisma, user_id)
            user = await UserService.update_user(info.context.prisma, user_id=user_id, data={k: v for k, v in vars(input).items() if v is not None}, operator_id=operator.id)
            logger.info("更新用户: operator=%s, target=%s", operator.username, user.username)
            await _audit_log(info, action="update_user", target_type="User", target=user, summary=f"更新用户 {user.username}", before_data={"email": before.email, "display_name": before.display_name}, after_data={"email": user.email, "display_name": user.display_name})
            return UserMutationResult(success=True, message="用户更新成功", data=await _user_type_with_roles(info.context.prisma, user), error=None)
        except AppError as exc:
            logger.warning("更新用户失败: operator=%s, user_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), user_id, exc.message)
            return UserMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def enable_user(self, info: Info, user_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "user:enable")
            user = await UserService.set_user_status(info.context.prisma, user_id=user_id, status="active", operator_id=operator.id)
            logger.info("启用用户: operator=%s, target=%s", operator.username, user.username)
            await _audit_log(info, action="enable_user", target_type="User", target=user, summary=f"启用用户 {user.username}")
            return MutationResult(success=True, message="用户已启用", error=None)
        except AppError as exc:
            logger.warning("启用用户失败: user_id=%s, reason=%s", user_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def disable_user(self, info: Info, user_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "user:disable")
            user = await UserService.set_user_status(info.context.prisma, user_id=user_id, status="disabled", operator_id=operator.id)
            logger.info("禁用用户: operator=%s, target=%s", operator.username, user.username)
            await _audit_log(info, action="disable_user", target_type="User", target=user, summary=f"禁用用户 {user.username}")
            return MutationResult(success=True, message="用户已禁用", error=None)
        except AppError as exc:
            logger.warning("禁用用户失败: user_id=%s, reason=%s", user_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def assign_roles_to_user(self, info: Info, user_id: str, role_ids: list[str]) -> MutationResult:
        try:
            operator = await require_permission(info, "user:assign_roles")
            await UserService.assign_roles(info.context.prisma, user_id=user_id, role_ids=role_ids, operator_id=operator.id)
            logger.info("分配用户角色: operator=%s, user_id=%s, role_count=%d", operator.username, user_id, len(role_ids))
            await _audit_log(info, action="assign_roles_to_user", target_type="User", target=type("T", (), {"id": user_id, "username": user_id})(), summary="分配用户角色", after_data={"role_ids": role_ids})
            return MutationResult(success=True, message="角色分配成功", error=None)
        except AppError as exc:
            logger.warning("分配用户角色失败: operator=%s, user_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), user_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_user(self, info: Info, user_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "user:delete")
            user = await UserService.delete_user(info.context.prisma, user_id=user_id, operator_id=operator.id)
            logger.info("删除用户: operator=%s, target=%s", operator.username, user.username)
            await _audit_log(info, action="delete_user", target_type="User", target=user, summary=f"删除用户 {user.username}")
            return MutationResult(success=True, message="用户删除成功", error=None)
        except AppError as exc:
            logger.warning("删除用户失败: operator=%s, user_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), user_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_role(self, info: Info, input: CreateRoleInput) -> RoleMutationResult:
        try:
            operator = await require_permission(info, "role:create")
            role = await info.context.prisma.role.create(data={**vars(input), "status": "active", "created_by": operator.id, "updated_by": operator.id})
            logger.info("创建角色: operator=%s, role=%s(%s)", operator.username, role.name, role.code)
            await _audit_log(info, action="create_role", target_type="Role", target=role, summary=f"创建角色 {role.name}", after_data={"code": role.code})
            return RoleMutationResult(success=True, message="角色创建成功", data=await _role_type_with_permissions(info.context.prisma, role), error=None)
        except AppError as exc:
            logger.warning("创建角色失败: operator=%s, reason=%s", getattr(info.context.user, 'id', '?'), exc.message)
            return RoleMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_role(self, info: Info, role_id: str, input: UpdateRoleInput) -> RoleMutationResult:
        try:
            operator = await require_permission(info, "role:update")
            role = await info.context.prisma.role.update(where={"id": role_id}, data={k: v for k, v in {**vars(input), "updated_by": operator.id}.items() if v is not None})
            logger.info("更新角色: operator=%s, role=%s", operator.username, role.name)
            await _audit_log(info, action="update_role", target_type="Role", target=role, summary=f"更新角色 {role.name}")
            return RoleMutationResult(success=True, message="角色更新成功", data=await _role_type_with_permissions(info.context.prisma, role), error=None)
        except AppError as exc:
            logger.warning("更新角色失败: operator=%s, role_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), role_id, exc.message)
            return RoleMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def assign_permissions_to_role(self, info: Info, role_id: str, permission_ids: list[str]) -> MutationResult:
        from datetime import datetime, timezone
        try:
            operator = await require_permission(info, "role:assign_permissions")
            existing = await info.context.prisma.rolepermission.find_many(where={"role_id": role_id, "deleted_at": None})
            for item in existing:
                await info.context.prisma.rolepermission.update(where={"id": item.id}, data={"deleted_at": datetime.now(timezone.utc), "deleted_by": operator.id})
            for permission_id in permission_ids:
                await info.context.prisma.rolepermission.create(data={"role_id": role_id, "permission_id": permission_id, "created_by": operator.id, "updated_by": operator.id})
            logger.info("分配角色权限: operator=%s, role_id=%s, permission_count=%d", operator.username, role_id, len(permission_ids))
            await _audit_log(info, action="assign_permissions_to_role", target_type="Role", target=type("T", (), {"id": role_id, "name": role_id})(), summary="分配角色权限", after_data={"permission_ids": permission_ids})
            return MutationResult(success=True, message="权限分配成功", error=None)
        except AppError as exc:
            logger.warning("分配角色权限失败: operator=%s, role_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), role_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_node(self, info: Info, input: CreateNodeInput) -> NodeMutationResult:
        try:
            operator = await require_permission(info, "node:create")
            node = await NodeService.create_node(info.context.prisma, data=vars(input), operator_id=operator.id)
            logger.info("创建节点: operator=%s, node=%s(%s)", operator.username, node.name, node.code)
            await _audit_log(info, action="create_node", target_type="FeatureNode", target=node, summary=f"创建节点 {node.name}", after_data={"path": node.path})
            return NodeMutationResult(success=True, message="节点创建成功", data=_node_type(node), error=None)
        except AppError as exc:
            logger.warning("创建节点失败: operator=%s, reason=%s", getattr(info.context.user, 'id', '?'), exc.message)
            return NodeMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_node(self, info: Info, node_id: str, input: UpdateNodeInput) -> NodeMutationResult:
        try:
            operator = await require_permission(info, "node:update")
            before = await NodeService._get_node(info.context.prisma, node_id)
            node = await NodeService.update_node(info.context.prisma, node_id=node_id, data={k: v for k, v in vars(input).items() if v is not None}, operator_id=operator.id)
            logger.info("更新节点: operator=%s, node=%s", operator.username, node.name)
            await _audit_log(info, action="update_node", target_type="FeatureNode", target=node, summary=f"更新节点 {node.name}", before_data={"path": before.path}, after_data={"path": node.path})
            return NodeMutationResult(success=True, message="节点更新成功", data=_node_type(node), error=None)
        except AppError as exc:
            logger.warning("更新节点失败: operator=%s, node_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), node_id, exc.message)
            return NodeMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_node(self, info: Info, node_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "node:delete")
            node = await NodeService.delete_node(info.context.prisma, node_id=node_id, operator_id=operator.id)
            logger.info("删除节点: operator=%s, node=%s", operator.username, node.name)
            await _audit_log(info, action="delete_node", target_type="FeatureNode", target=node, summary=f"删除节点 {node.name}")
            return MutationResult(success=True, message="节点删除成功", error=None)
        except AppError as exc:
            logger.warning("删除节点失败: operator=%s, node_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), node_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def hide_node(self, info: Info, node_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "node:hide")
            node = await NodeService.set_visibility(info.context.prisma, node_id=node_id, is_visible=False, operator_id=operator.id)
            logger.info("隐藏节点: operator=%s, node=%s", operator.username, node.name)
            await _audit_log(info, action="hide_node", target_type="FeatureNode", target=node, summary=f"隐藏节点 {node.name}")
            return MutationResult(success=True, message="节点已隐藏", error=None)
        except AppError as exc:
            logger.warning("隐藏节点失败: node_id=%s, reason=%s", node_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def show_node(self, info: Info, node_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "node:show")
            node = await NodeService.set_visibility(info.context.prisma, node_id=node_id, is_visible=True, operator_id=operator.id)
            logger.info("显示节点: operator=%s, node=%s", operator.username, node.name)
            await _audit_log(info, action="show_node", target_type="FeatureNode", target=node, summary=f"显示节点 {node.name}")
            return MutationResult(success=True, message="节点已显示", error=None)
        except AppError as exc:
            logger.warning("显示节点失败: node_id=%s, reason=%s", node_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def copy_node(self, info: Info, node_id: str, target_parent_id: str | None = None, new_name: str | None = None) -> NodeMutationResult:
        try:
            operator = await require_permission(info, "node:copy")
            node = await NodeService.copy_node(info.context.prisma, node_id=node_id, target_parent_id=target_parent_id, new_name=new_name, operator_id=operator.id)
            logger.info("复制节点: operator=%s, node=%s, target_parent=%s", operator.username, node.name, target_parent_id)
            await _audit_log(info, action="copy_node", target_type="FeatureNode", target=node, summary=f"复制节点 {node.name}")
            return NodeMutationResult(success=True, message="节点复制成功", data=_node_type(node), error=None)
        except AppError as exc:
            logger.warning("复制节点失败: operator=%s, node_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), node_id, exc.message)
            return NodeMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def move_node(self, info: Info, node_id: str, target_parent_id: str | None = None) -> NodeMutationResult:
        try:
            operator = await require_permission(info, "node:move")
            node = await NodeService.move_node(info.context.prisma, node_id=node_id, target_parent_id=target_parent_id, operator_id=operator.id)
            logger.info("移动节点: operator=%s, node=%s, target_parent=%s", operator.username, node.name, target_parent_id)
            await _audit_log(info, action="move_node", target_type="FeatureNode", target=node, summary=f"移动节点 {node.name}")
            return NodeMutationResult(success=True, message="节点移动成功", data=_node_type(node), error=None)
        except AppError as exc:
            logger.warning("移动节点失败: operator=%s, node_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), node_id, exc.message)
            return NodeMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_feature(self, info: Info, input: CreateFeatureInput) -> FeatureMutationResult:
        try:
            operator = await require_permission(info, "feature:create")
            feature = await FeatureService.create_feature(info.context.prisma, data=vars(input), operator_id=operator.id)
            logger.info("创建特征: operator=%s, feature=%s(%s)", operator.username, feature.title, feature.code)
            await _audit_log(info, action="create_feature", target_type="Feature", target=feature, summary=f"创建特征 {feature.title}")
            return FeatureMutationResult(success=True, message="特征创建成功", data=_feature_type(feature), error=None)
        except AppError as exc:
            logger.warning("创建特征失败: operator=%s, reason=%s", getattr(info.context.user, 'id', '?'), exc.message)
            return FeatureMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_feature(self, info: Info, feature_id: str, input: UpdateFeatureInput) -> FeatureMutationResult:
        try:
            operator = await require_permission(info, "feature:update")
            feature = await FeatureService.update_feature(info.context.prisma, feature_id=feature_id, data={k: v for k, v in vars(input).items() if v is not None}, operator_id=operator.id)
            logger.info("更新特征: operator=%s, feature=%s", operator.username, feature.title)
            await _audit_log(info, action="update_feature", target_type="Feature", target=feature, summary=f"更新特征 {feature.title}")
            return FeatureMutationResult(success=True, message="特征更新成功", data=_feature_type(feature), error=None)
        except AppError as exc:
            logger.warning("更新特征失败: operator=%s, feature_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), feature_id, exc.message)
            return FeatureMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_feature(self, info: Info, feature_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "feature:delete")
            feature = await FeatureService.delete_feature(info.context.prisma, feature_id=feature_id, operator_id=operator.id)
            logger.info("删除特征: operator=%s, feature=%s", operator.username, feature.title)
            await _audit_log(info, action="delete_feature", target_type="Feature", target=feature, summary=f"删除特征 {feature.title}")
            return MutationResult(success=True, message="特征删除成功", error=None)
        except AppError as exc:
            logger.warning("删除特征失败: operator=%s, feature_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), feature_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def hide_feature(self, info: Info, feature_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "feature:hide")
            feature = await FeatureService.set_visibility(info.context.prisma, feature_id=feature_id, is_visible=False, operator_id=operator.id)
            logger.info("隐藏特征: operator=%s, feature=%s", operator.username, feature.title)
            await _audit_log(info, action="hide_feature", target_type="Feature", target=feature, summary=f"隐藏特征 {feature.title}")
            return MutationResult(success=True, message="特征已隐藏", error=None)
        except AppError as exc:
            logger.warning("隐藏特征失败: feature_id=%s, reason=%s", feature_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def show_feature(self, info: Info, feature_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "feature:show")
            feature = await FeatureService.set_visibility(info.context.prisma, feature_id=feature_id, is_visible=True, operator_id=operator.id)
            logger.info("显示特征: operator=%s, feature=%s", operator.username, feature.title)
            await _audit_log(info, action="show_feature", target_type="Feature", target=feature, summary=f"显示特征 {feature.title}")
            return MutationResult(success=True, message="特征已显示", error=None)
        except AppError as exc:
            logger.warning("显示特征失败: feature_id=%s, reason=%s", feature_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def copy_feature(self, info: Info, feature_id: str, target_node_id: str) -> FeatureMutationResult:
        try:
            operator = await require_permission(info, "feature:copy")
            feature = await FeatureService.copy_feature(info.context.prisma, feature_id=feature_id, target_node_id=target_node_id, operator_id=operator.id)
            logger.info("复制特征: operator=%s, feature=%s, target_node=%s", operator.username, feature.title, target_node_id)
            await _audit_log(info, action="copy_feature", target_type="Feature", target=feature, summary=f"复制特征 {feature.title}")
            return FeatureMutationResult(success=True, message="特征复制成功", data=_feature_type(feature), error=None)
        except AppError as exc:
            logger.warning("复制特征失败: operator=%s, feature_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), feature_id, exc.message)
            return FeatureMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def move_feature(self, info: Info, feature_id: str, target_node_id: str) -> FeatureMutationResult:
        try:
            operator = await require_permission(info, "feature:move")
            feature = await FeatureService.move_feature(info.context.prisma, feature_id=feature_id, target_node_id=target_node_id, operator_id=operator.id)
            logger.info("移动特征: operator=%s, feature=%s, target_node=%s", operator.username, feature.title, target_node_id)
            await _audit_log(info, action="move_feature", target_type="Feature", target=feature, summary=f"移动特征 {feature.title}")
            return FeatureMutationResult(success=True, message="特征移动成功", data=_feature_type(feature), error=None)
        except AppError as exc:
            logger.warning("移动特征失败: operator=%s, feature_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), feature_id, exc.message)
            return FeatureMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_ai_provider(self, info: Info, input: CreateAiProviderInput) -> AiProviderMutationResult:
        try:
            operator = await require_permission(info, "ai:provider:manage")
            provider = await AiProviderService.create_provider(info.context.prisma, data=vars(input), operator_id=operator.id)
            logger.info("创建AI供应商: operator=%s, name=%s", operator.username, provider.name)
            await _audit_log(info, action="create_ai_provider", target_type="AiProvider", target=provider, summary=f"创建AI供应商 {provider.name}")
            return AiProviderMutationResult(success=True, message="AI供应商创建成功", data=_ai_provider_type(provider), error=None)
        except AppError as exc:
            logger.warning("创建AI供应商失败: operator=%s, reason=%s", getattr(info.context.user, 'id', '?'), exc.message)
            return AiProviderMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_ai_provider(self, info: Info, provider_id: str, input: UpdateAiProviderInput) -> AiProviderMutationResult:
        try:
            operator = await require_permission(info, "ai:provider:manage")
            provider = await AiProviderService.update_provider(info.context.prisma, provider_id=provider_id, data={k: v for k, v in vars(input).items() if v is not None}, operator_id=operator.id)
            logger.info("更新AI供应商: operator=%s, name=%s", operator.username, provider.name)
            await _audit_log(info, action="update_ai_provider", target_type="AiProvider", target=provider, summary=f"更新AI供应商 {provider.name}")
            return AiProviderMutationResult(success=True, message="AI供应商更新成功", data=_ai_provider_type(provider), error=None)
        except AppError as exc:
            logger.warning("更新AI供应商失败: operator=%s, provider_id=%s, reason=%s", getattr(info.context.user, 'id', '?'), provider_id, exc.message)
            return AiProviderMutationResult(success=False, message=exc.message, error=_error_result(exc), data=None)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_ai_provider(self, info: Info, provider_id: str) -> MutationResult:
        try:
            operator = await require_permission(info, "ai:provider:manage")
            provider = await AiProviderService.delete_provider(info.context.prisma, provider_id=provider_id, operator_id=operator.id)
            logger.info("删除AI供应商: operator=%s, name=%s", operator.username, provider.name)
            await _audit_log(info, action="delete_ai_provider", target_type="AiProvider", target=provider, summary=f"删除AI供应商 {provider.name}")
            return MutationResult(success=True, message="AI供应商删除成功", error=None)
        except AppError as exc:
            logger.warning("删除AI供应商失败: provider_id=%s, reason=%s", provider_id, exc.message)
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def test_ai_connection(self, info: Info, provider_id: str) -> MutationResult:
        try:
            await require_permission(info, "ai:provider:manage")
            result = await AiProviderService.test_connection(info.context.prisma, provider_id=provider_id)
            if result["success"]:
                return MutationResult(success=True, message=result["message"], error=None)
            return MutationResult(success=False, message=result["message"], error=ErrorType(code="AI_CONNECTION_ERROR", message=result["message"]))
        except AppError as exc:
            return MutationResult(success=False, message=exc.message, error=_error_result(exc))

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def generate_test_cases(self, info: Info, input: GenerateTestCasesInput) -> AiGenerateResult:
        try:
            import json
            operator = await require_permission(info, "ai:generate")
            result = await AiProviderService.generate_test_cases(info.context.prisma, provider_id=input.provider_id, node_ids=input.node_ids, feature_ids=input.feature_ids, custom_instruction=input.custom_instruction)
            logger.info("生成测试用例: operator=%s, provider_id=%s", operator.username, input.provider_id)
            await _audit_log(info, action="generate_test_cases", target_type="AiProvider", target=type("T", (), {"id": input.provider_id, "name": input.provider_id})(), summary="AI生成测试用例")
            return AiGenerateResult(success=True, message="测试用例生成成功", content=result.content, model=result.model, usage=json.dumps(result.usage) if result.usage else None, error=None)
        except AppError as exc:
            logger.warning("生成测试用例失败: operator=%s, reason=%s", getattr(info.context.user, 'id', '?'), exc.message)
            return AiGenerateResult(success=False, message=exc.message, error=_error_result(exc), content=None, model=None, usage=None)


schema = strawberry.Schema(query=Query, mutation=Mutation)
