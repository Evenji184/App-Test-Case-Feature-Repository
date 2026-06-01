import { Model, Optional } from 'sequelize';
export interface AiProviderAttributes {
    id: string;
    name: string;
    website_url: string | null;
    provider_format: string;
    request_url: string;
    api_key_encrypted: string | null;
    api_key_hint: string;
    model_name: string | null;
    is_default: boolean;
    status: string;
    remark: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export type AiProviderCreationAttributes = Optional<AiProviderAttributes, 'id' | 'website_url' | 'api_key_encrypted' | 'model_name' | 'is_default' | 'status' | 'remark' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'>;
export declare class AiProvider extends Model<AiProviderAttributes, AiProviderCreationAttributes> implements AiProviderAttributes {
    id: string;
    name: string;
    website_url: string | null;
    provider_format: string;
    request_url: string;
    api_key_encrypted: string | null;
    api_key_hint: string;
    model_name: string | null;
    is_default: boolean;
    status: string;
    remark: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export interface PromptAttributes {
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
}
export type PromptCreationAttributes = Optional<PromptAttributes, 'id' | 'name' | 'model' | 'usage_info' | 'node_ids' | 'feature_ids' | 'custom_instruction' | 'provider_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'>;
export declare class Prompt extends Model<PromptAttributes, PromptCreationAttributes> implements PromptAttributes {
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
}
//# sourceMappingURL=AiModels.d.ts.map