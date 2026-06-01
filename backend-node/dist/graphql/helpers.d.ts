import { AppContext } from './context';
export declare function requireAuth(ctx: AppContext): void;
export declare function requirePermission(ctx: AppContext, permission: string): void;
export declare function makeErrorResult(err: unknown): {
    success: boolean;
    message: string;
    error: {
        code: string;
        message: string;
    };
};
//# sourceMappingURL=helpers.d.ts.map