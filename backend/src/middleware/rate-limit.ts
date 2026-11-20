import rateLimit from 'express-rate-limit'
import { config } from '../config/env.js'

/** Global limiter — applied to the whole API. */
export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later' },
  },
})

/** Stricter limiter for credential endpoints — slows down brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => config.isTest,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please wait 15 minutes.',
    },
  },
})
