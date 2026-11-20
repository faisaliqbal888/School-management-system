import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationQuery = z.infer<typeof paginationSchema>

export function toPrismaSkipTake(q: PaginationQuery): { skip: number; take: number } {
  return { skip: (q.page - 1) * q.limit, take: q.limit }
}

/**
 * Whitelists `sortBy` against the columns a model actually exposes, so a query
 * string can never be used to sort by an unknown/expensive column.
 */
export function toOrderBy(
  q: PaginationQuery,
  allowed: readonly string[],
  fallback = 'createdAt',
): Record<string, 'asc' | 'desc'> {
  const field = q.sortBy && allowed.includes(q.sortBy) ? q.sortBy : fallback
  return { [field]: q.sortOrder }
}
