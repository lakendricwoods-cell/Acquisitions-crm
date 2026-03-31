export const CRM_STAGES = [
  'lead_inbox',
  'new_lead',
  'skip_trace',
  'contact_attempted',
  'contacted',
  'follow_up',
  'appointment_set',
  'offer_sent',
  'negotiation',
  'verbal_yes',
  'under_contract',
  'title_opened',
  'buyer_marketing',
  'assigned',
  'double_close',
  'closed',
  'dead',
] as const

export type CrmStage = (typeof CRM_STAGES)[number]

export const CRM_STAGE_META: Record<
  CrmStage,
  { label: string; color: string; bg: string }
> = {
  lead_inbox: { label: 'Lead Inbox', color: '#67e8f9', bg: 'rgba(103,232,249,0.08)' },
  new_lead: { label: 'New Lead', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' },
  skip_trace: { label: 'Skip Trace', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
  contact_attempted: { label: 'Contact Attempted', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  contacted: { label: 'Contacted', color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)' },
  follow_up: { label: 'Follow Up', color: '#818cf8', bg: 'rgba(129,140,248,0.08)' },
  appointment_set: { label: 'Appointment Set', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
  offer_sent: { label: 'Offer Sent', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  negotiation: { label: 'Negotiation', color: '#c084fc', bg: 'rgba(192,132,252,0.08)' },
  verbal_yes: { label: 'Verbal Yes', color: '#a3e635', bg: 'rgba(163,230,53,0.08)' },
  under_contract: { label: 'Under Contract', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  title_opened: { label: 'Title Opened', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  buyer_marketing: { label: 'Buyer Marketing', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  assigned: { label: 'Assigned', color: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
  double_close: { label: 'Double Close', color: '#fb7185', bg: 'rgba(251,113,133,0.08)' },
  closed: { label: 'Closed', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  dead: { label: 'Dead', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
}

export function normalizeCrmStage(value: unknown): CrmStage {
  const raw = String(value ?? '').trim().toLowerCase()

  if (!raw) return 'lead_inbox'

  if (['lead_inbox', 'lead inbox', 'inbox', 'imported'].includes(raw)) return 'lead_inbox'
  if (['new_lead', 'new lead', 'new', 'open', 'active', 'lead'].includes(raw)) return 'new_lead'
  if (['skip_trace', 'skip trace'].includes(raw)) return 'skip_trace'
  if (['contact_attempted', 'contact attempted', 'attempted'].includes(raw)) return 'contact_attempted'
  if (['contacted', 'contact'].includes(raw)) return 'contacted'
  if (['follow_up', 'follow up', 'followup', 'callback'].includes(raw)) return 'follow_up'
  if (['appointment_set', 'appointment set'].includes(raw)) return 'appointment_set'
  if (['offer_sent', 'offer sent', 'offer'].includes(raw)) return 'offer_sent'
  if (['negotiation', 'negotiating'].includes(raw)) return 'negotiation'
  if (['verbal_yes', 'verbal yes'].includes(raw)) return 'verbal_yes'
  if (['under_contract', 'under contract', 'contract', 'contracted'].includes(raw)) return 'under_contract'
  if (['title_opened', 'title opened', 'title'].includes(raw)) return 'title_opened'
  if (['buyer_marketing', 'buyer marketing'].includes(raw)) return 'buyer_marketing'
  if (['assigned'].includes(raw)) return 'assigned'
  if (['double_close', 'double close'].includes(raw)) return 'double_close'
  if (['closed', 'sold', 'done'].includes(raw)) return 'closed'
  if (['dead', 'lost'].includes(raw)) return 'dead'

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