import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export interface AuditLogAttributes {
  id: string;
  user_id: string | null;
  request_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  change_summary: string | null;
  before_data: string | null;
  after_data: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export type AuditLogCreationAttributes = Optional<
  AuditLogAttributes,
  'id' | 'user_id' | 'request_id' | 'target_type' | 'target_id' | 'target_name' |
  'change_summary' | 'before_data' | 'after_data' | 'ip_address' | 'user_agent' | 'created_at'
>;

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: string;
  declare user_id: string | null;
  declare request_id: string | null;
  declare action: string;
  declare target_type: string | null;
  declare target_id: string | null;
  declare target_name: string | null;
  declare change_summary: string | null;
  declare before_data: string | null;
  declare after_data: string | null;
  declare ip_address: string | null;
  declare user_agent: string | null;
  declare created_at: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    user_id: { type: DataTypes.CHAR(36), allowNull: true },
    request_id: { type: DataTypes.CHAR(36), allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    target_type: { type: DataTypes.STRING(50), allowNull: true },
    target_id: { type: DataTypes.CHAR(36), allowNull: true },
    target_name: { type: DataTypes.STRING(200), allowNull: true },
    change_summary: { type: DataTypes.TEXT, allowNull: true },
    before_data: { type: DataTypes.TEXT, allowNull: true },
    after_data: { type: DataTypes.TEXT, allowNull: true },
    ip_address: { type: DataTypes.STRING(50), allowNull: true },
    user_agent: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    modelName: 'AuditLog',
    timestamps: false,
  }
);

export interface RequestLogAttributes {
  id: string;
  request_id: string;
  method: string;
  path: string;
  query_string: string | null;
  request_body: string | null;
  response_status: number | null;
  response_body: string | null;
  duration_ms: number | null;
  ip_address: string | null;
  user_id: string | null;
  user_agent: string | null;
  trace_id: string | null;
  created_at: Date;
}

export type RequestLogCreationAttributes = Optional<
  RequestLogAttributes,
  'id' | 'query_string' | 'request_body' | 'response_status' | 'response_body' |
  'duration_ms' | 'ip_address' | 'user_id' | 'user_agent' | 'trace_id' | 'created_at'
>;

export class RequestLog extends Model<RequestLogAttributes, RequestLogCreationAttributes> implements RequestLogAttributes {
  declare id: string;
  declare request_id: string;
  declare method: string;
  declare path: string;
  declare query_string: string | null;
  declare request_body: string | null;
  declare response_status: number | null;
  declare response_body: string | null;
  declare duration_ms: number | null;
  declare ip_address: string | null;
  declare user_id: string | null;
  declare user_agent: string | null;
  declare trace_id: string | null;
  declare created_at: Date;
}

RequestLog.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    request_id: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    method: { type: DataTypes.STRING(10), allowNull: false },
    path: { type: DataTypes.STRING(500), allowNull: false },
    query_string: { type: DataTypes.TEXT, allowNull: true },
    request_body: { type: DataTypes.TEXT, allowNull: true },
    response_status: { type: DataTypes.INTEGER, allowNull: true },
    response_body: { type: DataTypes.TEXT, allowNull: true },
    duration_ms: { type: DataTypes.INTEGER, allowNull: true },
    ip_address: { type: DataTypes.STRING(50), allowNull: true },
    user_id: { type: DataTypes.CHAR(36), allowNull: true },
    user_agent: { type: DataTypes.TEXT, allowNull: true },
    trace_id: { type: DataTypes.CHAR(36), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'request_logs',
    modelName: 'RequestLog',
    timestamps: false,
  }
);

export interface LoginLogAttributes {
  id: string;
  user_id: string | null;
  username: string;
  login_type: string | null;
  login_status: string;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  occurred_at: Date;
}

export type LoginLogCreationAttributes = Optional<
  LoginLogAttributes,
  'id' | 'user_id' | 'login_type' | 'failure_reason' | 'ip_address' | 'user_agent' | 'occurred_at'
>;

export class LoginLog extends Model<LoginLogAttributes, LoginLogCreationAttributes> implements LoginLogAttributes {
  declare id: string;
  declare user_id: string | null;
  declare username: string;
  declare login_type: string | null;
  declare login_status: string;
  declare failure_reason: string | null;
  declare ip_address: string | null;
  declare user_agent: string | null;
  declare occurred_at: Date;
}

LoginLog.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    user_id: { type: DataTypes.CHAR(36), allowNull: true },
    username: { type: DataTypes.STRING(100), allowNull: false },
    login_type: { type: DataTypes.STRING(50), allowNull: true },
    login_status: { type: DataTypes.STRING(20), allowNull: false },
    failure_reason: { type: DataTypes.STRING(500), allowNull: true },
    ip_address: { type: DataTypes.STRING(50), allowNull: true },
    user_agent: { type: DataTypes.TEXT, allowNull: true },
    occurred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'login_logs',
    modelName: 'LoginLog',
    timestamps: false,
  }
);
