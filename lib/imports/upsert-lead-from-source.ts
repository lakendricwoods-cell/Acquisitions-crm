import type { SupabaseClient } from '@supabase/supabase-js'
import type { WideLeadPayload } from './propwire-map'

type AnyClient = SupabaseClient<any, any, any>

type ExistingLeadRow = {
  id: string
  lead_intelligence?: Record<string, unknown> | null
  raw_import_data?: Record<string, unknown> | null
  source_columns?: Record<string, unknown> | null
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

function keepDefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Partial<T> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (hasValue(value)) {
      out[key as keyof T] = value
    }
  }

  return out
}

function mergeObjects(
  a?: Record<string, unknown> | null,
  b?: Record<string, unknown> | null
) {
  return {
    ...(a || {}),
    ...(b || {}),
  }
}

function normalizeStatus(status: string | null | undefined) {
  const value = (status || '').trim().toLowerCase()

  if (!value) return 'new_lead'
  if (['new', 'new lead', 'lead', 'active'].includes(value)) return 'new_lead'
  if (['lead inbox', 'lead_inbox', 'inbox'].includes(value)) return 'lead_inbox'
  if (['contact attempted', 'contact_attempted'].includes(value)) return 'contact_attempted'
  if (['contacted', 'contact'].includes(value)) return 'contacted'
  if (['follow up', 'follow_up'].includes(value)) return 'follow_up'
  if (['offer sent', 'offer_sent'].includes(value)) return 'offer_sent'
  if (['negotiation', 'negotiating'].includes(value)) return 'negotiation'
  if (['under contract', 'under_contract', 'contract'].includes(value)) return 'under_contract'
  if (['closed', 'sold'].includes(value)) return 'closed'

  return 'new_lead'
}

function computeLeadIntelligence(mapped: WideLeadPayload) {
  const existing = ((mapped as any)?.lead_intelligence || {}) as Record<string, unknown>

  return {
    ...existing,
    lead_type: mapped.lead_type ?? existing.lead_type ?? null,
    house_value:
      mapped.house_value ??
      mapped.estimated_value ??
      mapped.market_value ??
      existing.house_value ??
      null,
    estimated_value: mapped.estimated_value ?? existing.estimated_value ?? null,
    market_value: mapped.market_value ?? existing.market_value ?? null,
    equity_amount:
      mapped.equity_amount ??
      mapped.estimated_equity ??
      existing.equity_amount ??
      null,
    equity_percent:
      mapped.equity_percent ??
      mapped.estimated_equity_percent ??
      existing.equity_percent ??
      null,
    mortgage_balance: mapped.mortgage_balance ?? existing.mortgage_balance ?? null,
    default_amount: mapped.default_amount ?? existing.default_amount ?? null,
    auction_date: mapped.auction_date ?? existing.auction_date ?? null,
    lender_name: mapped.lender_name ?? existing.lender_name ?? null,
    owner_occupied: mapped.owner_occupied ?? existing.owner_occupied ?? null,
    vacant: mapped.vacant ?? existing.vacant ?? null,
    ownership_length: mapped.ownership_length ?? existing.ownership_length ?? null,
    last_sale_amount: mapped.last_sale_amount ?? existing.last_sale_amount ?? null,
    last_sale_date: mapped.last_sale_date ?? existing.last_sale_date ?? null,
    bedrooms: mapped.bedrooms ?? existing.bedrooms ?? null,
    bathrooms: mapped.bathrooms ?? existing.bathrooms ?? null,
    square_feet: mapped.square_feet ?? existing.square_feet ?? null,
    year_built: mapped.year_built ?? existing.year_built ?? null,
    property_type: mapped.property_type ?? existing.property_type ?? null,
    property_use: mapped.property_use ?? existing.property_use ?? null,
    notes_summary: mapped.notes_summary ?? existing.notes_summary ?? null,
  }
}

