import { LoginLog } from '../db/models';
export declare function listAuditLogs(params: {
    keyword?: string;
    action?: string;
    operatorId?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    items: {
        operatorUsername: string | null;
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
    }[];
}>;
export declare function listRequestLogs(params: {
    keyword?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    items: {
        username: string | null;
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
    }[];
}>;
export declare function listLoginLogs(params: {
    keyword?: string;
    userId?: string;
    success?: boolean;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    items: LoginLog[];
}>;
//# sourceMappingURL=logService.d.ts.map