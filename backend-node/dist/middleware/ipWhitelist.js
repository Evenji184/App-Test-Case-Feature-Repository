"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipWhitelist = ipWhitelist;
const config_1 = require("../config");
function ipWhitelist(req, res, next) {
    const allowedIps = config_1.config.security.ipWhitelist;
    if (!allowedIps || allowedIps.length === 0) {
        next();
        return;
    }
    const clientIp = req.ip || req.socket?.remoteAddress || '';
    const normalizedIp = clientIp.replace('::ffff:', '');
    if (allowedIps.includes(normalizedIp) || allowedIps.includes('*')) {
        next();
        return;
    }
    res.status(403).json({ error: 'IP not allowed' });
}
//# sourceMappingURL=ipWhitelist.js.map