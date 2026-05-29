import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

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

export type PermissionCreationAttributes = Optional<
  PermissionAttributes,
  'id' | 'description' | 'created_at' | 'updated_at' | 'deleted_at' |
  'created_by' | 'updated_by' | 'deleted_by'
>;

export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  declare id: string;
  declare name: string;
  declare code: string;
  declare module: string;
  declare resource: string;
  declare action: string;
  declare description: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

Permission.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    name: { type: DataTypes.STRING(128), allowNull: false },
    code: { type: DataTypes.STRING(128), allowNull: false },
    module: { type: DataTypes.STRING(64), allowNull: false },
    resource: { type: DataTypes.STRING(64), allowNull: false },
    action: { type: DataTypes.STRING(64), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'permissions',
    modelName: 'Permission',
    timestamps: false,
  },
);
