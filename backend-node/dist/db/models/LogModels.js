"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginLog = exports.RequestLog = exports.AuditLog = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../connection");
class AuditLog extends sequelize_1.Model {
}
exports.AuditLog = AuditLog;
AuditLog.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    user_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    request_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    action: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    target_type: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    target_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    target_name: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    change_summary: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    before_data: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    after_data: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    ip_address: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    user_agent: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'audit_logs',
    modelName: 'AuditLog',
    timestamps: false,
});
class RequestLog extends sequelize_1.Model {
}
exports.RequestLog = RequestLog;
RequestLog.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    request_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: false, unique: true },
    method: { type: sequelize_1.DataTypes.STRING(10), allowNull: false },
    path: { type: sequelize_1.DataTypes.STRING(500), allowNull: false },
    query_string: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    request_body: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    response_status: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    response_body: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    duration_ms: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    ip_address: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    user_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    user_agent: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    trace_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'request_logs',
    modelName: 'RequestLog',
    timestamps: false,
});
class LoginLog extends sequelize_1.Model {
}
exports.LoginLog = LoginLog;
LoginLog.init({
    id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true },
    user_id: { type: sequelize_1.DataTypes.CHAR(36), allowNull: true },
    username: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    login_type: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    login_status: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
    failure_reason: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    ip_address: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    user_agent: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    occurred_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: connection_1.sequelize,
    tableName: 'login_logs',
    modelName: 'LoginLog',
    timestamps: false,
});
//# sourceMappingURL=LogModels.js.map