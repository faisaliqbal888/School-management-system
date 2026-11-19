import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../utils/async-handler.js'

export const healthRouter = Router()

/** Liveness — does the process respond at all? */
healthRouter.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '0.1.0',
    },
  })
})

/** Readiness — can we reach PostgreSQL? */
healthRouter.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    const startedAt = Date.now()
    try {
      await prisma.$queryRaw`SELECT 1`
      res.json({
        success: true,
        data: {
          status: 'ready',
          database: { status: 'up', latencyMs: Date.now() - startedAt },
        },
      })
    } catch {
      res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Database is not reachable' },
      })
    }
  }),
)
