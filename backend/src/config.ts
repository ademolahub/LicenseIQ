import { z } from 'zod'

const envSchema = z.object({
  PORT: z
    .string()
    .default('3001')
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value > 0, {
      message: 'PORT must be a positive integer',
    }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  MOCK_MODE: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  AZURE_STORAGE_CONNECTION_STRING: z.string().default(''),
  AZURE_STORAGE_ACCOUNT_NAME: z.string().default(''),
  AZURE_STORAGE_ACCOUNT_KEY: z.string().default(''),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  const errors = result.error.errors
    .map((error) => `${error.path.join('.')}: ${error.message}`)
    .join(' | ')

  throw new Error(`Environment validation failed: ${errors}`)
}

export const config = result.data
