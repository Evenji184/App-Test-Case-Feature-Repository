"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.connectDatabase = connectDatabase;
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
const dbUrl = config_1.config.database.url;
const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
    throw new Error(`Invalid DATABASE_URL: ${dbUrl}`);
}
const [, username, password, host, port, database] = match;
exports.sequelize = new sequelize_1.Sequelize(database, username, password, {
    host,
    port: parseInt(port, 10),
    dialect: 'mysql',
    logging: config_1.config.app.debug ? (msg) => console.debug('[SQL]', msg) : false,
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
async function connectDatabase() {
    await exports.sequelize.authenticate();
    console.log('[DB] Connected to MySQL successfully');
}
//# sourceMappingURL=connection.js.map