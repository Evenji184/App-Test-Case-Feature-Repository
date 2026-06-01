"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermission = exports.UserRole = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class UserRole extends sequelize_1.Model {
}
exports.UserRole = UserRole;
UserRole.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    user_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: false },
    role_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: false },
    deleted_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    created_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'user_roles',
    modelName: 'UserRole',
    timestamps: false,
});
class RolePermission extends sequelize_1.Model {
}
exports.RolePermission = RolePermission;
RolePermission.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    role_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: false },
    permission_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: false },
    deleted_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    created_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'role_permissions',
    modelName: 'RolePermission',
    timestamps: false,
});
//# sourceMappingURL=JoinTables.js.map