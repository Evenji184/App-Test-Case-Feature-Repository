from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from typing import Any

from prisma import Prisma

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.security import hash_password


def build_permissions() -> list[dict[str, str]]:
    return [
        {
            "name": "用户列表页访问",
            "code": "user:list",
            "module": "system",
            "resource": "user_page",
            "action": "list",
            "description": "访问用户管理页面",
        },
        {
            "name": "用户查看",
            "code": "system:user:view",
            "module": "system",
            "resource": "user",
            "action": "view",
            "description": "查看用户列表与详情",
        },
        {
            "name": "用户管理",
            "code": "system:user:manage",
            "module": "system",
            "resource": "user",
            "action": "manage",
            "description": "创建、编辑、禁用用户",
        },
        {
            "name": "角色列表页访问",
            "code": "role:list",
            "module": "system",
            "resource": "role_page",
            "action": "list",
            "description": "访问角色管理相关页面",
        },
        {
            "name": "角色管理",
            "code": "system:role:manage",
            "module": "system",
            "resource": "role",
            "action": "manage",
            "description": "维护角色与角色授权",
        },
        {
            "name": "权限列表页访问",
            "code": "permission:list",
            "module": "system",
            "resource": "permission_page",
            "action": "list",
            "description": "访问权限管理页面",
        },
        {
            "name": "权限查看",
            "code": "system:permission:view",
            "module": "system",
            "resource": "permission",
            "action": "view",
            "description": "查看权限定义",
        },
        {
            "name": "节点列表页访问",
            "code": "node:list",
            "module": "feature",
            "resource": "feature_node_page",
            "action": "list",
            "description": "访问节点管理与节点树查询",
        },
        {
            "name": "节点查看",
            "code": "feature:node:view",
            "module": "feature",
            "resource": "feature_node",
            "action": "view",
            "description": "查看特征节点树",
        },
        {
            "name": "节点管理",
            "code": "feature:node:manage",
            "module": "feature",
            "resource": "feature_node",
            "action": "manage",
            "description": "创建、编辑、移动、复制节点",
        },
        {
            "name": "特征列表页访问",
            "code": "feature:list",
            "module": "feature",
            "resource": "feature_page",
            "action": "list",
            "description": "访问特征管理页面与特征列表查询",
        },
        {
            "name": "特征查看",
            "code": "feature:item:view",
            "module": "feature",
            "resource": "feature",
            "action": "view",
            "description": "查看特征详情",
        },
        {
            "name": "特征管理",
            "code": "feature:item:manage",
            "module": "feature",
            "resource": "feature",
            "action": "manage",
            "description": "创建、编辑、复制、移动特征",
        },
        {
            "name": "审计日志查看",
            "code": "audit:log:view",
            "module": "audit",
            "resource": "audit_log",
            "action": "view",
            "description": "查看审计日志",
        },
        {
            "name": "登录日志查看",
            "code": "audit:login:view",
            "module": "audit",
            "resource": "login_log",
            "action": "view",
            "description": "查看登录日志",
        },
        {
            "name": "请求日志查看",
            "code": "audit:request:view",
            "module": "audit",
            "resource": "request_log",
            "action": "view",
            "description": "查看请求日志",
        },
    ]


async def upsert_permission(db: Prisma, admin_id: str, payload: dict[str, str]) -> Any:
    existing = await db.permission.find_first(
        where={"code": payload["code"], "deleted_at": None}
    )
    data = {
        **payload,
        "created_by": admin_id,
        "updated_by": admin_id,
    }
    if existing:
        return await db.permission.update(where={"id": existing.id}, data=data)
    return await db.permission.create(data=data)


async def upsert_role(db: Prisma, admin_id: str) -> Any:
    existing = await db.role.find_first(where={"code": "admin", "deleted_at": None})
    data = {
        "name": "系统管理员",
        "code": "admin",
        "description": "默认超级管理员角色，拥有全部初始化权限。",
        "is_system": True,
        "status": "active",
        "created_by": admin_id,
        "updated_by": admin_id,
    }
    if existing:
        return await db.role.update(where={"id": existing.id}, data=data)
    return await db.role.create(data=data)


async def ensure_role_permissions(
    db: Prisma, admin_id: str, role_id: str, permission_ids: list[str]
) -> None:
    for permission_id in permission_ids:
        existing = await db.rolepermission.find_first(
            where={
                "role_id": role_id,
                "permission_id": permission_id,
                "deleted_at": None,
            }
        )
        if existing:
            await db.rolepermission.update(
                where={"id": existing.id},
                data={"updated_by": admin_id, "deleted_at": None, "deleted_by": None},
            )
            continue
        await db.rolepermission.create(
            data={
                "role_id": role_id,
                "permission_id": permission_id,
                "created_by": admin_id,
                "updated_by": admin_id,
            }
        )


async def upsert_admin_user(db: Prisma) -> Any:
    existing = await db.user.find_first(where={"username": "admin", "deleted_at": None})
    data = {
        "username": "admin",
        "email": "admin@app-feature.local",
        "password_hash": hash_password("admin123456"),
        "display_name": "系统管理员",
        "status": "active",
        "is_super_admin": True,
        "remark": "系统初始化默认管理员账号",
    }
    if existing:
        return await db.user.update(where={"id": existing.id}, data=data)
    created = await db.user.create(data=data)
    await db.user.update(
        where={"id": created.id},
        data={"created_by": created.id, "updated_by": created.id},
    )
    return await db.user.find_unique(where={"id": created.id})


