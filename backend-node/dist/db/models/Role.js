"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class Role extends sequelize_1.Model {
}
exports.Role = Role;
Role.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING(128), allowNull: false },
    code: { type: sequelize_1.DataTypes.STRING(64), allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    is_system: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: sequelize_1.DataTypes.STRING(32), allowNull: false, defaultValue: 'active' },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    deleted_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'roles',
    modelName: 'Role',
    timestamps: false,
});
//# sourceMappingURL=Role.js.map