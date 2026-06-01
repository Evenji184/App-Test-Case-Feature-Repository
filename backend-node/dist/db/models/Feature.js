"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class Feature extends sequelize_1.Model {
}
exports.Feature = Feature;
Feature.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    node_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: false },
    title: { type: sequelize_1.DataTypes.STRING(500), allowNull: false },
    code: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    summary: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    platform: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
    priority: { type: sequelize_1.DataTypes.STRING(20), allowNull: true },
    status: { type: sequelize_1.DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    version: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    tags: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    is_visible: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_archived: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    remark: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    source_feature_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    copied_from_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    moved_from_node_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    move_operation_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    copy_operation_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    last_copied_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    last_moved_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    deleted_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'features',
    modelName: 'Feature',
    timestamps: false,
});
//# sourceMappingURL=Feature.js.map