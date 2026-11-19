/**
 * Currency + date formatting (English locale, PKR).
 *
 * All money in the UI should go through these helpers so switching currency
 * or locale later only requires editing one file.
 */

const PKR = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
})

/** 12500 → "Rs 12,500" */
export function formatPKR(amount: number | string | null | undefined): string {
  const value = typeof amount === "string" ? Number(amount) : amount
  if (value == null || Number.isNaN(value)) return "—"
  return PKR.format(value).replace("PKR", "Rs")
}

/** 12500 → "Rs 12.5K" · 12500000 → "Rs 1.25Cr" (south-asian units) */
export function formatPKRCompact(amount: number | string | null | undefined): string {
  const value = typeof amount === "string" ? Number(amount) : amount
  if (value == null || Number.isNaN(value)) return "—"
  const abs = Math.abs(value)
  if (abs >= 1_00_00_000) return `Rs ${(value / 1_00_00_000).toFixed(2)}Cr`
  if (abs >= 1_00_000) return `Rs ${(value / 1_00_000).toFixed(2)}L`
  if (abs >= 1_000) return `Rs ${(value / 1_000).toFixed(1)}K`
  return `Rs ${value.toLocaleString("en-PK")}`
}

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

/** ISO string / Date → "19 Nov 2026" */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—"
  const date = input instanceof Date ? input : new Date(input)
  return Number.isNaN(date.getTime()) ? "—" : DATE.format(date)
}

/** 0.9456 → "94.6%" */
export function formatPercent(ratio: number | null | undefined, digits = 1): string {
  if (ratio == null || Number.isNaN(ratio)) return "—"
  return `${(ratio * 100).toFixed(digits)}%`
}
