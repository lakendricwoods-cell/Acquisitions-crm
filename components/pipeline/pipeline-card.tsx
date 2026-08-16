'use client'

import type { CSSProperties } from 'react'
import ActionButton from '@/components/ui/action-button'
import {
  CRM_STAGE_META,
  CRM_STAGES,
  getNextCrmStage,
  getPreviousCrmStage,
  type CrmStage,
} from '@/lib/crm-stage'

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

function money(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—'
  }

  return `$${Math.round(value).toLocaleString()}`
}

export default function PipelineCard({
  lead,
  stage,
  onMoveToStage,
}: {
  lead: PipelineLead
  stage: CrmStage
  onMoveToStage: (
    lead: PipelineLead,
    nextStage: CrmStage
  ) => void | Promise<void>
}) {
  const nextStage = getNextCrmStage(stage)
  const previousStage = getPreviousCrmStage(stage)
  const accent = CRM_STAGE_META[stage].color || '#d6a64b'

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.dataTransfer.setData('text/plain', lead.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      style={{
        ...cardStyle,
        borderColor: `${accent}40`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px ${accent}0d, 0 8px 24px rgba(0,0,0,0.5)`,
      }}
    >
      <div style={topRowStyle}>
        <div style={titleStyle}>
          {lead.property_address_1 || 'Unknown property'}
        </div>

        <span
          style={{
            ...typeBadgeStyle,
            background: `${accent}15`,
            borderColor: `${accent}35`,
            color: accent,
          }}
        >
          {lead.lead_type || 'standard'}
        </span>
      </div>

      <div style={subStyle}>
        {[lead.city, lead.state, lead.zip]
          .filter(Boolean)
          .join(', ') || 'Location pending'}
      </div>

      <div style={metaGridStyle}>
        <Meta
          label="Owner"
          value={lead.owner_name || '—'}
        />

        <Meta
          label="Value"
          value={money(
            lead.house_value ??
              lead.estimated_value ??
              lead.market_value
          )}
        />

        <Meta
          label="Equity"
          value={money(lead.equity_amount)}
        />

        <Meta
          label="Mortgage"
          value={money(lead.mortgage_balance)}
        />
      </div>

      <div style={stageControlStyle}>
        <select
          data-no-pan="true"
          value={stage}
          onChange={(event) => {
            const next = event.target.value as CrmStage

            if (next !== stage) {
              void onMoveToStage(lead, next)
            }
          }}
          style={{
            ...stageSelectStyle,
            borderColor: `${accent}35`,
            color: accent,
          }}
          aria-label={`Move ${lead.property_address_1 || 'lead'} to stage`}
        >
          {CRM_STAGES.map((crmStage) => (
            <option
              key={crmStage}
              value={crmStage}
            >
              {CRM_STAGE_META[crmStage].label}
            </option>
          ))}
        </select>
      </div>

      <div style={actionRowStyle}>
        <span style={dragHintStyle}>
          <span style={{ color: accent }}>⋮⋮</span>
          Drag to move
        </span>

        <div style={buttonGroupStyle}>
          {previousStage ? (
            <ActionButton
              compact
              tone="ghost"
              onClick={() =>
                void onMoveToStage(lead, previousStage)
              }
            >
              ←
            </ActionButton>
          ) : null}

          {nextStage ? (
            <ActionButton
              compact
              tone="gold"
              onClick={() =>
                void onMoveToStage(lead, nextStage)
              }
            >
              Next
            </ActionButton>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function Meta({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={metaStyle}>
      <div style={metaLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  background:
    'linear-gradient(180deg, rgba(16,14,10,0.92), rgba(6,6,6,0.98))',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
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
  fontSize: 13.5,
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
}

const typeBadgeStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  padding: '3px 8px',
  borderRadius: 6,
  border: '1px solid transparent',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const subStyle: CSSProperties = {
  fontSize: 11.5,
  color: 'rgba(255,255,255,0.50)',
}

const metaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 6,
}

const metaStyle: CSSProperties = {
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.05)',
  background:
    'linear-gradient(180deg, rgba(22,20,16,0.7), rgba(10,10,10,0.9))',
  padding: '7px 8px',
}

const metaLabelStyle: CSSProperties = {
  fontSize: 9.5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.38)',
  marginBottom: 3,
  fontWeight: 600,
}

const metaValueStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const stageControlStyle: CSSProperties = {
  width: '100%',
}

const stageSelectStyle: CSSProperties = {
  width: '100%',
  minHeight: 34,
  padding: '0 10px',
  borderRadius: 9,
  border: '1px solid',
  background: 'rgba(0,0,0,0.55)',
  fontSize: 11,
  fontWeight: 700,
  outline: 'none',
  cursor: 'pointer',
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  paddingTop: 2,
}

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
}

const dragHintStyle: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  color: 'rgba(255,255,255,0.35)',
}