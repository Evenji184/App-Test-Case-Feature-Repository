"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogs = listAuditLogs;
exports.listRequestLogs = listRequestLogs;
exports.listLoginLogs = listLoginLogs;
const sequelize_1 = require("sequelize");
const models_1 = require("../db/models");
async function listAuditLogs(params) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const where = {};
    if (params.operatorId)
        where.user_id = params.operatorId;
    if (params.action)
        where.action = params.action;
    if (keyword) {
        where[sequelize_1.Op.or] = [
            { action: { [sequelize_1.Op.like]: `%${keyword}%` } },
            { target_name: { [sequelize_1.Op.like]: `%${keyword}%` } },
        ];
    }
    const { count, rows } = await models_1.AuditLog.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const users = userIds.length
        ? await models_1.User.findAll({ where: { id: { [sequelize_1.Op.in]: userIds } } })
        : [];
    const userMap = new Map(users.map(u => [u.id, u]));
    const items = rows.map(l => ({
        ...l.toJSON(),
        operatorUsername: l.user_id ? (userMap.get(l.user_id)?.username ?? null) : null,
    }));
    return { total: count, items };
}
async function listRequestLogs(params) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const where = {};
    if (params.userId)
        where.user_id = params.userId;
    if (keyword) {
        where[sequelize_1.Op.or] = [
            { path: { [sequelize_1.Op.like]: `%${keyword}%` } },
        ];
    }
    const { count, rows } = await models_1.RequestLog.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const users = userIds.length
        ? await models_1.User.findAll({ where: { id: { [sequelize_1.Op.in]: userIds } } })
        : [];
    const userMap = new Map(users.map(u => [u.id, u]));
    const items = rows.map(l => ({
        ...l.toJSON(),
        username: l.user_id ? (userMap.get(l.user_id)?.username ?? null) : null,
    }));
    return { total: count, items };
}
async function listLoginLogs(params) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const where = {};
    if (params.userId)
        where.user_id = params.userId;
    if (params.success !== undefined)
        where.login_status = params.success ? 'success' : 'failed';
    if (keyword) {
        where[sequelize_1.Op.or] = [
            { username: { [sequelize_1.Op.like]: `%${keyword}%` } },
        ];
    }
    const { count, rows } = await models_1.LoginLog.findAndCountAll({
        where,
        order: [['occurred_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { total: count, items: rows };
}
//# sourceMappingURL=logService.js.map