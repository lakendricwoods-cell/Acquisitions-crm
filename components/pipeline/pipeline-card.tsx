'use client'

import type { CSSProperties } from 'react'
import ActionButton from '@/components/ui/action-button'
import type { CrmStage } from '@/lib/crm-stage'
import { CRM_STAGE_META, getNextCrmStage } from '@/lib/crm-stage'

export type PipelineLead = {
  id: string
  property_address_1: string | null
  city: string | null
  state: string | null
  zip: string | null
  owner_name: string | null
  lead_type: string | null
  house_value: number | null
  estimated_value: number | null
  market_value: number | null
  equity_amount: number | null
  mortgage_balance: number | null
  status: string | null
  deal_status?: string | null
  lead_status?: string | null
  pipeline_stage?: string | null
  stage?: string | null
}

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
}

export default function PipelineCard({
  lead,
  stage,
  onMoveToStage,
}: {
  lead: PipelineLead
  stage: CrmStage
  onMoveToStage: (lead: PipelineLead, nextStage: CrmStage) => void
}) {
  const nextStage = getNextCrmStage(stage)

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData('text/plain', lead.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  const accent = CRM_STAGE_META[stage].color

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      style={{
        ...cardStyle,
        borderColor: `${accent}30`,
        boxShadow: `inset 0 0 16px ${accent}12`,
      }}
    >
      <div style={topRowStyle}>
        <div style={titleStyle}>{lead.property_address_1 || 'Unknown property'}</div>
        <span
          className="crm-badge soft"
          style={{
            background: `${accent}12`,
            borderColor: `${accent}30`,
            color: accent,
          }}
        >
          {lead.lead_type || 'standard'}
        </span>
      </div>

      <div style={subStyle}>
        {[lead.city, lead.state, lead.zip].filter(Boolean).join(', ') || 'Location pending'}
      </div>

      <div style={metaGridStyle}>
        <Meta label="Owner" value={lead.owner_name || '—'} />
        <Meta
          label="Value"
          value={money(lead.house_value ?? lead.estimated_value ?? lead.market_value)}
        />
        <Meta label="Equity" value={money(lead.equity_amount)} />
        <Meta label="Mortgage" value={money(lead.mortgage_balance)} />
      </div>

      <div style={actionRowStyle}>
        <span style={dragHintStyle}>Drag to move</span>
        {nextStage ? (
          <ActionButton compact onClick={() => onMoveToStage(lead, nextStage)}>
            Next Stage
          </ActionButton>
        ) : null}
      </div>
    </article>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={metaStyle}>
      <div style={metaLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
  padding: 13,
  display: 'grid',
  gap: 10,
  cursor: 'grab',
  userSelect: 'none',
}

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
}

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.25,
}

const subStyle: CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.58)',
}

const metaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
}

const metaStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(6,8,14,0.94), rgba(1,3,8,0.98))',
  padding: '8px 9px',
}

const metaLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.40)',
  marginBottom: 4,
}

const metaValueStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 650,
  color: '#ffffff',
  lineHeight: 1.3,
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}

const dragHintStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.40)',
}