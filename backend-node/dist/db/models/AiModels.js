"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompt = exports.AiProvider = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class AiProvider extends sequelize_1.Model {
}
exports.AiProvider = AiProvider;
AiProvider.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    website_url: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    provider_format: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: 'openai_compatible' },
    request_url: { type: sequelize_1.DataTypes.STRING(500), allowNull: false },
    api_key_encrypted: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    api_key_hint: { type: sequelize_1.DataTypes.CHAR(32), allowNull: false, defaultValue: '' },
    model_name: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    is_default: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: sequelize_1.DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    remark: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    deleted_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'ai_providers',
    modelName: 'AiProvider',
    timestamps: false,
});
class Prompt extends sequelize_1.Model {
}
exports.Prompt = Prompt;
Prompt.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    content: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    model: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    usage_info: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    node_ids: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    feature_ids: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    custom_instruction: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    provider_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    deleted_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'prompts',
    modelName: 'Prompt',
    timestamps: false,
});
//# sourceMappingURL=AiModels.js.map