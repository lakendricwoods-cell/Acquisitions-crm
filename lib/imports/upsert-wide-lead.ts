import type { SupabaseClient } from '@supabase/supabase-js'
import type { WideLeadPayload } from '@/lib/imports/propwire-map'

type AnyClient = SupabaseClient<any, any, any>

type ExistingLeadMatch = {
  id: string
  assigned_user_id?: string | null
  property_address_1?: string | null
  zip?: string | null
  apn?: string | null
  source_name?: string | null
  source_record_id?: string | null
  source_columns?: Record<string, unknown> | null
  raw_import_data?: Record<string, unknown> | null
}

export type UpsertWideLeadResult =
  | { action: 'created'; leadId: string }
  | { action: 'updated'; leadId: string }
  | { action: 'skipped'; reason: string; leadId?: string | null }

function hasText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  if (typeof value === 'object') return true
  return false
}

function keepOnlyPresentFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Partial<T> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (hasValue(value)) {
      out[key as keyof T] = value
    }
  }

  return out
}

function mergeJson(
  existing: Record<string, unknown> | null | undefined,
  incoming: Record<string, unknown> | null | undefined
) {
  return {
    ...(existing || {}),
    ...(incoming || {}),
  }
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length ? text : null
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function rawValue(mapped: WideLeadPayload, aliases: string[]): unknown | null {
  const sourceColumns = mapped.source_columns || {}
  const rawImportData = mapped.raw_import_data || {}

  for (const alias of aliases) {
    if (alias in sourceColumns && hasValue(sourceColumns[alias])) {
      return sourceColumns[alias]
    }
  }

  for (const alias of aliases) {
    if (alias in rawImportData && hasValue(rawImportData[alias])) {
      return rawImportData[alias]
    }
  }

  return null
}

function fillFallbacks(mapped: WideLeadPayload) {
  return {
    property_address_1:
      mapped.property_address_1 ??
      asText(rawValue(mapped, ['address', 'property_address', 'property_address_1', 'site_address'])),

    city:
      mapped.city ??
      asText(rawValue(mapped, ['city', 'property_city', 'site_city'])),

    state:
      mapped.state ??
      asText(rawValue(mapped, ['state', 'property_state', 'site_state'])),

    zip:
      mapped.zip ??
      asText(rawValue(mapped, ['zip', 'zipcode', 'postal_code'])),

    county:
      mapped.county ??
      asText(rawValue(mapped, ['county'])),

    apn:
      mapped.apn ??
      asText(rawValue(mapped, ['apn', 'parcel_number', 'parcel_id'])),

    owner_name:
      mapped.owner_name ??
      asText(rawValue(mapped, ['owner_name', 'owner', 'mailing_name', 'owner_1_full_name'])),

    owner_mailing_address:
      mapped.owner_mailing_address ??
      asText(rawValue(mapped, ['owner_mailing_address', 'mailing_address', 'owner_address'])),

    owner_mailing_city:
      mapped.owner_mailing_city ??
      asText(rawValue(mapped, ['owner_mailing_city', 'mailing_city'])),

    owner_mailing_state:
      mapped.owner_mailing_state ??
      asText(rawValue(mapped, ['owner_mailing_state', 'mailing_state'])),

    owner_mailing_zip:
      mapped.owner_mailing_zip ??
      asText(rawValue(mapped, ['owner_mailing_zip', 'mailing_zip'])),

    property_type:
      mapped.property_type ??
      asText(rawValue(mapped, ['property_type'])),

    property_use:
      mapped.property_use ??
      asText(rawValue(mapped, ['property_use', 'land_use'])),

    bedrooms:
      mapped.bedrooms ??
      asNumber(rawValue(mapped, ['bedrooms', 'beds'])),

    bathrooms:
      mapped.bathrooms ??
      asNumber(rawValue(mapped, ['bathrooms', 'baths'])),

    square_feet:
      mapped.square_feet ??
      asNumber(rawValue(mapped, ['square_feet', 'sqft', 'living_square_feet', 'building_sqft'])),

    year_built:
      mapped.year_built ??
      asNumber(rawValue(mapped, ['year_built'])),

    house_value:
      mapped.house_value ??
      asNumber(rawValue(mapped, ['house_value', 'estimated_value', 'market_value'])),

    estimated_value:
      mapped.estimated_value ??
      asNumber(rawValue(mapped, ['estimated_value'])),

    market_value:
      mapped.market_value ??
      asNumber(rawValue(mapped, ['market_value'])),

    equity_amount:
      mapped.equity_amount ??
      asNumber(rawValue(mapped, ['equity_amount', 'equity', 'estimated_equity'])),

    equity_percent:
      mapped.equity_percent ??
      asNumber(rawValue(mapped, ['equity_percent', 'equity_percent_percent', 'estimated_equity_percent'])),

    estimated_equity:
      mapped.estimated_equity ??
      asNumber(rawValue(mapped, ['estimated_equity'])),

    estimated_equity_percent:
      mapped.estimated_equity_percent ??
      asNumber(rawValue(mapped, ['estimated_equity_percent'])),

    mortgage_balance:
      mapped.mortgage_balance ??
      asNumber(rawValue(mapped, ['mortgage_balance', 'mortgage', 'open_mortgage_balance'])),

    last_sale_amount:
      mapped.last_sale_amount ??
      asNumber(rawValue(mapped, ['last_sale_amount', 'sale_amount', 'last_money_in'])),

    last_sale_date:
      mapped.last_sale_date ??
      asText(rawValue(mapped, ['last_sale_date', 'sale_date'])),

    default_amount:
      mapped.default_amount ??
      asNumber(rawValue(mapped, ['default_amount', 'judgment_amount', 'auction_amount'])),

    auction_date:
      mapped.auction_date ??
      asText(rawValue(mapped, ['auction_date', 'foreclosure_date'])),

    lender_name:
      mapped.lender_name ??
      asText(rawValue(mapped, ['lender_name', 'lender'])),
  }
}

function normalizeLeadStatus(value: string | null | undefined): string {
  const text = (value || '').trim().toLowerCase()

  if (!text) return 'new_lead'

  if (['active', 'new', 'new lead', 'lead'].includes(text)) return 'new_lead'
  if (['inbox', 'lead_inbox', 'lead inbox'].includes(text)) return 'lead_inbox'
  if (['contact_attempted', 'contact attempted'].includes(text)) return 'contact_attempted'
  if (['contacted', 'contact'].includes(text)) return 'contacted'
  if (['follow_up', 'follow up'].includes(text)) return 'follow_up'
  if (['offer_sent', 'offer sent'].includes(text)) return 'offer_sent'
  if (['negotiation', 'negotiating'].includes(text)) return 'negotiation'
  if (['under_contract', 'under contract', 'contract'].includes(text)) return 'under_contract'
  if (['closed', 'sold'].includes(text)) return 'closed'

  return 'new_lead'
}

function normalizeOccupancyStatus(mapped: Partial<WideLeadPayload>): string | null {
  if (mapped?.vacant === true) return 'vacant'
  if (mapped?.owner_occupied === true) return 'occupied'
  if (mapped?.owner_occupied === false) return 'vacant'
  return null
}

function inferPropertyCondition(mapped: Partial<WideLeadPayload>) {
  if (mapped?.lead_type === 'foreclosure' || mapped?.lead_type === 'foreclosure_tax_lien') {
    return 'distressed'
  }
  if (mapped?.vacant === true) return 'distressed'
  return null
}

function inferMotivationLevel(mapped: Partial<WideLeadPayload>) {
  if (mapped?.lead_type === 'foreclosure_tax_lien') return 'high'
  if (mapped?.lead_type === 'foreclosure') return 'high'
  if (mapped?.lead_type === 'tax_lien') return 'moderate'
  if (mapped?.default_amount != null) return 'moderate'
  if ((mapped?.equity_percent ?? 0) >= 50) return 'moderate'
  return 'unknown'
}

function inferTimelineToSell(mapped: Partial<WideLeadPayload>) {
  if (mapped?.auction_date) return 'urgent'
  if (mapped?.default_amount != null) return 'soon'
  return null
}

function buildNotesSummary(
  mapped: Partial<WideLeadPayload>,
  filled: ReturnType<typeof fillFallbacks>
) {
  const parts: string[] = []

  if (mapped.lead_type) parts.push(`Lead type: ${mapped.lead_type}`)
  if (filled.house_value != null) parts.push(`House value: ${filled.house_value}`)
  if (filled.equity_amount != null) parts.push(`Equity: ${filled.equity_amount}`)
  if (filled.mortgage_balance != null) parts.push(`Mortgage: ${filled.mortgage_balance}`)
  if (filled.last_sale_amount != null) parts.push(`Last money in: ${filled.last_sale_amount}`)
  if (filled.default_amount != null) parts.push(`Default amount: ${filled.default_amount}`)
  if (filled.auction_date) parts.push(`Auction date: ${filled.auction_date}`)
  if (mapped.notes_summary) parts.push(mapped.notes_summary)

  return parts.length ? parts.join(' · ') : null
}

async function pickFirstMatch(
  supabase: AnyClient,
  queryBuilder: any
): Promise<ExistingLeadMatch | null> {
  const { data, error } = await queryBuilder.limit(1)

  if (error) throw error
  if (!data || !Array.isArray(data) || data.length === 0) return null

  return data[0] as ExistingLeadMatch
}

async function findExistingLead(
  supabase: AnyClient,
  mapped: Partial<WideLeadPayload>,
  filled: ReturnType<typeof fillFallbacks>
): Promise<ExistingLeadMatch | null> {
  const selectFields =
    'id, assigned_user_id, property_address_1, zip, apn, source_name, source_record_id, source_columns, raw_import_data'

  if (hasText(mapped.source_record_id)) {
    const found = await pickFirstMatch(
      supabase,
      supabase
        .from('leads')
        .select(selectFields)
        .eq('source_name', mapped.source_name)
        .eq('source_record_id', mapped.source_record_id)
        .order('updated_at', { ascending: false, nullsFirst: false })
    )
    if (found) return found
  }

  if (hasText(filled.apn)) {
    const found = await pickFirstMatch(
      supabase,
      supabase
        .from('leads')
        .select(selectFields)
        .eq('apn', filled.apn)
        .order('updated_at', { ascending: false, nullsFirst: false })
    )
    if (found) return found
  }

  if (hasText(filled.property_address_1) && hasText(filled.zip)) {
    const found = await pickFirstMatch(
      supabase,
      supabase
        .from('leads')
        .select(selectFields)
        .eq('property_address_1', filled.property_address_1)
        .eq('zip', filled.zip)
        .order('updated_at', { ascending: false, nullsFirst: false })
    )
    if (found) return found
  }

  if (hasText(filled.property_address_1)) {
    const found = await pickFirstMatch(
      supabase,
      supabase
        .from('leads')
        .select(selectFields)
        .eq('property_address_1', filled.property_address_1)
        .order('updated_at', { ascending: false, nullsFirst: false })
    )
    if (found) return found
  }

  return null
}

export async function upsertWideLead(
  supabase: AnyClient,
  mapped: WideLeadPayload,
  userId: string
): Promise<UpsertWideLeadResult> {
  const filled = fillFallbacks(mapped)

  const hasIdentity =
    hasText(mapped.source_record_id) ||
    hasText(filled.apn) ||
    hasText(filled.property_address_1)

  if (!hasIdentity) {
    return {
      action: 'skipped',
      reason: 'Row has no usable source id, APN, or address.',
    }
  }

  const existing = await findExistingLead(supabase, mapped, filled)

  const promotedPayload = keepOnlyPresentFields({
    source_name: mapped.source_name,
    source_record_id: mapped.source_record_id,

    property_address_1: filled.property_address_1,
    city: filled.city,
    state: filled.state,
    zip: filled.zip,
    county: filled.county,
    apn: filled.apn,

    owner_name: filled.owner_name,
    owner_first_name: mapped.owner_first_name,
    owner_last_name: mapped.owner_last_name,
    owner_mailing_address: filled.owner_mailing_address,
    owner_mailing_city: filled.owner_mailing_city,
    owner_mailing_state: filled.owner_mailing_state,
    owner_mailing_zip: filled.owner_mailing_zip,

    property_type: filled.property_type,
    property_use: filled.property_use,
    bedrooms: filled.bedrooms,
    bathrooms: filled.bathrooms,
    square_feet: filled.square_feet,
    year_built: filled.year_built,

    owner_occupied: mapped.owner_occupied ?? null,
    vacant: mapped.vacant ?? null,
    ownership_length: mapped.ownership_length ?? null,

    lead_type: mapped.lead_type,
    house_value: filled.house_value,
    estimated_value: filled.estimated_value,
    market_value: filled.market_value,
    equity_amount: filled.equity_amount,
    equity_percent: filled.equity_percent,
    estimated_equity: filled.estimated_equity,
    estimated_equity_percent: filled.estimated_equity_percent,
    mortgage_balance: filled.mortgage_balance,
    last_sale_amount: filled.last_sale_amount,
    last_sale_date: filled.last_sale_date,
    default_amount: filled.default_amount,
    auction_date: filled.auction_date,
    lender_name: filled.lender_name,

    lead_source: mapped.lead_source,
    notes_summary: buildNotesSummary(mapped, filled),
    equity_estimate: filled.equity_amount ?? filled.estimated_equity ?? null,
    occupancy_status: normalizeOccupancyStatus(mapped),
    property_condition: inferPropertyCondition(mapped),
    motivation_level: inferMotivationLevel(mapped),
    timeline_to_sell: inferTimelineToSell(mapped),
    status: normalizeLeadStatus(mapped.status),

    source_columns: mapped.source_columns,
    raw_import_data: mapped.raw_import_data,

    updated_at: new Date().toISOString(),
  })

  if (existing) {
    const { error } = await supabase
      .from('leads')
      .update({
        ...promotedPayload,
        source_columns: mergeJson(existing.source_columns, mapped.source_columns),
        raw_import_data: mergeJson(existing.raw_import_data, mapped.raw_import_data),
        assigned_user_id: existing.assigned_user_id || userId,
      })
      .eq('id', existing.id)

    if (error) throw error

    return {
      action: 'updated',
      leadId: existing.id,
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...promotedPayload,
      created_by_user_id: userId,
      assigned_user_id: userId,
      contact_attempts: 0,
      next_action:
        filled.owner_name && filled.house_value !== null
          ? 'Review imported property signals and begin qualification'
          : filled.owner_name
            ? 'Run value and equity review'
            : 'Enrich owner and contact data',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error

  return {
    action: 'created',
    leadId: data.id as string,
  }
}