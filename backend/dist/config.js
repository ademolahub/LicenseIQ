"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z
        .string()
        .default('3001')
        .transform((value) => Number(value))
        .refine((value) => Number.isInteger(value) && value > 0, {
        message: 'PORT must be a positive integer',
    }),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    MOCK_MODE: zod_1.z
        .string()
        .default('false')
        .transform((value) => value === 'true'),
    AZURE_STORAGE_CONNECTION_STRING: zod_1.z.string().default(''),
    AZURE_STORAGE_ACCOUNT_NAME: zod_1.z.string().default(''),
    AZURE_STORAGE_ACCOUNT_KEY: zod_1.z.string().default(''),
});
const result = envSchema.safeParse(process.env);
if (!result.success) {
    const errors = result.error.errors
        .map((error) => `${error.path.join('.')}: ${error.message}`)
        .join(' | ');
    throw new Error(`Environment validation failed: ${errors}`);
}
exports.config = result.data;
