import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

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

export type UserRoleCreationAttributes = Optional<
  UserRoleAttributes,
  'id' | 'deleted_at' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'deleted_by'
>;

export class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  declare id: string;
  declare user_id: string;
  declare role_id: string;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

UserRole.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    user_id: { type: DataTypes.CHAR(36), allowNull: false },
    role_id: { type: DataTypes.CHAR(36), allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'user_roles',
    modelName: 'UserRole',
    timestamps: false,
  },
);

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

export type RolePermissionCreationAttributes = Optional<
  RolePermissionAttributes,
  'id' | 'deleted_at' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'deleted_by'
>;

export class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  declare id: string;
  declare role_id: string;
  declare permission_id: string;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

RolePermission.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    role_id: { type: DataTypes.CHAR(36), allowNull: false },
    permission_id: { type: DataTypes.CHAR(36), allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    modelName: 'RolePermission',
    timestamps: false,
  },
);
