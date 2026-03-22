export type StageColorConfig = {
  key: string
  label: string
  hex: string
  glow: string
  softBg: string
  border: string
}

const STAGE_COLORS: Record<string, StageColorConfig> = {
  new_lead: {
    key: 'new_lead',
    label: 'New Lead',
    hex: '#3B82F6',
    glow: 'rgba(59,130,246,0.35)',
    softBg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.45)',
  },
  contact_attempted: {
    key: 'contact_attempted',
    label: 'Contact Attempted',
    hex: '#22D3EE',
    glow: 'rgba(34,211,238,0.35)',
    softBg: 'rgba(34,211,238,0.10)',
    border: 'rgba(34,211,238,0.45)',
  },
  contacted: {
    key: 'contacted',
    label: 'Contacted',
    hex: '#8B5CF6',
    glow: 'rgba(139,92,246,0.35)',
    softBg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.45)',
  },
  follow_up: {
    key: 'follow_up',
    label: 'Follow Up',
    hex: '#6366F1',
    glow: 'rgba(99,102,241,0.35)',
    softBg: 'rgba(99,102,241,0.10)',
    border: 'rgba(99,102,241,0.45)',
  },
  negotiation: {
    key: 'negotiation',
    label: 'Negotiation',
    hex: '#F59E0B',
    glow: 'rgba(245,158,11,0.35)',
    softBg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.45)',
  },
  offer_sent: {
    key: 'offer_sent',
    label: 'Offer Sent',
    hex: '#F97316',
    glow: 'rgba(249,115,22,0.35)',
    softBg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.45)',
  },
  under_contract: {
    key: 'under_contract',
    label: 'Under Contract',
    hex: '#22C55E',
    glow: 'rgba(34,197,94,0.35)',
    softBg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.45)',
  },
  buyer_found: {
    key: 'buyer_found',
    label: 'Buyer Found',
    hex: '#10B981',
    glow: 'rgba(16,185,129,0.35)',
    softBg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.45)',
  },
  closing: {
    key: 'closing',
    label: 'Closing',
    hex: '#14B8A6',
    glow: 'rgba(20,184,166,0.35)',
    softBg: 'rgba(20,184,166,0.10)',
    border: 'rgba(20,184,166,0.45)',
  },
  closed: {
    key: 'closed',
    label: 'Closed',
    hex: '#84CC16',
    glow: 'rgba(132,204,22,0.35)',
    softBg: 'rgba(132,204,22,0.10)',
    border: 'rgba(132,204,22,0.45)',
  },
  dead: {
    key: 'dead',
    label: 'Dead',
    hex: '#6B7280',
    glow: 'rgba(107,114,128,0.28)',
    softBg: 'rgba(107,114,128,0.10)',
    border: 'rgba(107,114,128,0.36)',
  },
}

const FALLBACK_STAGE: StageColorConfig = {
  key: 'unknown',
  label: 'Unknown',
  hex: '#9CA3AF',
  glow: 'rgba(156,163,175,0.25)',
  softBg: 'rgba(156,163,175,0.10)',
  border: 'rgba(156,163,175,0.30)',
}

export function getStageColor(stage?: string | null): StageColorConfig {
  if (!stage) return FALLBACK_STAGE
  return STAGE_COLORS[stage] ?? FALLBACK_STAGE
}

export function getStageLabel(stage?: string | null): string {
  return getStageColor(stage).label
}

export function getStageHex(stage?: string | null): string {
  return getStageColor(stage).hex
}