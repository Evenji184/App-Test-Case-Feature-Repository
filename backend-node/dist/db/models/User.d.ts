import { Model, Optional } from 'sequelize';
export interface UserAttributes {
    id: string;
    username: string;
    email: string | null;
    password_hash: string;
    display_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    status: string;
    is_super_admin: boolean;
    last_login_at: Date | null;
    last_login_ip: string | null;
    remark: string | null;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'email' | 'display_name' | 'phone' | 'avatar_url' | 'status' | 'is_super_admin' | 'last_login_at' | 'last_login_ip' | 'remark' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'>;
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    username: string;
    email: string | null;
    password_hash: string;
    display_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    status: string;
    is_super_admin: boolean;
    last_login_at: Date | null;
    last_login_ip: string | null;
    remark: string | null;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
//# sourceMappingURL=User.d.ts.map