export declare const config: {
    app: {
        name: string;
        version: string;
        env: string;
        debug: boolean;
        host: string;
        port: number;
    };
    auth: {
        secretKey: string;
        jwtAlgorithm: string;
        accessTokenExpireMinutes: number;
    };
    database: {
        url: string;
    };
    cors: {
        origins: string[];
    };
    security: {
        ipWhitelist: string[];
    };
};
//# sourceMappingURL=config.d.ts.map