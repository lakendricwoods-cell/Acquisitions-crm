type LeadLike = Record<string, any>

function normalizeKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[%]/g, ' percent ')
    .replace(/[$]/g, ' dollar ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function buildRawMap(lead: LeadLike) {
  const raw = lead?.raw_import_data || {}
  const sourceColumns = lead?.source_columns || {}
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(raw)) {
    out[normalizeKey(key)] = value
  }

  for (const [key, value] of Object.entries(sourceColumns)) {
    out[normalizeKey(key)] = value
  }

  return out
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export function resolveLeadField(
  lead: LeadLike,
  directKeys: string[],
  rawAliases: string[]
) {
  for (const key of directKeys) {
    const value = lead?.[key]
    if (hasValue(value)) return value
  }

  const rawMap = buildRawMap(lead)

  for (const alias of rawAliases) {
    const value = rawMap[normalizeKey(alias)]
    if (hasValue(value)) return value
  }

  return null
}

export function resolveLeadNumber(
  lead: LeadLike,
  directKeys: string[],
  rawAliases: string[]
) {
  const value = resolveLeadField(lead, directKeys, rawAliases)
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function resolveLeadText(
  lead: LeadLike,
  directKeys: string[],
  rawAliases: string[]
) {
  const value = resolveLeadField(lead, directKeys, rawAliases)
  if (value === null || value === undefined) return null

  const text = String(value).trim()
  return text.length ? text : null
}

export function resolveLeadBoolean(
  lead: LeadLike,
  directKeys: string[],
  rawAliases: string[]
) {
  const value = resolveLeadField(lead, directKeys, rawAliases)

  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value

  const text = String(value).trim().toLowerCase()

  if (
    ['1', 'true', 'yes', 'y', 'occupied', 'owner occupied', 'homestead', 'primary'].includes(text)
  ) {
    return true
  }

  if (
    ['0', 'false', 'no', 'n', 'vacant', 'non owner occupied', 'not owner occupied'].includes(text)
  ) {
    return false
  }

  return null
}