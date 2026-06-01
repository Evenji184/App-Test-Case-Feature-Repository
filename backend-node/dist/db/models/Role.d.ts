import { Model, Optional } from 'sequelize';
export interface RoleAttributes {
    id: string;
    name: string;
    code: string;
    description: string | null;
    is_system: boolean;
    status: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export type RoleCreationAttributes = Optional<RoleAttributes, 'id' | 'description' | 'is_system' | 'status' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'>;
export declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: string;
    name: string;
    code: string;
    description: string | null;
    is_system: boolean;
    status: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
//# sourceMappingURL=Role.d.ts.map