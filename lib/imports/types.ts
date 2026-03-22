export type ParsedImportLeadRow = {
  property_address_1: string | null
  city: string | null
  state: string | null
  zip: string | null

  owner_name: string | null
  owner_phone_primary: string | null
  owner_email: string | null

  lead_source: string | null
  notes_summary: string | null

  asking_price: number | null
  arv: number | null
  mao: number | null
  projected_spread: number | null

  equity_estimate: number | null
  occupancy_status: string | null
  property_condition: string | null
  motivation_level: string | null
  timeline_to_sell: string | null

  beds: number | null
  baths: number | null
  sqft: number | null
  year_built: number | null
}