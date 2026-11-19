import type { Response } from 'express'

/**
 * Uniform response envelope — the frontend can rely on these two shapes:
 *
 *   success: { success: true,  data, meta? }
 *   failure: { success: false, error: { code, message, details? } }
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function ok<T>(res: Response, data: T, meta?: PaginationMeta, status = 200): void {
  res.status(status).json(meta ? { success: true, data, meta } : { success: true, data })
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, undefined, 201)
}

export function noContent(res: Response): void {
  res.status(204).send()
}

export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  res.status(status).json({
    success: false,
    error: details === undefined ? { code, message } : { code, message, details },
  })
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}
