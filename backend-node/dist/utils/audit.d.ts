export declare function logAudit(params: {
    userId?: string | null;
    action: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    detail?: string;
    ipAddress?: string;
}): Promise<void>;
export declare function logLogin(params: {
    userId?: string | null;
    username: string;
    loginStatus: 'success' | 'failed';
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
}): Promise<void>;
//# sourceMappingURL=audit.d.ts.map