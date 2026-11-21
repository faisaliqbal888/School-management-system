/**
 * Minimal RFC 4180 CSV parser.
 *
 * Written rather than pulled in because the requirement is narrow (one file, a
 * header row, comma-separated, quoted fields with embedded commas/newlines) and
 * a hand-written parser is easier to reason about at the boundary where user
 * input enters the system. Handles CRLF, quoted fields, escaped quotes (`""`)
 * and a trailing newline.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let index = 0

  // Strip a UTF-8 BOM — Excel writes one and it would corrupt the first header.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    // Skip blank lines (trailing newline, or an empty separator row).
    if (row.length > 1 || row[0] !== '') rows.push(row)
    row = []
  }

  while (index < text.length) {
    const char = text[index]!

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
        index += 1
        continue
      }
      field += char
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      index += 1
      continue
    }
    if (char === ',') {
      pushField()
      index += 1
      continue
    }
    if (char === '\r') {
      index += 1
      continue
    }
    if (char === '\n') {
      pushRow()
      index += 1
      continue
    }

    field += char
    index += 1
  }

  // A file that does not end in a newline still has a last row.
  if (field !== '' || row.length > 0) pushRow()

  return rows
}

export interface CsvTable {
  headers: string[]
  rows: Array<Record<string, string>>
}

/** Parses into header-keyed records, normalising header names to snake_case. */
export function parseCsvTable(input: string): CsvTable {
  const [headerRow, ...dataRows] = parseCsv(input)
  if (!headerRow || headerRow.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = headerRow.map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .replace(/[^a-z0-9_]/g, ''),
  )

  const rows = dataRows.map((cells) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? '').trim()
    })
    return record
  })

  return { headers, rows }
}
