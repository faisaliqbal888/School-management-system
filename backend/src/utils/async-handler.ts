import type { RequestHandler } from 'express'

/**
 * Wraps an async route handler so rejections reach the central error handler.
 * Express 4 does not await handlers itself, so without this an async throw
 * becomes an unhandled rejection and the request hangs.
 */
export function asyncHandler(
  fn: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next)
  }
}
