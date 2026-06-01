"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    username: { type: sequelize_1.DataTypes.STRING(64), allowNull: false },
    email: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
    password_hash: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    display_name: { type: sequelize_1.DataTypes.STRING(128), allowNull: true },
    phone: { type: sequelize_1.DataTypes.STRING(32), allowNull: true },
    avatar_url: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    status: { type: sequelize_1.DataTypes.STRING(32), allowNull: false, defaultValue: 'active' },
    is_super_admin: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    last_login_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    last_login_ip: { type: sequelize_1.DataTypes.STRING(45), allowNull: true },
    remark: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    deleted_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    created_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: false,
});
//# sourceMappingURL=User.js.map