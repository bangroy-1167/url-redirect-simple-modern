/**
 * src/config/index.ts
 *
 * Environment configuration loader.
 * Load dari process.env dengan defaults.
 */
export declare const config: {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    rateLimit: {
        public: number;
        auth: number;
    };
    cors: {
        origins: string[];
    };
    qrCode: {
        size: number;
    };
};
//# sourceMappingURL=index.d.ts.map