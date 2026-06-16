import { v4 as uuidv4 } from 'uuid';
import { connectDatabase } from '../db/connection';
import { User } from '../db/models/User';
import { Role } from '../db/models/Role';
import { Permission } from '../db/models/Permission';
import { UserRole, RolePermission } from '../db/models/JoinTables';
import { FeatureNode } from '../db/models/FeatureNode';
import { Feature } from '../db/models/Feature';
import { hashPassword } from '../utils/password';

// ─── 权限数据（23 项，与 Python seed.py 保持一致） ────────────────────────────

interface PermissionDef {
  code: string;
  name: string;
  module: string;
  resource: string;
  action: string;
  adminRole: boolean; // 是否分配给 admin 角色
}

const PERMISSIONS: PermissionDef[] = [
  // system
  { code: 'user:list',             name: '用户列表',         module: 'system',  resource: 'user',       action: 'list',    adminRole: true  },
  { code: 'system:user:view',      name: '用户查看',         module: 'system',  resource: 'user',       action: 'view',    adminRole: true  },
  { code: 'system:user:manage',    name: '用户管理',         module: 'system',  resource: 'user',       action: 'manage',  adminRole: true  },
  { code: 'user:delete',           name: '用户删除',         module: 'system',  resource: 'user',       action: 'delete',  adminRole: false },
  { code: 'role:list',             name: '角色列表',         module: 'system',  resource: 'role',       action: 'list',    adminRole: true  },
  { code: 'system:role:manage',    name: '角色管理',         module: 'system',  resource: 'role',       action: 'manage',  adminRole: true  },
  { code: 'role:delete',           name: '角色删除',         module: 'system',  resource: 'role',       action: 'delete',  adminRole: false },
  { code: 'permission:list',       name: '权限列表',         module: 'system',  resource: 'permission', action: 'list',    adminRole: true  },
  { code: 'system:permission:view',name: '权限查看',         module: 'system',  resource: 'permission', action: 'view',    adminRole: true  },
  // feature
  { code: 'node:list',             name: '节点列表',         module: 'feature', resource: 'node',       action: 'list',    adminRole: true  },
  { code: 'feature:node:view',     name: '节点查看',         module: 'feature', resource: 'node',       action: 'view',    adminRole: true  },
  { code: 'feature:node:manage',   name: '节点管理',         module: 'feature', resource: 'node',       action: 'manage',  adminRole: true  },
  { code: 'feature:list',          name: '特征列表',         module: 'feature', resource: 'feature',    action: 'list',    adminRole: true  },
  { code: 'feature:item:view',     name: '特征查看',         module: 'feature', resource: 'feature',    action: 'view',    adminRole: true  },
  { code: 'feature:item:manage',   name: '特征管理',         module: 'feature', resource: 'feature',    action: 'manage',  adminRole: true  },
  // audit
  { code: 'audit:log:view',        name: '审计日志查看',     module: 'audit',   resource: 'log',        action: 'view',    adminRole: true  },
  { code: 'audit:login:view',      name: '登录日志查看',     module: 'audit',   resource: 'login',      action: 'view',    adminRole: true  },
  { code: 'audit:request:view',    name: '请求日志查看',     module: 'audit',   resource: 'request',    action: 'view',    adminRole: true  },
  // ai
  { code: 'ai:provider:list',      name: 'AI供应商列表',     module: 'ai',      resource: 'provider',   action: 'list',    adminRole: true  },
  { code: 'ai:provider:manage',    name: 'AI供应商管理',     module: 'ai',      resource: 'provider',   action: 'manage',  adminRole: true  },
  { code: 'ai:generate',           name: 'AI生成提示词',     module: 'ai',      resource: 'generate',   action: 'execute', adminRole: true  },
  { code: 'ai:prompt:list',        name: '提示词列表',       module: 'ai',      resource: 'prompt',     action: 'list',    adminRole: true  },
  { code: 'ai:prompt:manage',      name: '提示词管理',       module: 'ai',      resource: 'prompt',     action: 'manage',  adminRole: true  },
];

// ─── 示例特征树 ───────────────────────────────────────────────────────────────

interface NodeDef {
  name: string;
  code: string;
  nodeType: string;
  sortOrder: number;
  children?: NodeDef[];
}

interface FeatureDef {
  title: string;
  code: string;
  summary: string;
  platform: string;
  status: string;
  priority: string;
}

const NODE_TREE: NodeDef[] = [
  {
    name: '移动端 APP',
    code: 'mobile-app',
    nodeType: 'app',
    sortOrder: 1,
    children: [
      {
        name: '认证中心',
        code: 'auth-center',
        nodeType: 'category',
        sortOrder: 1,
        children: [
          { name: '密码登录', code: 'password-login', nodeType: 'folder', sortOrder: 1 },
        ],
      },
      {
        name: '个人中心',
        code: 'profile',
        nodeType: 'category',
        sortOrder: 2,
      },
    ],
  },
];

const FEATURES_BY_NODE_CODE: Record<string, FeatureDef[]> = {
  'password-login': [
    {
      title: '账号密码登录成功',
      code: 'auth-login-success',
      summary: '输入正确账号密码后成功登录，跳转到首页',
      platform: 'iOS,Android',
      status: 'active',
      priority: 'high',
    },
    {
      title: '账号密码错误提示',
      code: 'auth-login-fail-hint',
      summary: '输入错误账号或密码时显示错误提示，不暴露具体原因',
      platform: 'iOS,Android',
      status: 'active',
      priority: 'high',
    },
  ],
  'profile': [
    {
      title: '头像编辑与同步',
      code: 'profile-avatar-edit',
      summary: '用户可上传/裁剪头像，修改后立即同步到全局导航栏',
      platform: 'iOS,Android',
      status: 'active',
      priority: 'medium',
    },
  ],
};

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

