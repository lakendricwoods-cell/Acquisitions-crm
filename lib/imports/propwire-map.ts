export type PropwireRow = Record<string, unknown>

export type WideLeadPayload = {
  source_name: string | null
  source_record_id: string | null
  source_columns: Record<string, unknown>
  raw_import_data: Record<string, unknown>

  property_address_1: string | null
  city: string | null
  state: string | null
  zip: string | null
  county: string | null
  apn: string | null

  owner_name: string | null
  owner_first_name: string | null
  owner_last_name: string | null
  owner_mailing_address: string | null
  owner_mailing_city: string | null
  owner_mailing_state: string | null
  owner_mailing_zip: string | null

  property_type: string | null
  property_use: string | null

  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  year_built: number | null

  owner_occupied: boolean | null
  vacant: boolean | null
  ownership_length: number | null

  lead_type: string | null

  house_value: number | null
  estimated_value: number | null
  market_value: number | null
  equity_amount: number | null
  equity_percent: number | null
  estimated_equity: number | null
  estimated_equity_percent: number | null
  mortgage_balance: number | null
  last_sale_amount: number | null
  last_sale_date: string | null
  default_amount: number | null
  auction_date: string | null
  lender_name: string | null

  lead_source: string | null
  notes_summary: string | null
  status: string | null
}

