import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

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

export type AiProviderCreationAttributes = Optional<
  AiProviderAttributes,
  'id' | 'website_url' | 'api_key_encrypted' | 'model_name' | 'is_default' | 'status' | 'remark' |
  'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'
>;

export class AiProvider extends Model<AiProviderAttributes, AiProviderCreationAttributes> implements AiProviderAttributes {
  declare id: string;
  declare name: string;
  declare website_url: string | null;
  declare provider_format: string;
  declare request_url: string;
  declare api_key_encrypted: string | null;
  declare api_key_hint: string;
  declare model_name: string | null;
  declare is_default: boolean;
  declare status: string;
  declare remark: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

AiProvider.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    website_url: { type: DataTypes.STRING(500), allowNull: true },
    provider_format: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'openai_compatible' },
    request_url: { type: DataTypes.STRING(500), allowNull: false },
    api_key_encrypted: { type: DataTypes.TEXT, allowNull: true },
    api_key_hint: { type: DataTypes.CHAR(32), allowNull: false, defaultValue: '' },
    model_name: { type: DataTypes.STRING(200), allowNull: true },
    is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    remark: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'ai_providers',
    modelName: 'AiProvider',
    timestamps: false,
  }
);

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

export type PromptCreationAttributes = Optional<
  PromptAttributes,
  'id' | 'name' | 'model' | 'usage_info' | 'node_ids' | 'feature_ids' | 'custom_instruction' | 'provider_id' |
  'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'
>;

export class Prompt extends Model<PromptAttributes, PromptCreationAttributes> implements PromptAttributes {
  declare id: string;
  declare name: string | null;
  declare content: string;
  declare model: string | null;
  declare usage_info: string | null;
  declare node_ids: string | null;
  declare feature_ids: string | null;
  declare custom_instruction: string | null;
  declare provider_id: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

Prompt.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    model: { type: DataTypes.STRING(200), allowNull: true },
    usage_info: { type: DataTypes.TEXT, allowNull: true },
    node_ids: { type: DataTypes.TEXT, allowNull: true },
    feature_ids: { type: DataTypes.TEXT, allowNull: true },
    custom_instruction: { type: DataTypes.TEXT, allowNull: true },
    provider_id: { type: DataTypes.CHAR(36), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'prompts',
    modelName: 'Prompt',
    timestamps: false,
  }
);
