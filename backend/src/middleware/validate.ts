import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'

interface Schemas {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

/**
 * Validates and *replaces* request parts with parsed values, so downstream
 * handlers get typed, coerced data (numbers, defaults, trimmed strings).
 * ZodError bubbles to the central handler which turns it into a 400.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body)
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params
      next()
    } catch (err) {
      next(err)
    }
  }
}
