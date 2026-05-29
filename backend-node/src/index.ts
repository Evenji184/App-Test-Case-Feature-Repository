import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { DateTimeScalar } from './graphql/scalars';
import { AppContext } from './graphql/context';
import { requestLogger } from './middleware/requestLogger';
import { ipWhitelist } from './middleware/ipWhitelist';
import { connectDatabase } from './db/connection';
import { config } from './config';
import { verifyToken } from './utils/jwt';
import { getUserPermissions } from './services/rbacService';
import { User } from './db/models';

async function main() {
  await connectDatabase();

  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<AppContext>({
    typeDefs,
    resolvers: {
      DateTime: DateTimeScalar,
      ...resolvers,
    },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (formattedError) => {
      return {
        message: formattedError.message,
        extensions: formattedError.extensions,
      };
    },
  });

  await server.start();

  app.set('trust proxy', true);

  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
  }));

  app.use(bodyParser.json({ limit: '10mb' }));

  app.use(ipWhitelist);
  app.use(requestLogger);

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<AppContext> => {
        const ipAddress =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.ip ||
          req.socket?.remoteAddress ||
          '';

        let userId: string | null = null;
        let username: string | null = null;
        let isSuperAdmin = false;
        let permissionCodes: string[] = [];

        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : null;

        if (token) {
          try {
            const payload = verifyToken(token);
            userId = payload.sub;
            username = payload.username;

            const user = await User.findOne({
              where: { id: userId, deleted_at: null },
              attributes: ['is_super_admin'],
            });

            if (user) {
              isSuperAdmin = user.get('is_super_admin') as boolean;
              permissionCodes = await getUserPermissions(userId);
            } else {
              userId = null;
              username = null;
            }
          } catch {
            // invalid token — leave userId null
          }
        }

        // attach userId/username for requestLogger middleware
        (req as express.Request & { userId?: string }).userId = userId ?? undefined;
        (req as express.Request & { username?: string }).username = username ?? undefined;

        return { req, res, userId, username, isSuperAdmin, permissionCodes, ipAddress };
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const { host, port } = config.app;
  await new Promise<void>((resolve) => httpServer.listen({ port, host }, resolve));
  console.log(`🚀 Server ready at http://${host}:${port}/graphql`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
