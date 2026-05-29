import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

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

export type RoleCreationAttributes = Optional<
  RoleAttributes,
  'id' | 'description' | 'is_system' | 'status' | 'created_at' | 'updated_at' |
  'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'
>;

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: string;
  declare name: string;
  declare code: string;
  declare description: string | null;
  declare is_system: boolean;
  declare status: string;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

Role.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    name: { type: DataTypes.STRING(128), allowNull: false },
    code: { type: DataTypes.STRING(64), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'roles',
    modelName: 'Role',
    timestamps: false,
  },
);
