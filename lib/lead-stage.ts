export const LEAD_STAGES = [
  {
    value: 'new_lead',
    label: 'New Lead',
    shortLabel: 'New',
    color: '#d6a64b',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    shortLabel: 'Contacted',
    color: '#f59e0b',
  },
  {
    value: 'appointment_set',
    label: 'Appointment Set',
    shortLabel: 'Appointment',
    color: '#38bdf8',
  },
  {
    value: 'offer_sent',
    label: 'Offer Sent',
    shortLabel: 'Offer',
    color: '#a78bfa',
  },
  {
    value: 'negotiation',
    label: 'Negotiation',
    shortLabel: 'Negotiation',
    color: '#f97316',
  },
  {
    value: 'under_contract',
    label: 'Under Contract',
    shortLabel: 'Contract',
    color: '#22c55e',
  },
  {
    value: 'closed',
    label: 'Closed',
    shortLabel: 'Closed',
    color: '#4ade80',
  },
  {
    value: 'dead_lead',
    label: 'Dead / Archive',
    shortLabel: 'Dead',
    color: '#ef4444',
  },
] as const

export type LeadStage = (typeof LEAD_STAGES)[number]['value']

export function isLeadStage(value: unknown): value is LeadStage {
  return (
    typeof value === 'string' &&
    LEAD_STAGES.some((stage) => stage.value === value)
  )
}

export function normalizeLeadStage(value: unknown): LeadStage {
  if (isLeadStage(value)) return value
  return 'new_lead'
}

export function getLeadStageLabel(value: unknown): string {
  const stage = LEAD_STAGES.find((item) => item.value === value)
  return stage?.label ?? 'New Lead'
}

export function getLeadStageColor(value: unknown): string {
  const stage = LEAD_STAGES.find((item) => item.value === value)
  return stage?.color ?? '#d6a64b'
}