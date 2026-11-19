import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import { config } from './config/env.js'
import { globalLimiter } from './middleware/rate-limit.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { healthRouter } from './routes/health.routes.js'
import { apiRouter } from './routes/index.js'

/**
 * Builds the Express app without binding a port, so tests can drive it with
 * supertest and `server.ts` stays a thin bootstrap.
 */
export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  // ── security & parsing ────────────────────────────────────
  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin / server-to-server requests have no Origin header.
        if (!origin) return callback(null, true)
        if (config.corsOrigins.includes(origin)) return callback(null, true)
        return callback(new Error(`Origin ${origin} is not allowed by CORS`))
      },
      credentials: true,
    }),
  )
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser())

  if (!config.isTest) {
    app.use(morgan(config.isProd ? 'combined' : 'dev'))
  }

  // ── routes ────────────────────────────────────────────────
  app.use(config.apiPrefix, globalLimiter)
  app.use(config.apiPrefix, healthRouter)
  app.use(config.apiPrefix, apiRouter)

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        name: 'School Management System API',
        version: '0.1.0',
        docs: '/api/v1/health',
        apiPrefix: config.apiPrefix,
      },
    })
  })

  // ── errors (must be last) ─────────────────────────────────
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
