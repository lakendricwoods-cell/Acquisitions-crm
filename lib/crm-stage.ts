export const CRM_STAGES = [
  'new_lead',
  'contact_attempted',
  'contacted',
  'follow_up',
  'appointment',
  'offers',
  'negotiation',
  'verbals',
  'under_contract',
  'title_opened',
  'buyers_market',
  'assigned',
  'closed',
  'dead',
] as const

export type CrmStage = (typeof CRM_STAGES)[number]

export const CRM_STAGE_META: Record<
  CrmStage,
  { label: string; color: string; bg: string }
> = {
  new_lead: { label: 'New Lead', color: '#e0b84f', bg: 'rgba(224,184,79,0.10)' },
  contact_attempted: { label: 'Contact Attempted', color: '#d97706', bg: 'rgba(217,119,6,0.10)' },
  contacted: { label: 'Contacted', color: '#14b8a6', bg: 'rgba(20,184,166,0.10)' },
  follow_up: { label: 'Follow Up', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
  appointment: { label: 'Appointment', color: '#06b6d4', bg: 'rgba(6,182,212,0.10)' },
  offers: { label: 'Offers', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  negotiation: { label: 'Negotiation', color: '#c084fc', bg: 'rgba(192,132,252,0.10)' },
  verbals: { label: 'Verbals', color: '#84cc16', bg: 'rgba(132,204,22,0.10)' },
  under_contract: { label: 'Under Contract', color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  title_opened: { label: 'Title Opened', color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' },
  buyers_market: { label: 'Buyers Market', color: '#a855f7', bg: 'rgba(168,85,247,0.10)' },
  assigned: { label: 'Assigned', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  closed: { label: 'Closed', color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
  dead: { label: 'Dead', color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
}

export function normalizeCrmStage(value: unknown): CrmStage {
  const raw = String(value ?? '').trim().toLowerCase()

  if (!raw) return 'new_lead'

  if (['new_lead', 'new lead', 'new', 'lead', 'open', 'active', 'fresh', 'inbox', 'lead_inbox', 'lead inbox', 'imported'].includes(raw)) {
    return 'new_lead'
  }

  if (['contact_attempted', 'contact attempted', 'attempted', 'trying to contact'].includes(raw)) {
    return 'contact_attempted'
  }

  if (['contacted', 'contact', 'owner contacted'].includes(raw)) {
    return 'contacted'
  }

  if (['follow_up', 'follow up', 'followup', 'callback', 'nurture'].includes(raw)) {
    return 'follow_up'
  }

  if (['appointment', 'appointment_set', 'appointment set', 'meeting set'].includes(raw)) {
    return 'appointment'
  }

  if (['offers', 'offer', 'offer_sent', 'offer sent', 'sent offer'].includes(raw)) {
    return 'offers'
  }

  if (['negotiation', 'negotiating', 'countered', 'counter offer'].includes(raw)) {
    return 'negotiation'
  }

  if (['verbals', 'verbal', 'verbal_yes', 'verbal yes', 'agreed verbally'].includes(raw)) {
    return 'verbals'
  }

  if (['under_contract', 'under contract', 'contract', 'contracted'].includes(raw)) {
    return 'under_contract'
  }

  if (['title_opened', 'title opened', 'title'].includes(raw)) {
    return 'title_opened'
  }

  if (['buyers_market', 'buyers market', 'buyer_marketing', 'buyer marketing', 'blast to buyers'].includes(raw)) {
    return 'buyers_market'
  }

  if (['assigned', 'assignment signed'].includes(raw)) {
    return 'assigned'
  }

  if (['closed', 'sold', 'done'].includes(raw)) {
    return 'closed'
  }

  if (['dead', 'dead lead', 'lost'].includes(raw)) {
    return 'dead'
  }

  return 'new_lead'
}

export function resolveCrmStage(row: Record<string, any>): CrmStage {
  return normalizeCrmStage(
    row.deal_status ??
      row.status ??
      row.lead_status ??
      row.pipeline_stage ??
      row.stage
  )
}

export function getNextCrmStage(stage: CrmStage): CrmStage | null {
  const index = CRM_STAGES.indexOf(stage)
  if (index === -1 || index === CRM_STAGES.length - 1) return null
  return CRM_STAGES[index + 1]
}