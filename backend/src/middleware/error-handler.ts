import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/errors.js'
import { fail } from '../utils/response.js'
import { config } from '../config/env.js'

/** 404 for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  fail(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} does not exist`)
}

/**
 * Central error handler. Order matters:
 *   ZodError   → 400 with field-level issues
 *   AppError   → its own status/code
 *   Prisma     → mapped to 409 / 400 with a friendly message
 *   everything → 500, internals hidden in production
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 1) validation
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }))
    fail(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details)
    return
  }

  // 2) known application errors
  if (err instanceof AppError) {
    fail(res, err.statusCode, err.code, err.message, err.details)
    return
  }

  // 3) Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const pe = err as Prisma.PrismaClientKnownRequestError
    switch (pe.code) {
      case 'P2002': {
        const target = (pe.meta?.target as string[] | undefined)?.join(', ') ?? 'field'
        fail(res, 409, 'DUPLICATE', `A record with this ${target} already exists`, {
          fields: pe.meta?.target,
        })
        return
      }
      case 'P2003':
        fail(res, 400, 'FOREIGN_KEY_VIOLATION', 'Referenced record does not exist')
        return
      case 'P2025':
        fail(res, 404, 'NOT_FOUND', 'Record not found')
        return
      case 'P2014':
        fail(res, 409, 'RELATION_VIOLATION', 'This change would break a required relation')
        return
      default:
        fail(res, 400, 'DATABASE_ERROR', 'The database rejected this operation')
        return
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    fail(res, 400, 'DATABASE_VALIDATION_ERROR', 'Invalid data supplied to the database layer')
    return
  }

  // 4) unknown
  // eslint-disable-next-line no-console
  console.error(`[error] ${req.method} ${req.originalUrl}`, err)
  fail(
    res,
    500,
    'INTERNAL_ERROR',
    config.isProd ? 'Something went wrong' : String((err as Error)?.message ?? err),
  )
}
