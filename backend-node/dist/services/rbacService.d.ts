export interface PermissionTree {
    module: string;
    resources: {
        resource: string;
        actions: {
            id: string;
            name: string;
            code: string;
            action: string;
            description: string | null;
        }[];
    }[];
}
export declare function getUserPermissions(userId: string): Promise<string[]>;
export declare function userHasPermission(permCodes: string[], required: string): boolean;
export declare function getPermissionTree(): Promise<PermissionTree[]>;
//# sourceMappingURL=rbacService.d.ts.map