function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[%]/g, ' percent ')
    .replace(/[?]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[#]/g, ' number ')
    .replace(/[$]/g, ' dollar ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function normalizeRow(row: PropwireRow): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[normalizeKey(key)] = value
  }
  return out
}

function getValue(
  row: Record<string, unknown>,
  keys: string[]
): unknown | null {
  for (const key of keys) {
    const value = row[normalizeKey(key)]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }
  return null
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length ? text : null
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const cleaned = String(value)
    .trim()
    .replace(/[$,%]/g, '')
    .replace(/,/g, '')

  if (!cleaned) return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function asBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value

  const text = String(value).trim().toLowerCase()
  if (!text) return null

  if (
    ['1', 'true', 'yes', 'y', 'owner occupied', 'occupied', 'primary', 'homestead'].includes(
      text
    )
  ) {
    return true
  }

  if (
    ['0', 'false', 'no', 'n', 'vacant', 'non owner occupied', 'not owner occupied'].includes(
      text
    )
  ) {
    return false
  }

  return null
}

function joinName(first: string | null, last: string | null): string | null {
  const full = [first, last].filter(Boolean).join(' ').trim()
  return full.length ? full : null
}

function inferLeadType(
  defaultAmount: number | null,
  auctionDate: string | null,
  taxAmount: number | null,
  explicitStatus: string | null
): string {
  const statusText = (explicitStatus || '').toLowerCase()

  const hasForeclosure =
    defaultAmount !== null ||
    !!auctionDate ||
    statusText.includes('foreclosure') ||
    statusText.includes('default')

  const hasTax =
    taxAmount !== null ||
    statusText.includes('tax lien') ||
    statusText.includes('tax delinquent')

  if (hasForeclosure && hasTax) return 'foreclosure_tax_lien'
  if (hasForeclosure) return 'foreclosure'
  if (hasTax) return 'tax_lien'
  return 'standard'
}

export function mapPropwireRow(row: PropwireRow): WideLeadPayload {
  const normalized = normalizeRow(row)

  const sourceRecordId = asText(getValue(normalized, ['Id']))
  const address = asText(getValue(normalized, ['Address']))
  const city = asText(getValue(normalized, ['City']))
  const state = asText(getValue(normalized, ['State']))
  const zip = asText(getValue(normalized, ['Zip']))
  const county = asText(getValue(normalized, ['County']))
  const apn = asText(getValue(normalized, ['APN']))

  const ownerFirstName = asText(
    getValue(normalized, ['Owner 1 First Name', 'Owner First Name'])
  )
  const ownerLastName = asText(
    getValue(normalized, ['Owner 1 Last Name', 'Owner Last Name'])
  )
  const ownerName =
    joinName(ownerFirstName, ownerLastName) ||
    asText(getValue(normalized, ['Owner Name']))

  const ownerMailingAddress = asText(getValue(normalized, ['Owner Mailing Address']))
  const ownerMailingCity = asText(getValue(normalized, ['Owner Mailing City']))
  const ownerMailingState = asText(getValue(normalized, ['Owner Mailing State']))
  const ownerMailingZip = asText(getValue(normalized, ['Owner Mailing Zip']))

  const propertyType = asText(getValue(normalized, ['Property Type']))
  const propertyUse =
    asText(getValue(normalized, ['Property Use'])) ||
    asText(getValue(normalized, ['Land Use']))

  const bedrooms = asNumber(getValue(normalized, ['Bedrooms']))
  const bathrooms = asNumber(getValue(normalized, ['Bathrooms']))
  const squareFeet = asNumber(
    getValue(normalized, ['Living Square Feet', 'Square Feet'])
  )
  const yearBuilt = asNumber(getValue(normalized, ['Year Built']))

  const ownerOccupied = asBoolean(getValue(normalized, ['Owner Occupied']))
  const vacant = asBoolean(getValue(normalized, ['Vacant?']))
  const ownershipLengthMonths = asNumber(getValue(normalized, ['Ownership Length (Months)']))

  const status = asText(getValue(normalized, ['Status'])) || 'new_lead'

  const defaultAmount = asNumber(getValue(normalized, ['Default Amount']))
  const auctionDate = asText(getValue(normalized, ['Auction Date']))
  const taxAmount = asNumber(getValue(normalized, ['Tax Amount']))
  const lenderName = asText(getValue(normalized, ['Lender Name']))

  const marketValue = asNumber(getValue(normalized, ['Market Value']))
  const estimatedValue = asNumber(getValue(normalized, ['Estimated Value']))
  const estimatedEquity = asNumber(getValue(normalized, ['Estimated Equity']))
  const estimatedEquityPercent = asNumber(
    getValue(normalized, ['Estimated Equity Percent'])
  )
  const openMortgageBalance = asNumber(getValue(normalized, ['Open Mortgage Balance']))
  const lastSaleAmount = asNumber(getValue(normalized, ['Last Sale Amount']))
  const lastSaleDate = asText(getValue(normalized, ['Last Sale Date']))

  const leadType = inferLeadType(defaultAmount, auctionDate, taxAmount, status)

  const notesSummary = [
    leadType !== 'standard' ? `Lead type: ${leadType}` : null,
    defaultAmount !== null ? `Default amount: ${defaultAmount}` : null,
    auctionDate ? `Auction date: ${auctionDate}` : null,
    taxAmount !== null ? `Tax amount: ${taxAmount}` : null,
    estimatedEquity !== null ? `Estimated equity: ${estimatedEquity}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    source_name: 'Propwire',
    source_record_id: sourceRecordId,
    source_columns: normalized,
    raw_import_data: row,

    property_address_1: address,
    city,
    state,
    zip,
    county,
    apn,

    owner_name: ownerName,
    owner_first_name: ownerFirstName,
    owner_last_name: ownerLastName,
    owner_mailing_address: ownerMailingAddress,
    owner_mailing_city: ownerMailingCity,
    owner_mailing_state: ownerMailingState,
    owner_mailing_zip: ownerMailingZip,

    property_type: propertyType,
    property_use: propertyUse,

    bedrooms,
    bathrooms,
    square_feet: squareFeet,
    year_built: yearBuilt,

    owner_occupied: ownerOccupied,
    vacant,
    ownership_length: ownershipLengthMonths,

    lead_type: leadType,

    house_value: marketValue ?? estimatedValue,
    estimated_value: estimatedValue,
    market_value: marketValue,
    equity_amount: estimatedEquity,
    equity_percent: estimatedEquityPercent,
    estimated_equity: estimatedEquity,
    estimated_equity_percent: estimatedEquityPercent,
    mortgage_balance: openMortgageBalance,
    last_sale_amount: lastSaleAmount,
    last_sale_date: lastSaleDate,
    default_amount: defaultAmount,
    auction_date: auctionDate,
    lender_name: lenderName,

    lead_source: 'Propwire',
    notes_summary: notesSummary || null,
    status,
  }
}