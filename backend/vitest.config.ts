import { defineConfig } from 'vitest/config'
import { config as loadEnv } from 'dotenv'

// Tests run against the same database the app uses, so read .env first.
loadEnv()

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      // Fall back to the configured local Postgres (port 5433 in this repo).
      DATABASE_URL: process.env['DATABASE_URL'] ?? 'postgresql://postgres@localhost:5433/school_db?schema=public',
      JWT_ACCESS_SECRET: 'test-access-secret-at-least-32-characters-long',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-characters-long',
    },
    testTimeout: 15_000,
  },
})
