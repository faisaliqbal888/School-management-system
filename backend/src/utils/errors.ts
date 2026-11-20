/**
 * Typed application errors.
 * Every error that reaches the client has a stable machine-readable `code`,
 * an HTTP status, and an optional `details` payload (usually validation issues).
 */
export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown
  readonly isOperational = true

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace?.(this, this.constructor)
  }
}

export const badRequest = (message = 'Invalid request', details?: unknown) =>
  new AppError(400, 'BAD_REQUEST', message, details)

export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'UNAUTHORIZED', message)

export const forbidden = (message = 'You do not have permission to perform this action') =>
  new AppError(403, 'FORBIDDEN', message)

export const notFound = (resource = 'Resource') =>
  new AppError(404, 'NOT_FOUND', `${resource} not found`)

export const conflict = (message = 'Resource already exists', details?: unknown) =>
  new AppError(409, 'CONFLICT', message, details)

export const tooManyRequests = (message = 'Too many requests') =>
  new AppError(429, 'TOO_MANY_REQUESTS', message)

export const internal = (message = 'Something went wrong') =>
  new AppError(500, 'INTERNAL_ERROR', message)
