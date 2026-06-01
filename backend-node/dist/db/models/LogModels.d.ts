import { Model, Optional } from 'sequelize';
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
export type AuditLogCreationAttributes = Optional<AuditLogAttributes, 'id' | 'user_id' | 'request_id' | 'target_type' | 'target_id' | 'target_name' | 'change_summary' | 'before_data' | 'after_data' | 'ip_address' | 'user_agent' | 'created_at'>;
export declare class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
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
export type RequestLogCreationAttributes = Optional<RequestLogAttributes, 'id' | 'query_string' | 'request_body' | 'response_status' | 'response_body' | 'duration_ms' | 'ip_address' | 'user_id' | 'user_agent' | 'trace_id' | 'created_at'>;
export declare class RequestLog extends Model<RequestLogAttributes, RequestLogCreationAttributes> implements RequestLogAttributes {
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
export type LoginLogCreationAttributes = Optional<LoginLogAttributes, 'id' | 'user_id' | 'login_type' | 'failure_reason' | 'ip_address' | 'user_agent' | 'occurred_at'>;
export declare class LoginLog extends Model<LoginLogAttributes, LoginLogCreationAttributes> implements LoginLogAttributes {
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
//# sourceMappingURL=LogModels.d.ts.map