async def ensure_user_role(db: Prisma, admin_id: str, user_id: str, role_id: str) -> None:
    existing = await db.userrole.find_first(
        where={"user_id": user_id, "role_id": role_id, "deleted_at": None}
    )
    if existing:
        await db.userrole.update(
            where={"id": existing.id},
            data={"updated_by": admin_id, "deleted_at": None, "deleted_by": None},
        )
        return
    await db.userrole.create(
        data={
            "user_id": user_id,
            "role_id": role_id,
            "created_by": admin_id,
            "updated_by": admin_id,
        }
    )


async def upsert_feature_node(
    db: Prisma,
    admin_id: str,
    code: str,
    payload: dict[str, Any],
) -> Any:
    existing = await db.featurenode.find_first(where={"code": code, "deleted_at": None})
    data = {**payload, "updated_by": admin_id}
    if existing:
        return await db.featurenode.update(where={"id": existing.id}, data=data)
    data["created_by"] = admin_id
    return await db.featurenode.create(data=data)


async def upsert_feature(
    db: Prisma,
    admin_id: str,
    code: str,
    payload: dict[str, Any],
) -> Any:
    existing = await db.feature.find_first(where={"code": code, "deleted_at": None})
    data = {**payload, "updated_by": admin_id}
    if existing:
        return await db.feature.update(where={"id": existing.id}, data=data)
    data["created_by"] = admin_id
    return await db.feature.create(data=data)


async def seed_feature_tree(db: Prisma, admin_id: str) -> None:
    root = await upsert_feature_node(
        db,
        admin_id,
        "mobile-app",
        {
            "name": "移动端 APP",
            "code": "mobile-app",
            "node_type": "domain",
            "path": "/mobile-app",
            "level": 1,
            "sort_order": 1,
            "is_visible": True,
            "remark": "一级业务域节点",
        },
    )
    auth = await upsert_feature_node(
        db,
        admin_id,
        "auth-center",
        {
            "parent_id": root.id,
            "name": "认证中心",
            "code": "auth-center",
            "node_type": "module",
            "path": "/mobile-app/auth-center",
            "level": 2,
            "sort_order": 10,
            "is_visible": True,
            "source_node_id": root.id,
            "remark": "登录与账号安全相关功能",
        },
    )
    password = await upsert_feature_node(
        db,
        admin_id,
        "password-login",
        {
            "parent_id": auth.id,
            "name": "密码登录",
            "code": "password-login",
            "node_type": "feature_group",
            "path": "/mobile-app/auth-center/password-login",
            "level": 3,
            "sort_order": 20,
            "is_visible": True,
            "source_node_id": auth.id,
            "remark": "账号密码登录场景",
        },
    )
    profile = await upsert_feature_node(
        db,
        admin_id,
        "profile-center",
        {
            "parent_id": root.id,
            "name": "个人中心",
            "code": "profile-center",
            "node_type": "module",
            "path": "/mobile-app/profile-center",
            "level": 2,
            "sort_order": 30,
            "is_visible": True,
            "source_node_id": root.id,
            "copied_from_node_id": auth.id,
            "copy_operation_id": auth.id,
            "remark": "示例复制追踪节点",
        },
    )

    login_feature = await upsert_feature(
        db,
        admin_id,
        "login-basic-success",
        {
            "node_id": password.id,
            "title": "账号密码登录成功",
            "code": "login-basic-success",
            "summary": "输入正确账号密码后成功进入首页",
            "description": "覆盖标准账号密码登录成功路径。",
            "platform": "ios,android",
            "status": "published",
            "priority": "high",
            "version": "v1.0.0",
            "tags": "登录,认证,冒烟",
            "is_visible": True,
            "remark": "基础登录成功用例",
        },
    )
    await upsert_feature(
        db,
        admin_id,
        "login-password-error",
        {
            "node_id": password.id,
            "title": "账号密码错误提示",
            "code": "login-password-error",
            "summary": "密码错误时展示明确错误提示",
            "description": "验证错误密码时的交互与提示文案。",
            "platform": "ios,android",
            "status": "published",
            "priority": "high",
            "version": "v1.0.0",
            "tags": "登录,异常",
            "is_visible": True,
            "source_feature_id": login_feature.id,
            "remark": "从成功登录特征衍生的异常场景",
        },
    )
    await upsert_feature(
        db,
        admin_id,
        "profile-avatar-edit",
        {
            "node_id": profile.id,
            "title": "头像编辑与同步",
            "code": "profile-avatar-edit",
            "summary": "修改头像后个人中心与首页同步展示",
            "description": "示例特征，展示复制/移动追踪字段。",
            "platform": "ios,android",
            "status": "draft",
            "priority": "medium",
            "version": "v1.1.0",
            "tags": "个人中心,资料编辑",
            "is_visible": False,
            "copied_from_id": login_feature.id,
            "moved_from_node_id": password.id,
            "copy_operation_id": login_feature.id,
            "move_operation_id": password.id,
            "remark": "隐藏示例特征，用于验证显示/隐藏与追踪字段",
        },
    )


async def main() -> None:
    db = Prisma(auto_register=True)
    await db.connect()
    try:
        admin = await upsert_admin_user(db)
        admin_id = admin.id
        role = await upsert_role(db, admin_id)

        permissions = []
        for permission in build_permissions():
            permissions.append(await upsert_permission(db, admin_id, permission))

        await ensure_role_permissions(db, admin_id, role.id, [item.id for item in permissions])
        await ensure_user_role(db, admin_id, admin.id, role.id)
        await seed_feature_tree(db, admin_id)
        print("数据库种子数据初始化完成。")
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
