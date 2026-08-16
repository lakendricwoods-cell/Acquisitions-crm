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
  {
    label: string
    color: string
    bg: string
  }
> = {
  new_lead: {
    label: 'New Lead',
    color: '#e0b84f',
    bg: 'rgba(224,184,79,0.10)',
  },
  contact_attempted: {
    label: 'Contact Attempted',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.10)',
  },
  contacted: {
    label: 'Contacted',
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.10)',
  },
  follow_up: {
    label: 'Follow Up',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.10)',
  },
  appointment: {
    label: 'Appointment',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.10)',
  },
  offers: {
    label: 'Offers',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
  },
  negotiation: {
    label: 'Negotiation',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.10)',
  },
  verbals: {
    label: 'Verbals',
    color: '#84cc16',
    bg: 'rgba(132,204,22,0.10)',
  },
  under_contract: {
    label: 'Under Contract',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.10)',
  },
  title_opened: {
    label: 'Title Opened',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.10)',
  },
  buyers_market: {
    label: 'Buyers Market',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.10)',
  },
  assigned: {
    label: 'Assigned',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
  },
  closed: {
    label: 'Closed',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
  },
  dead: {
    label: 'Dead',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.10)',
  },
}

const STAGE_ALIASES: Record<string, CrmStage> = {
  new_lead: 'new_lead',
  'new lead': 'new_lead',
  new: 'new_lead',
  lead: 'new_lead',
  open: 'new_lead',
  active: 'new_lead',
  fresh: 'new_lead',
  inbox: 'new_lead',
  lead_inbox: 'new_lead',
  'lead inbox': 'new_lead',
  imported: 'new_lead',

  contact_attempted: 'contact_attempted',
  'contact attempted': 'contact_attempted',
  attempted: 'contact_attempted',
  'trying to contact': 'contact_attempted',

  contacted: 'contacted',
  contact: 'contacted',
  'owner contacted': 'contacted',

  follow_up: 'follow_up',
  'follow up': 'follow_up',
  followup: 'follow_up',
  callback: 'follow_up',
  nurture: 'follow_up',

  appointment: 'appointment',
  appointment_set: 'appointment',
  'appointment set': 'appointment',
  'meeting set': 'appointment',

  offers: 'offers',
  offer: 'offers',
  offer_sent: 'offers',
  'offer sent': 'offers',
  'sent offer': 'offers',

  negotiation: 'negotiation',
  negotiating: 'negotiation',
  countered: 'negotiation',
  'counter offer': 'negotiation',

  verbals: 'verbals',
  verbal: 'verbals',
  verbal_yes: 'verbals',
  'verbal yes': 'verbals',
  'agreed verbally': 'verbals',

  under_contract: 'under_contract',
  'under contract': 'under_contract',
  contract: 'under_contract',
  contracted: 'under_contract',

  title_opened: 'title_opened',
  'title opened': 'title_opened',
  title: 'title_opened',

  buyers_market: 'buyers_market',
  'buyers market': 'buyers_market',
  buyer_marketing: 'buyers_market',
  'buyer marketing': 'buyers_market',
  'blast to buyers': 'buyers_market',

  assigned: 'assigned',
  'assignment signed': 'assigned',

  closed: 'closed',
  sold: 'closed',
  done: 'closed',

  dead: 'dead',
  'dead lead': 'dead',
  lost: 'dead',
}

export function normalizeCrmStage(value: unknown): CrmStage {
  const raw = String(value ?? '').trim().toLowerCase()

  if (!raw) {
    return 'new_lead'
  }

  if (CRM_STAGES.includes(raw as CrmStage)) {
    return raw as CrmStage
  }

  return STAGE_ALIASES[raw] ?? 'new_lead'
}

/**
 * Determines the CRM stage from a lead row.
 *
 * `pipeline_stage` is treated as the preferred explicit pipeline field.
 * The remaining fields are retained as fallbacks for older/imported records.
 */
export function resolveCrmStage(
  row: Record<string, unknown>
): CrmStage {
  const candidates = [
    row.pipeline_stage,
    row.stage,
    row.status,
    row.lead_status,
    row.deal_status,
  ]

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) {
      continue
    }

    const text = String(candidate).trim()

    if (!text) {
      continue
    }

    return normalizeCrmStage(text)
  }

  return 'new_lead'
}

export function getNextCrmStage(
  stage: CrmStage
): CrmStage | null {
  const index = CRM_STAGES.indexOf(stage)

  if (index < 0 || index >= CRM_STAGES.length - 1) {
    return null
  }

  return CRM_STAGES[index + 1]
}

export function getPreviousCrmStage(
  stage: CrmStage
): CrmStage | null {
  const index = CRM_STAGES.indexOf(stage)

  if (index <= 0) {
    return null
  }

  return CRM_STAGES[index - 1]
}