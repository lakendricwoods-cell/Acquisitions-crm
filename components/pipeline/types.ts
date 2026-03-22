export type PipelineLead = {
  id: string
  property_address_1: string | null
  city: string | null
  state: string | null
  owner_name: string | null
  owner_phone_primary: string | null
  asking_price: number | null
  arv: number | null
  mao: number | null
  projected_spread: number | null
  heat_score: number | null
  completeness_score: number | null
  next_action: string | null
  lead_source: string | null
  status: string | null
  notes_summary: string | null
  created_at: string
  updated_at?: string | null
}

export type StageColor = {
  hex: string
  border: string
  softBg: string
  glow: string
}