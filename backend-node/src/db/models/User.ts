import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

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

export type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'email' | 'display_name' | 'phone' | 'avatar_url' | 'status' | 'is_super_admin' |
  'last_login_at' | 'last_login_ip' | 'remark' | 'created_at' | 'updated_at' |
  'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare username: string;
  declare email: string | null;
  declare password_hash: string;
  declare display_name: string | null;
  declare phone: string | null;
  declare avatar_url: string | null;
  declare status: string;
  declare is_super_admin: boolean;
  declare last_login_at: Date | null;
  declare last_login_ip: string | null;
  declare remark: string | null;
  declare deleted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

User.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    username: { type: DataTypes.STRING(64), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    display_name: { type: DataTypes.STRING(128), allowNull: true },
    phone: { type: DataTypes.STRING(32), allowNull: true },
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active' },
    is_super_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    last_login_ip: { type: DataTypes.STRING(45), allowNull: true },
    remark: { type: DataTypes.TEXT, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: false,
  },
);
