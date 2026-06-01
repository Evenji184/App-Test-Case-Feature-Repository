import { AiProvider, Prompt, User } from '../db/models';
export declare function listProviders(): Promise<AiProvider[]>;
export declare function createProvider(params: {
    name: string;
    providerFormat: string;
    requestUrl: string;
    apiKey?: string;
    modelName?: string;
    isDefault?: boolean;
    description?: string;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<AiProvider>;
export declare function updateProvider(params: {
    providerId: string;
    name?: string;
    requestUrl?: string;
    apiKey?: string | null;
    modelName?: string | null;
    isDefault?: boolean;
    description?: string | null;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<AiProvider>;
export declare function deleteProvider(providerId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function testAiConnection(providerId: string): Promise<void>;
export declare function generatePrompt(params: {
    nodeIds: string[];
    featureIds?: string[];
    customInstruction?: string;
    providerId?: string;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<Prompt>;
export declare function savePrompt(params: {
    content: string;
    model?: string;
    name?: string;
    nodeIds?: string;
    featureIds?: string;
    customInstruction?: string;
    operatorId: string;
}): Promise<Prompt>;
export declare function listPrompts(params: {
    providerId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    items: {
        provider: AiProvider | null;
        createdByUser: User | null;
        id: string;
        name: string | null;
        content: string;
        model: string | null;
        usage_info: string | null;
        node_ids: string | null;
        feature_ids: string | null;
        custom_instruction: string | null;
        provider_id: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string | null;
        updated_by: string | null;
        deleted_by: string | null;
    }[];
}>;
export declare function deletePrompt(promptId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function updatePromptName(promptId: string, name: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<Prompt>;
//# sourceMappingURL=aiService.d.ts.map