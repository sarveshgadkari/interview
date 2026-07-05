// Parses CSV or TSV text (RFC4180-ish: supports quoted fields containing the
// delimiter, escaped quotes, and newlines). Delimiter is auto-detected from
// the first line: tab wins if present, otherwise comma.
export function parseDelimitedText(text: string): string[][] {
  const trimmed = text.replace(/^﻿/, '')
  if (!trimmed.trim()) return []

  const firstLine = trimmed.split(/\r\n|\n/, 1)[0] ?? ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i]
    const next = trimmed[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  row.push(field)
  if (row.length > 1 || row[0] !== '') rows.push(row)

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}