async function findExistingLead(
  supabase: AnyClient,
  mapped: WideLeadPayload
): Promise<ExistingLeadRow | null> {
  const selectFields = 'id, lead_intelligence, raw_import_data, source_columns'

  if (mapped.source_name && mapped.source_record_id) {
    const { data, error } = await supabase
      .from('leads')
      .select(selectFields)
      .eq('source_name', mapped.source_name)
      .eq('source_record_id', mapped.source_record_id)
      .limit(1)

    if (error) throw error
    if (data?.[0]) return data[0] as ExistingLeadRow
  }

  if (mapped.apn) {
    const { data, error } = await supabase
      .from('leads')
      .select(selectFields)
      .eq('apn', mapped.apn)
      .limit(1)

    if (error) throw error
    if (data?.[0]) return data[0] as ExistingLeadRow
  }

  if (mapped.property_address_1 && mapped.zip) {
    const { data, error } = await supabase
      .from('leads')
      .select(selectFields)
      .eq('property_address_1', mapped.property_address_1)
      .eq('zip', mapped.zip)
      .limit(1)

    if (error) throw error
    if (data?.[0]) return data[0] as ExistingLeadRow
  }

  if (mapped.property_address_1) {
    const { data, error } = await supabase
      .from('leads')
      .select(selectFields)
      .eq('property_address_1', mapped.property_address_1)
      .limit(1)

    if (error) throw error
    if (data?.[0]) return data[0] as ExistingLeadRow
  }

  return null
}

export async function upsertLeadFromSource(
  supabase: AnyClient,
  mapped: WideLeadPayload,
  userId: string
) {
  const leadIntelligence = computeLeadIntelligence(mapped)

  const basePayload = keepDefined({
    source_name: mapped.source_name,
    source_record_id: mapped.source_record_id,

    property_address_1: mapped.property_address_1,
    city: mapped.city,
    state: mapped.state,
    zip: mapped.zip,
    county: mapped.county,
    apn: mapped.apn,

    owner_name: mapped.owner_name,
    owner_first_name: mapped.owner_first_name,
    owner_last_name: mapped.owner_last_name,
    owner_mailing_address: mapped.owner_mailing_address,
    owner_mailing_city: mapped.owner_mailing_city,
    owner_mailing_state: mapped.owner_mailing_state,
    owner_mailing_zip: mapped.owner_mailing_zip,

    property_type: mapped.property_type,
    property_use: mapped.property_use,
    bedrooms: mapped.bedrooms,
    bathrooms: mapped.bathrooms,
    square_feet: mapped.square_feet,
    year_built: mapped.year_built,

    house_value: mapped.house_value,
    estimated_value: mapped.estimated_value,
    market_value: mapped.market_value,
    equity_amount: mapped.equity_amount,
    equity_percent: mapped.equity_percent,
    estimated_equity: mapped.estimated_equity,
    estimated_equity_percent: mapped.estimated_equity_percent,
    mortgage_balance: mapped.mortgage_balance,
    last_sale_amount: mapped.last_sale_amount,
    last_sale_date: mapped.last_sale_date,
    default_amount: mapped.default_amount,
    auction_date: mapped.auction_date,
    lender_name: mapped.lender_name,
    owner_occupied: mapped.owner_occupied,
    vacant: mapped.vacant,
    ownership_length: mapped.ownership_length,

    lead_type: mapped.lead_type,
    lead_source: mapped.lead_source || mapped.source_name || 'csv_import',
    status: normalizeStatus(mapped.status),

    notes_summary: mapped.notes_summary,
    source_columns: mapped.source_columns,
    raw_import_data: mapped.raw_import_data,
    lead_intelligence: leadIntelligence,
    updated_at: new Date().toISOString(),
  })

  const existingLead = await findExistingLead(supabase, mapped)

  if (existingLead) {
    const mergedLeadIntelligence = {
      ...(((existingLead as any)?.lead_intelligence || {}) as Record<string, unknown>),
      ...leadIntelligence,
    }

    const mergedRawImportData = mergeObjects(
      existingLead.raw_import_data,
      mapped.raw_import_data || null
    )

    const mergedSourceColumns = mergeObjects(
      existingLead.source_columns,
      mapped.source_columns || null
    )

    const { error } = await supabase
      .from('leads')
      .update({
        ...basePayload,
        lead_intelligence: mergedLeadIntelligence,
        raw_import_data: mergedRawImportData,
        source_columns: mergedSourceColumns,
      })
      .eq('id', existingLead.id)

    if (error) throw error

    return {
      action: 'updated' as const,
      leadId: existingLead.id,
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...basePayload,
      created_by_user_id: userId,
      assigned_user_id: userId,
      created_at: new Date().toISOString(),
      contact_attempts: 0,
      next_action: 'Review imported lead and qualify',
    })
    .select('id')
    .single()

  if (error) throw error

  return {
    action: 'created' as const,
    leadId: data.id as string,
  }
}