import { AppContext } from './context';
type PaginationInput = {
    page?: number;
    pageSize?: number;
} | undefined;
export declare const resolvers: {
    Query: {
        currentUser: (_: unknown, __: unknown, ctx: AppContext) => Promise<{
            id: string;
            username: string;
            email: string | null;
            displayName: string | null;
            phone: string | null;
            avatarUrl: string | null;
            status: string;
            isSuperAdmin: boolean;
            roleIds: string[];
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
            remark: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null>;
        userList: (_: unknown, args: {
            pagination: PaginationInput;
            keyword?: string;
        }, ctx: AppContext) => Promise<{
            items: {
                id: string;
                username: string;
                email: string | null;
                displayName: string | null;
                phone: string | null;
                avatarUrl: string | null;
                status: string;
                isSuperAdmin: boolean;
                roleIds: string[];
                lastLoginAt: Date | null;
                lastLoginIp: string | null;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            pageInfo: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        }>;
        roleList: (_: unknown, args: {
            pagination: PaginationInput;
        }, ctx: AppContext) => Promise<{
            items: {
                id: string;
                name: string;
                code: string;
                description: string | null;
                isSystem: boolean;
                status: string;
                permissionIds: string[];
                createdAt: Date;
                updatedAt: Date;
            }[];
            pageInfo: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        }>;
        permissionTree: (_: unknown, __: unknown, ctx: AppContext) => Promise<{
            module: string;
            resources: {
                resource: string;
                permissions: {
                    id: string;
                    name: string;
                    code: string;
                    action: string;
                    description: string | null;
                }[];
            }[];
        }[]>;
        nodeTree: (_: unknown, __: unknown, ctx: AppContext) => Promise<unknown[]>;
        nodeList: (_: unknown, args: {
            pagination: PaginationInput;
        }, ctx: AppContext) => Promise<{
            items: unknown[];
            pageInfo: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        }>;
        nodeDetail: (_: unknown, args: {
            nodeId: string;
        }, ctx: AppContext) => Promise<unknown>;
        searchNodes: (_: unknown, args: {
            keyword: string;
            pagination: PaginationInput;
        }, ctx: AppContext) => Promise<{
            items: unknown[];
            pageInfo: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        }>;
        featureList: (_: unknown, args: {
            pagination: PaginationInput;
            nodeIds?: string[];
            includeHidden?: boolean;
        }, ctx: AppContext) => Promise<{
            items: {
                id: string;
                nodeId: string;
                title: string;
                code: string;
                summary: string | null;
                description: string | null;
                platform: string | null;
                priority: string | null;
                status: string;
                version: string | null;
                tags: string | null;
                isVisible: boolean;
                isArchived: boolean;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            pageInfo: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        }>;
        featureDetail: (_: unknown, args: {
            featureId: string;
        }, ctx: AppContext) => Promise<{
            id: string;
            nodeId: string;
            title: string;
            code: string;
            summary: string | null;
            description: string | null;
            platform: string | null;
            priority: string | null;
            status: string;
            version: string | null;
            tags: string | null;
            isVisible: boolean;
            isArchived: boolean;
            remark: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null>;
        searchFeatures: (_: unknown, args: {
            keyword: string;
            pagination: PaginationInput;
            includeHidden?: boolean;
        }, ctx: AppContext) => Promise<{
            items: {
                id: string;
                nodeId: string;
                title: string;
                code: string;
                summary: string | null;
                description: string | null;
                platform: string | null;
                priority: string | null;
                status: string;
                version: string | null;
                tags: string | null;
                isVisible: boolean;
                isArchived: boolean;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            pageInfo: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        }>;
        auditLogList: (_: unknown, args: {
            keyword?: string;
            action?: string;
            operatorId?: string;
            page?: number;
            pageSize?: number;
        }, ctx: AppContext) => Promise<{
            total: number;
            items: {
                id: unknown;
                operatorId: unknown;
                operatorUsername: unknown;
                action: unknown;
                resourceType: unknown;
                resourceId: unknown;
                resourceName: unknown;
                detail: unknown;
                ipAddress: unknown;
                createdAt: unknown;
            }[];
        }>;
        requestLogList: (_: unknown, args: {
            keyword?: string;
            userId?: string;
            page?: number;
            pageSize?: number;
        }, ctx: AppContext) => Promise<{
            total: number;
            items: {
                id: unknown;
                method: unknown;
                path: unknown;
                ipAddress: unknown;
                userId: unknown;
                username: unknown;
                statusCode: unknown;
                responseTimeMs: unknown;
                userAgent: unknown;
                createdAt: unknown;
            }[];
        }>;
        loginLogList: (_: unknown, args: {
            keyword?: string;
            userId?: string;
            success?: boolean;
            page?: number;
            pageSize?: number;
        }, ctx: AppContext) => Promise<{
            total: number;
            items: {
                id: string;
                userId: string | null;
                username: string;
                success: boolean;
                ipAddress: string | null;
                userAgent: string | null;
                failureReason: string | null;
                createdAt: Date;
            }[];
        }>;
        aiProviderList: (_: unknown, args: {
            pagination: PaginationInput;
        }, ctx: AppContext) => Promise<{
            items: {
                id: string;
                name: string;
                providerFormat: string;
                requestUrl: string;
                apiKeyHint: string;
                modelName: string | null;
                websiteUrl: string | null;
                isDefault: boolean;
                status: string;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            pageInfo: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        }>;
        promptList: (_: unknown, args: {
            pagination: PaginationInput;
            keyword?: string;
            createdBy?: string;
        }, ctx: AppContext) => Promise<{
            items: {
                id: string;
                name: string | null;
                content: string;
                model: string | null;
                providerId: string | null;
                providerName: string | null;
                createdById: string | null;
                createdByName: string | null;
                nodeIds: string | null;
                featureIds: string | null;
                customInstruction: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            pageInfo: {
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
            };
        }>;
    };
    Mutation: {
        login: (_: unknown, args: {
            username: string;
            password: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                accessToken: string;
                tokenType: string;
                permissions: string[];
                user: {
                    id: string;
                    username: string;
                    email: string | null;
                    displayName: string | null;
                    status: string;
                    isSuperAdmin: boolean;
                };
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        logout: (_: unknown, __: unknown, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
        }>;
        resetPassword: (_: unknown, args: {
            userId: string;
            newPassword: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        changeMyPassword: (_: unknown, args: {
            oldPassword: string;
            newPassword: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        createUser: (_: unknown, args: {
            input: {
                username: string;
                password: string;
                email?: string;
                displayName?: string;
                phone?: string;
                avatarUrl?: string;
                remark?: string;
                isSuperAdmin?: boolean;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                username: string;
                email: string | null;
                displayName: string | null;
                phone: string | null;
                avatarUrl: string | null;
                status: string;
                isSuperAdmin: boolean;
                roleIds: string[];
                lastLoginAt: Date | null;
                lastLoginIp: string | null;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        updateUser: (_: unknown, args: {
            userId: string;
            input: {
                email?: string;
                displayName?: string;
                phone?: string;
                avatarUrl?: string;
                remark?: string;
                isSuperAdmin?: boolean;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                username: string;
                email: string | null;
                displayName: string | null;
                phone: string | null;
                avatarUrl: string | null;
                status: string;
                isSuperAdmin: boolean;
                roleIds: string[];
                lastLoginAt: Date | null;
                lastLoginIp: string | null;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        enableUser: (_: unknown, args: {
            userId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        disableUser: (_: unknown, args: {
            userId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        assignRolesToUser: (_: unknown, args: {
            userId: string;
            roleIds: string[];
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        deleteUser: (_: unknown, args: {
            userId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        createRole: (_: unknown, args: {
            input: {
                name: string;
                code: string;
                description?: string;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                name: string;
                code: string;
                description: string | null;
                isSystem: boolean;
                status: string;
                permissionIds: string[];
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        updateRole: (_: unknown, args: {
            roleId: string;
            input: {
                name?: string;
                description?: string | null;
                status?: string;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                name: string;
                code: string;
                description: string | null;
                isSystem: boolean;
                status: string;
                permissionIds: string[];
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        assignPermissionsToRole: (_: unknown, args: {
            roleId: string;
            permissionIds: string[];
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        deleteRole: (_: unknown, args: {
            roleId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        createNode: (_: unknown, args: {
            input: {
                name: string;
                code: string;
                nodeType?: string;
                parentId?: string;
                sortOrder?: number;
                remark?: string;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: unknown;
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        updateNode: (_: unknown, args: {
            nodeId: string;
            input: {
                name?: string;
                code?: string;
                nodeType?: string;
                parentId?: string | null;
                sortOrder?: number;
                remark?: string | null;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: unknown;
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        deleteNode: (_: unknown, args: {
            nodeId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        hideNode: (_: unknown, args: {
            nodeId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        showNode: (_: unknown, args: {
            nodeId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        copyNode: (_: unknown, args: {
            nodeId: string;
            targetParentId?: string | null;
            newName?: string | null;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: unknown;
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        moveNode: (_: unknown, args: {
            nodeId: string;
            targetParentId?: string | null;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: unknown;
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        createFeature: (_: unknown, args: {
            input: {
                nodeId: string;
                title: string;
                code: string;
                summary?: string;
                description?: string;
                platform?: string;
                priority?: string;
                version?: string;
                tags?: string;
                remark?: string;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                nodeId: string;
                title: string;
                code: string;
                summary: string | null;
                description: string | null;
                platform: string | null;
                priority: string | null;
                status: string;
                version: string | null;
                tags: string | null;
                isVisible: boolean;
                isArchived: boolean;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        updateFeature: (_: unknown, args: {
            featureId: string;
            input: {
                title?: string;
                summary?: string | null;
                description?: string | null;
                platform?: string | null;
                priority?: string | null;
                version?: string | null;
                tags?: string | null;
                remark?: string | null;
            };
            expectedUpdatedAt?: string | null;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                nodeId: string;
                title: string;
                code: string;
                summary: string | null;
                description: string | null;
                platform: string | null;
                priority: string | null;
                status: string;
                version: string | null;
                tags: string | null;
                isVisible: boolean;
                isArchived: boolean;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        deleteFeature: (_: unknown, args: {
            featureId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        hideFeature: (_: unknown, args: {
            featureId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        showFeature: (_: unknown, args: {
            featureId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        copyFeature: (_: unknown, args: {
            featureId: string;
            targetNodeId?: string | null;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                nodeId: string;
                title: string;
                code: string;
                summary: string | null;
                description: string | null;
                platform: string | null;
                priority: string | null;
                status: string;
                version: string | null;
                tags: string | null;
                isVisible: boolean;
                isArchived: boolean;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        moveFeature: (_: unknown, args: {
            featureId: string;
            targetNodeId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                nodeId: string;
                title: string;
                code: string;
                summary: string | null;
                description: string | null;
                platform: string | null;
                priority: string | null;
                status: string;
                version: string | null;
                tags: string | null;
                isVisible: boolean;
                isArchived: boolean;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        createAiProvider: (_: unknown, args: {
            input: {
                name: string;
                providerFormat: string;
                requestUrl: string;
                apiKey?: string;
                modelName?: string;
                websiteUrl?: string;
                isDefault?: boolean;
                remark?: string;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                name: string;
                providerFormat: string;
                requestUrl: string;
                apiKeyHint: string;
                modelName: string | null;
                websiteUrl: string | null;
                isDefault: boolean;
                status: string;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        updateAiProvider: (_: unknown, args: {
            providerId: string;
            input: {
                name?: string;
                requestUrl?: string;
                apiKey?: string;
                modelName?: string | null;
                websiteUrl?: string | null;
                isDefault?: boolean;
                remark?: string | null;
                status?: string;
                providerFormat?: string;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            data: {
                id: string;
                name: string;
                providerFormat: string;
                requestUrl: string;
                apiKeyHint: string;
                modelName: string | null;
                websiteUrl: string | null;
                isDefault: boolean;
                status: string;
                remark: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } | {
            data: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        deleteAiProvider: (_: unknown, args: {
            providerId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        testAiConnection: (_: unknown, args: {
            providerId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        generatePrompt: (_: unknown, args: {
            input: {
                nodeIds: string[];
                featureIds?: string[];
                customInstruction?: string;
                providerId?: string;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: null;
            content: string;
            model: string | null;
            usage: null;
        } | {
            content: null;
            model: null;
            usage: null;
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        }>;
        savePrompt: (_: unknown, args: {
            input: {
                content: string;
                model?: string;
                name?: string;
                nodeIds?: string;
                featureIds?: string;
                customInstruction?: string;
            };
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        deletePrompt: (_: unknown, args: {
            promptId: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
        updatePromptName: (_: unknown, args: {
            promptId: string;
            name: string;
        }, ctx: AppContext) => Promise<{
            success: boolean;
            message: string;
            error: {
                code: string;
                message: string;
            };
        } | {
            success: boolean;
            message: string;
            error: null;
        }>;
    };
};
export {};
//# sourceMappingURL=resolvers.d.ts.map