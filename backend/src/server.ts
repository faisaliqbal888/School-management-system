import { createApp } from './app.js'
import { config } from './config/env.js'
import { disconnectPrisma, prisma } from './config/prisma.js'

async function bootstrap(): Promise<void> {
  const app = createApp()

  // Fail fast: the API is useless without a database.
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '\n✗ Cannot reach PostgreSQL.\n' +
        '  Check DATABASE_URL in backend/.env and that the database is running.\n' +
        '  Then run:  npm run migrate:deploy\n',
      (err as Error).message,
    )
    process.exit(1)
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(
      `\n✓ SMS API listening on http://localhost:${config.port}${config.apiPrefix}\n` +
        `  env: ${config.nodeEnv} · health: ${config.apiPrefix}/health\n`,
    )
  })

  const shutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — shutting down`)
    server.close(() => {
      void disconnectPrisma().finally(() => process.exit(0))
    })
    // Force-exit if connections hang.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

void bootstrap()
