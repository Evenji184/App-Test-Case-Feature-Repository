import { Sequelize } from 'sequelize';
import { config } from '../config';

const dbUrl = config.database.url;
const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (!match) {
  throw new Error(`Invalid DATABASE_URL: ${dbUrl}`);
}

const [, username, password, host, port, database] = match;

export const sequelize = new Sequelize(database, username, password, {
  host,
  port: parseInt(port, 10),
  dialect: 'mysql',
  logging: config.app.debug ? (msg) => console.debug('[SQL]', msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: false,
    freezeTableName: true,
    timestamps: false,
  },
  timezone: '+08:00',
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
});

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
  console.log('[DB] Connected to MySQL successfully');
}
