"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const http_1 = __importDefault(require("http"));
const typeDefs_1 = require("./graphql/typeDefs");
const resolvers_1 = require("./graphql/resolvers");
const scalars_1 = require("./graphql/scalars");
const requestLogger_1 = require("./middleware/requestLogger");
const ipWhitelist_1 = require("./middleware/ipWhitelist");
const connection_1 = require("./db/connection");
const config_1 = require("./config");
const jwt_1 = require("./utils/jwt");
const rbacService_1 = require("./services/rbacService");
const models_1 = require("./db/models");
async function main() {
    await (0, connection_1.connectDatabase)();
    const app = (0, express_1.default)();
    const httpServer = http_1.default.createServer(app);
    const server = new server_1.ApolloServer({
        typeDefs: typeDefs_1.typeDefs,
        resolvers: {
            DateTime: scalars_1.DateTimeScalar,
            ...resolvers_1.resolvers,
        },
        plugins: [(0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer })],
        formatError: (formattedError) => {
            return {
                message: formattedError.message,
                extensions: formattedError.extensions,
            };
        },
    });
    await server.start();
    app.set('trust proxy', true);
    app.use((0, cors_1.default)({
        origin: config_1.config.cors.origins,
        credentials: true,
    }));
    app.use(body_parser_1.default.json({ limit: '10mb' }));
    app.use(ipWhitelist_1.ipWhitelist);
    app.use(requestLogger_1.requestLogger);
    app.use('/graphql', (0, express4_1.expressMiddleware)(server, {
        context: async ({ req, res }) => {
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.ip ||
                req.socket?.remoteAddress ||
                '';
            let userId = null;
            let username = null;
            let isSuperAdmin = false;
            let permissionCodes = [];
            const authHeader = req.headers.authorization || '';
            const token = authHeader.startsWith('Bearer ')
                ? authHeader.slice(7).trim()
                : null;
            if (token) {
                try {
                    const payload = (0, jwt_1.verifyToken)(token);
                    userId = payload.sub;
                    username = payload.username;
                    const user = await models_1.User.findOne({
                        where: { id: userId, deleted_at: null },
                        attributes: ['is_super_admin'],
                    });
                    if (user) {
                        isSuperAdmin = user.get('is_super_admin');
                        permissionCodes = await (0, rbacService_1.getUserPermissions)(userId);
                    }
                    else {
                        userId = null;
                        username = null;
                    }
                }
                catch {
                    // invalid token — leave userId null
                }
            }
            // attach userId/username for requestLogger middleware
            req.userId = userId ?? undefined;
            req.username = username ?? undefined;
            return { req, res, userId, username, isSuperAdmin, permissionCodes, ipAddress };
        },
    }));
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    const { host, port } = config_1.config.app;
    await new Promise((resolve) => httpServer.listen({ port, host }, resolve));
    console.log(`🚀 Server ready at http://${host}:${port}/graphql`);
}
main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map