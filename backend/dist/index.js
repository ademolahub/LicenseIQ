"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pino_1 = __importDefault(require("pino"));
const config_1 = require("./config");
const storage_1 = require("./storage");
const logger = (0, pino_1.default)({
    level: config_1.config.LOG_LEVEL,
    base: { app: 'licenseiq-backend' },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
});
const app = (0, express_1.default)();
// Initialize storage clients
(0, storage_1.getStorageClients)();
logger.info({ mockMode: config_1.config.MOCK_MODE }, 'Storage clients initialized');
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', storage: config_1.config.MOCK_MODE ? 'mock' : 'azure' });
});
app.use((err, _req, res, _next) => {
    logger.error({ err }, 'Unhandled request error');
    const status = err && typeof err === 'object' && 'status' in err && typeof err.status === 'number'
        ? err.status
        : 500;
    const message = err && typeof err === 'object' && 'message' in err
        ? err.message
        : 'Internal Server Error';
    res.status(status).json({ error: message });
});
app.listen(config_1.config.PORT, () => {
    logger.info({ port: config_1.config.PORT, env: config_1.config.NODE_ENV }, 'LicenseIQ backend listening');
});
