import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from './env.js'

/**
 * Prisma Client with the WASM query compiler + node-postgres driver adapter.
 *
 * Why not the native engine?
 *   • No 10–20 MB native binary per platform to ship or download
 *   • Runs identically on Linux/macOS/Windows and serverless runtimes
 *   • `engineType = "client"` in prisma/schema.prisma enables it
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: config.databaseUrl })
  return new PrismaClient({
    adapter,
    log: config.isProd ? ['error'] : ['warn', 'error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (!config.isProd) globalForPrisma.prisma = prisma

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
}
