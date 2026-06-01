import { Model, Optional } from 'sequelize';
export interface PermissionAttributes {
    id: string;
    name: string;
    code: string;
    module: string;
    resource: string;
    action: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export type PermissionCreationAttributes = Optional<PermissionAttributes, 'id' | 'description' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'>;
export declare class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    id: string;
    name: string;
    code: string;
    module: string;
    resource: string;
    action: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
//# sourceMappingURL=Permission.d.ts.map