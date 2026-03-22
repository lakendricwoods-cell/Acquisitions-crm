export type ImportSeed = {
  property_address_1?: string | null
  property_address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  owner_name?: string | null
  owner_phone_primary?: string | null
  owner_email?: string | null
  notes_summary?: string | null
  lead_source?: string | null
}

export function normalizeImportedLead(
  seed: ImportSeed,
  sourceLabel?: string | null,
) {
  const address =
    firstNonEmpty(seed.property_address_1, seed.property_address) || null

  return {
    property_address_1: address,
    city: seed.city || null,
    state: seed.state || null,
    zip: seed.zip || null,
    owner_name: seed.owner_name || null,
    owner_phone_primary: seed.owner_phone_primary || null,
    owner_email: seed.owner_email || null,
    lead_source: sourceLabel || seed.lead_source || 'import',
    notes_summary: seed.notes_summary || null,
    status: 'new_lead',
    next_action: 'Review imported lead and enrich details',
    contact_attempts: 0,
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}