async function upsertPermissions(): Promise<Map<string, string>> {
  const codeToId = new Map<string, string>();

  for (const def of PERMISSIONS) {
    const existing = await Permission.findOne({ where: { code: def.code, deleted_at: null } });
    if (existing) {
      codeToId.set(def.code, existing.id);
      log(`permission exists: ${def.code}`);
      continue;
    }
    const id = uuidv4();
    await Permission.create({
      id,
      name: def.name,
      code: def.code,
      module: def.module,
      resource: def.resource,
      action: def.action,
    });
    codeToId.set(def.code, id);
    log(`permission created: ${def.code}`);
  }

  return codeToId;
}

async function upsertAdminRole(permCodeToId: Map<string, string>): Promise<string> {
  let role = await Role.findOne({ where: { code: 'admin', deleted_at: null } });
  if (!role) {
    role = await Role.create({
      id: uuidv4(),
      name: '系统管理员',
      code: 'admin',
      description: '系统默认管理员角色，拥有大部分操作权限',
      is_system: true,
      status: 'active',
    });
    log('role created: admin');
  } else {
    log('role exists: admin');
  }

  const roleId = role.id;
  const adminPermCodes = PERMISSIONS.filter(p => p.adminRole).map(p => p.code);

  for (const code of adminPermCodes) {
    const permId = permCodeToId.get(code);
    if (!permId) continue;
    const existing = await RolePermission.findOne({
      where: { role_id: roleId, permission_id: permId, deleted_at: null },
    });
    if (!existing) {
      await RolePermission.create({ id: uuidv4(), role_id: roleId, permission_id: permId });
      log(`  role-permission assigned: admin → ${code}`);
    }
  }

  return roleId;
}

async function upsertAdminUser(roleId: string): Promise<string> {
  let user = await User.findOne({ where: { username: 'admin', deleted_at: null } });
  if (!user) {
    const passwordHash = await hashPassword('admin123456');
    user = await User.create({
      id: uuidv4(),
      username: 'admin',
      email: 'admin@app-feature.local',
      password_hash: passwordHash,
      display_name: '系统管理员',
      status: 'active',
      is_super_admin: true,
    });
    log('user created: admin');
  } else {
    log('user exists: admin');
  }

  const userId = user.id;
  const existing = await UserRole.findOne({
    where: { user_id: userId, role_id: roleId, deleted_at: null },
  });
  if (!existing) {
    await UserRole.create({ id: uuidv4(), user_id: userId, role_id: roleId });
    log('user-role assigned: admin → admin');
  }

  return userId;
}

async function upsertNodeTree(
  nodes: NodeDef[],
  parentId: string | null,
  parentPath: string,
  level: number,
  adminUserId: string,
): Promise<Map<string, string>> {
  const codeToId = new Map<string, string>();

  for (let i = 0; i < nodes.length; i++) {
    const def = nodes[i];
    const existing = await FeatureNode.findOne({ where: { code: def.code, deleted_at: null } });

    let nodeId: string;
    if (existing) {
      nodeId = existing.id;
      log(`node exists: ${def.code}`);
    } else {
      nodeId = uuidv4();
      const path = parentPath ? `${parentPath}/${nodeId}` : nodeId;
      await FeatureNode.create({
        id: nodeId,
        name: def.name,
        code: def.code,
        node_type: def.nodeType,
        sort_order: def.sortOrder,
        parent_id: parentId,
        path,
        level,
        is_visible: true,
        is_locked: false,
        created_by: adminUserId,
        updated_by: adminUserId,
      });
      log(`node created: ${def.code}`);
    }

    codeToId.set(def.code, nodeId);

    if (def.children && def.children.length > 0) {
      const childNodeId = existing ? existing.path : (parentPath ? `${parentPath}/${nodeId}` : nodeId);
      const childMap = await upsertNodeTree(def.children, nodeId, childNodeId, level + 1, adminUserId);
      childMap.forEach((v, k) => codeToId.set(k, v));
    }
  }

  return codeToId;
}

async function upsertFeatures(nodeCodeToId: Map<string, string>, adminUserId: string) {
  for (const [nodeCode, features] of Object.entries(FEATURES_BY_NODE_CODE)) {
    const nodeId = nodeCodeToId.get(nodeCode);
    if (!nodeId) {
      log(`warn: node not found for feature seeding: ${nodeCode}`);
      continue;
    }

    for (let i = 0; i < features.length; i++) {
      const def = features[i];
      const existing = await Feature.findOne({ where: { code: def.code, deleted_at: null } });
      if (existing) {
        log(`feature exists: ${def.code}`);
        continue;
      }
      await Feature.create({
        id: uuidv4(),
        node_id: nodeId,
        title: def.title,
        code: def.code,
        summary: def.summary,
        platform: def.platform,
        status: def.status,
        priority: def.priority,
        is_visible: true,
        is_archived: false,
        created_by: adminUserId,
        updated_by: adminUserId,
      });
      log(`feature created: ${def.code}`);
    }
  }
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function seed() {
  log('connecting to database...');
  await connectDatabase();

  log('--- permissions ---');
  const permCodeToId = await upsertPermissions();

  log('--- roles ---');
  const adminRoleId = await upsertAdminRole(permCodeToId);

  log('--- users ---');
  const adminUserId = await upsertAdminUser(adminRoleId);

  log('--- feature nodes ---');
  const nodeCodeToId = await upsertNodeTree(NODE_TREE, null, '', 1, adminUserId);

  log('--- features ---');
  await upsertFeatures(nodeCodeToId, adminUserId);

  log('seed completed.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
