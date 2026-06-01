import { User, Role } from '../db/models';
export declare function listUsers(params: {
    keyword?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    items: User[];
}>;
export declare function getUserWithRolesAndPermissions(userId: string): Promise<{
    user: User;
    roles: Role[];
    permissions: string[];
} | null>;
export declare function createUser(params: {
    username: string;
    password: string;
    email?: string;
    fullName?: string;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<User>;
export declare function updateUser(params: {
    userId: string;
    email?: string | null;
    fullName?: string | null;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<User>;
export declare function enableUser(userId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function disableUser(userId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function assignRolesToUser(userId: string, roleIds: string[], operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function deleteUser(userId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
//# sourceMappingURL=userService.d.ts.map