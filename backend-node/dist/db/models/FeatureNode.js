"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureNode = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class FeatureNode extends sequelize_1.Model {
}
exports.FeatureNode = FeatureNode;
FeatureNode.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    code: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    remark: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    parent_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    node_type: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: 'normal' },
    path: { type: sequelize_1.DataTypes.STRING(1000), allowNull: false },
    level: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    sort_order: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_visible: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_locked: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    source_node_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    copied_from_node_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    moved_from_node_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    move_operation_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    copy_operation_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    deleted_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'feature_nodes',
    modelName: 'FeatureNode',
    timestamps: false,
});
//# sourceMappingURL=FeatureNode.js.map