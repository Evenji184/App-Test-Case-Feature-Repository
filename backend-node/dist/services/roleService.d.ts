import { Role, Permission } from '../db/models';
export declare function listRoles(params: {
    keyword?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    items: Role[];
}>;
export declare function getRoleWithPermissions(roleId: string): Promise<{
    role: Role;
    permissions: Permission[];
} | null>;
export declare function createRole(params: {
    name: string;
    code: string;
    description?: string;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<Role>;
export declare function updateRole(params: {
    roleId: string;
    name?: string;
    description?: string | null;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<Role>;
export declare function assignPermissionsToRole(roleId: string, permissionIds: string[], operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function deleteRole(roleId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
//# sourceMappingURL=roleService.d.ts.map