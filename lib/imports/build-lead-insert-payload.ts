import type { ParsedImportLeadRow } from '@/lib/imports/types'

type BuildLeadInsertPayloadArgs = {
  row: ParsedImportLeadRow
  sourceLabel?: string
}

type LeadInsertPayload = {
  property_address_1: string | null
  city: string | null
  state: string | null
  zip: string | null

  owner_name: string | null
  owner_phone_primary: string | null
  owner_email: string | null

  asking_price: number | null
  arv: number | null
  mao: number | null
  projected_spread: number | null

  lead_source: string | null
  notes_summary: string | null

  equity_estimate: number | null
  occupancy_status: string | null
  property_condition: string | null
  motivation_level: string | null
  timeline_to_sell: string | null

  status: string
}

function cleanString(value: string | null | undefined) {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function cleanNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const normalized = String(value).replace(/[$,%\s,]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function inferNotesSummary(row: ParsedImportLeadRow) {
  const parts: string[] = []

  if (cleanString(row.property_condition)) {
    parts.push(`Condition: ${cleanString(row.property_condition)}`)
  }

  if (cleanString(row.motivation_level)) {
    parts.push(`Motivation: ${cleanString(row.motivation_level)}`)
  }

  if (cleanString(row.timeline_to_sell)) {
    parts.push(`Timeline: ${cleanString(row.timeline_to_sell)}`)
  }

  if (cleanString(row.notes_summary)) {
    parts.push(cleanString(row.notes_summary) as string)
  }

  return parts.length ? parts.join(' · ') : null
}

function inferStatus(row: ParsedImportLeadRow) {
  if (cleanString(row.timeline_to_sell)) return 'researching'
  if (cleanString(row.motivation_level)) return 'researching'
  if (cleanNumber(row.projected_spread) !== null) return 'qualified'
  return 'new_lead'
}

export function buildLeadInsertPayload({
  row,
  sourceLabel,
}: BuildLeadInsertPayloadArgs): LeadInsertPayload {
  return {
    property_address_1: cleanString(row.property_address_1),
    city: cleanString(row.city),
    state: cleanString(row.state),
    zip: cleanString(row.zip),

    owner_name: cleanString(row.owner_name),
    owner_phone_primary: cleanString(row.owner_phone_primary),
    owner_email: cleanString(row.owner_email),

    asking_price: cleanNumber(row.asking_price),
    arv: cleanNumber(row.arv),
    mao: cleanNumber(row.mao),
    projected_spread: cleanNumber(row.projected_spread),

    lead_source: cleanString(sourceLabel) || cleanString(row.lead_source) || 'csv_import',
    notes_summary: inferNotesSummary(row),

    equity_estimate: cleanNumber(row.equity_estimate),
    occupancy_status: cleanString(row.occupancy_status),
    property_condition: cleanString(row.property_condition),
    motivation_level: cleanString(row.motivation_level),
    timeline_to_sell: cleanString(row.timeline_to_sell),

    status: inferStatus(row),
  }
}