import { Model, Optional } from 'sequelize';
export interface UserRoleAttributes {
    id: string;
    user_id: string;
    role_id: string;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export type UserRoleCreationAttributes = Optional<UserRoleAttributes, 'id' | 'deleted_at' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'deleted_by'>;
export declare class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
    id: string;
    user_id: string;
    role_id: string;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export interface RolePermissionAttributes {
    id: string;
    role_id: string;
    permission_id: string;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export type RolePermissionCreationAttributes = Optional<RolePermissionAttributes, 'id' | 'deleted_at' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'deleted_by'>;
export declare class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
    id: string;
    role_id: string;
    permission_id: string;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
//# sourceMappingURL=JoinTables.d.ts.map