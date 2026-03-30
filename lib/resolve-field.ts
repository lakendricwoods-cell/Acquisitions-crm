type AnyRecord = Record<string, any>

type Lead = {
  [key: string]: any
  raw_import_data?: AnyRecord | null
  source_columns?: AnyRecord | null
  lead_intelligence?: AnyRecord | null
}

function hasUsableValue(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

function normalizeKey(key: string) {
  return String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function getExactValue(record: AnyRecord, key: string) {
  const candidates = [
    key,
    key.toLowerCase(),
    key.toUpperCase(),
    key.replace(/_/g, ' '),
    key.toLowerCase().replace(/_/g, ' '),
    key.replace(/\s+/g, '_'),
    key.toLowerCase().replace(/\s+/g, '_'),
  ]

  for (const candidate of candidates) {
    if (candidate in record && hasUsableValue(record[candidate])) {
      return record[candidate]
    }
  }

  return undefined
}

function getLooseValue(record: AnyRecord, aliases: string[]) {
  const aliasSet = new Set(aliases.map(normalizeKey))

  for (const [rawKey, rawValue] of Object.entries(record)) {
    if (!hasUsableValue(rawValue)) continue

    const normalizedRawKey = normalizeKey(rawKey)
    if (!normalizedRawKey) continue

    if (aliasSet.has(normalizedRawKey)) {
      return rawValue
    }

    for (const alias of aliasSet) {
      if (
        normalizedRawKey.includes(alias) ||
        alias.includes(normalizedRawKey)
      ) {
        return rawValue
      }
    }
  }

  return undefined
}

function getFromRecord(record: AnyRecord | null | undefined, aliases: string[]) {
  if (!record) return undefined

  for (const alias of aliases) {
    const exact = getExactValue(record, alias)
    if (hasUsableValue(exact)) return exact
  }

  const loose = getLooseValue(record, aliases)
  if (hasUsableValue(loose)) return loose

  return undefined
}

function getSearchRecords(lead: Lead) {
  return [
    lead,
    lead.lead_intelligence || null,
    lead.raw_import_data || null,
    lead.source_columns || null,
  ]
}

export function resolveField(
  lead: Lead,
  aliases: string[],
  fallback: any = null
) {
  for (const record of getSearchRecords(lead)) {
    const value = getFromRecord(record, aliases)
    if (hasUsableValue(value)) {
      return value
    }
  }

  return fallback
}

export function resolveNumericField(
  lead: Lead,
  aliases: string[],
  fallback: number | null = null,
  options?: {
    treatZeroAsMissing?: boolean
    min?: number
  }
) {
  const treatZeroAsMissing = options?.treatZeroAsMissing ?? false
  const min = options?.min ?? null

  const isValid = (value: number | null) => {
    if (value === null) return false
    if (treatZeroAsMissing && value === 0) return false
    if (min !== null && value < min) return false
    return true
  }

  for (const record of getSearchRecords(lead)) {
    if (!record) continue

    for (const alias of aliases) {
      const exact = parseNumber(getExactValue(record, alias))
      if (isValid(exact)) return exact
    }

    const loose = parseNumber(getLooseValue(record, aliases))
    if (isValid(loose)) return loose
  }

  return fallback
}