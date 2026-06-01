export interface LoginResult {
    token: string;
    user: {
        id: string;
        username: string;
        fullName: string | null;
        email: string | null;
        avatar: string | null;
        isSuperAdmin: boolean;
        permissions: string[];
    };
}
export declare class AppError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare function authenticate(username: string, password: string, ipAddress?: string, userAgent?: string): Promise<LoginResult>;
export declare function resetPassword(userId: string, newPassword: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function changeMyPassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
//# sourceMappingURL=authService.d.ts.map