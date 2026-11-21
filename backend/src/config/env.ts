import 'dotenv/config'
import { z } from 'zod'

/**
 * Every environment variable the app reads is declared and validated here.
 * The process refuses to start with a bad configuration — no silent fallbacks
 * for secrets in production.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  // ── outbound email / SMS ──────────────────────────────────
  // Disabled unless DELIVERY_ENABLED=true, so a local checkout never sends
  // anything by accident even if a URL is left in the environment.
  DELIVERY_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  EMAIL_PROVIDER: z.enum(['generic', 'resend']).default('generic'),
  EMAIL_API_URL: z.string().url().optional(),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('no-reply@school.local'),
  SMS_API_URL: z.string().url().optional(),
  SMS_API_KEY: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  // eslint-disable-next-line no-console
  console.error(`\n✗ Invalid environment configuration:\n${issues}\n`)
  process.exit(1)
}

const env = parsed.data

export const config = {
  nodeEnv: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  databaseUrl: env.DATABASE_URL,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  bcryptRounds: env.BCRYPT_ROUNDS,
  corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
  delivery: {
    enabled: env.DELIVERY_ENABLED,
    emailProvider: env.EMAIL_PROVIDER,
    emailUrl: env.EMAIL_API_URL,
    smsUrl: env.SMS_API_URL,
    apiKey: env.EMAIL_API_KEY ?? env.SMS_API_KEY,
    fromEmail: env.EMAIL_FROM,
  },
} as const

export type Config = typeof config
