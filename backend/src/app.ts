import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import path from 'node:path'
import { config } from './config/env.js'
import { globalLimiter } from './middleware/rate-limit.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { csrfProtection, issueCsrfToken } from './middleware/csrf.js'
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

  // Defence in depth for the cookie-authenticated API.
  app.use(csrfProtection)

  // Responses that carry a session must not be cached by a proxy; everything
  // else stays cacheable so read-heavy lists stay fast for many users.
  app.use((req, res, next) => {
    if (req.cookies?.refresh_token || req.get('authorization')) {
      res.setHeader('Cache-Control', 'no-store')
    }
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    next()
  })

  // Hands the SPA a CSRF token before it makes its first write.
  app.get(`${config.apiPrefix}/csrf`, (req, res) => {
    res.json({ success: true, data: { csrfToken: issueCsrfToken(req, res) } })
  })

  if (!config.isTest) {
    app.use(morgan(config.isProd ? 'combined' : 'dev'))
  }

  // ── uploaded files ────────────────────────────────────────
  // Avatars are the only user-supplied files the app serves. `Content-Disposition`
  // and the mime allowlist stop a stray HTML file from ever being rendered, and
  // no directory listing is exposed.
  app.use(
    '/uploads',
    express.static(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'), {
      index: false,
      dotfiles: 'deny',
      maxAge: '1d',
      setHeaders(res) {
        res.setHeader('Content-Disposition', 'inline')
        res.setHeader('X-Content-Type-Options', 'nosniff')
      },
    }),
  )

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
