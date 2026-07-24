'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { PipelineLead, StageColor } from '@/components/pipeline/types'

type DealCardProps = {
  lead: PipelineLead
  color: StageColor
  isDragging: boolean
  isUpdating: boolean
  onMoveLead: (leadId: string, stage: string) => void
  onDragStart: () => void
  onDragEnd: () => void
}

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
}

export default function DealCard({
  lead,
  color,
  isDragging,
  isUpdating,
  onDragStart,
  onDragEnd,
}: DealCardProps) {
  const smsBody = encodeURIComponent(
    `Hi${lead.owner_name ? ` ${lead.owner_name}` : ''}, this is Lakendric with Foundation Acquisitions. I wanted to follow up on ${lead.property_address_1 || 'your property'}.`
  )

  const telLink = lead.owner_phone_primary
    ? `tel:${lead.owner_phone_primary}`
    : undefined

  const smsLink = lead.owner_phone_primary
    ? `sms:${lead.owner_phone_primary}?body=${smsBody}`
    : undefined

  const hexColor = color?.hex || '#d6a64b'

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', lead.id)
        event.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      style={{
        ...cardStyle,
        borderColor: isDragging ? hexColor : `${hexColor}40`,
        boxShadow: isDragging
          ? `0 20px 50px ${color?.glow || 'rgba(214, 166, 75, 0.3)'}`
          : `inset 3px 0 0 ${hexColor}, 0 8px 24px rgba(0,0,0,0.5)`,
        opacity: isUpdating ? 0.5 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div style={cardTopStyle}>
        <div style={{ minWidth: 0 }}>
          <div style={titleStyle}>{lead.property_address_1 || 'Untitled Lead'}</div>
          <div style={subStyle}>
            {[lead.city, lead.state].filter(Boolean).join(', ') || 'Location pending'}
          </div>
        </div>

        <div
          style={{
            ...heatBadgeStyle,
            background: color?.softBg || 'rgba(214, 166, 75, 0.15)',
            borderColor: color?.border || 'rgba(214, 166, 75, 0.3)',
            color: hexColor,
            boxShadow: `0 0 10px ${hexColor}20`,
          }}
        >
          {lead.heat_score || 0}%
        </div>
      </div>

      <div style={metaGridStyle}>
        <Meta label="Seller" value={lead.owner_name || '—'} />
        <Meta label="Source" value={lead.lead_source || '—'} />
        <Meta label="ARV" value={money(lead.arv)} />
        <Meta label="MAO" value={money(lead.mao)} />
        <Meta label="Spread" value={money(lead.projected_spread)} isHighlight />
        <Meta label="Asking" value={money(lead.asking_price)} />
      </div>

      <div style={infoRowStyle}>
        <span
          style={{
            ...actionBadgeStyle,
            borderColor: `${hexColor}30`,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <span style={{ color: hexColor, marginRight: 6 }}>➜</span>
          {lead.next_action || 'Continue qualification'}
        </span>
      </div>

      <div style={actionRowStyle}>
        {telLink ? (
          <a href={telLink} style={linkButtonStyle}>
            Call
          </a>
        ) : (
          <span style={disabledActionStyle}>Call</span>
        )}

        {smsLink ? (
          <a href={smsLink} style={linkButtonStyle}>
            Text
          </a>
        ) : (
          <span style={disabledActionStyle}>Text</span>
        )}

        <Link href={`/leads/${lead.id}`} style={linkButtonStyle}>
          Note
        </Link>

        <Link href={`/leads/${lead.id}`} style={linkButtonStyle}>
          Workspace
        </Link>

        <Link href={`/leads/${lead.id}`} style={primaryLinkButtonStyle}>
          Offer
        </Link>
      </div>
    </article>
  )
}

function Meta({
  label,
  value,
  isHighlight = false,
}: {
  label: string
  value: string
  isHighlight?: boolean
}) {
  return (
    <div
      style={{
        ...metaCardStyle,
        borderColor: isHighlight ? 'rgba(214, 166, 75, 0.3)' : 'rgba(255,255,255,0.05)',
        background: isHighlight
          ? 'linear-gradient(180deg, rgba(30,24,14,0.8), rgba(12,10,6,0.9))'
          : 'linear-gradient(180deg, rgba(22,20,16,0.7), rgba(10,10,10,0.9))',
      }}
    >
      <div style={metaLabelStyle}>{label}</div>
      <div
        style={{
          ...metaValueStyle,
          color: isHighlight ? '#d6a64b' : '#ffffff',
        }}
      >
        {value}
      </div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(16,14,10,0.92), rgba(6,6,6,0.98))',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  padding: 13,
  cursor: 'grab',
  userSelect: 'none',
  transition:
    'transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease, border-color 160ms ease',
}

const cardTopStyle: CSSProperties = {
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
  letterSpacing: '-0.01em',
}

const subStyle: CSSProperties = {
  marginTop: 3,
  color: 'rgba(255,255,255,0.50)',
  fontSize: 11.5,
}

const heatBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3px 8px',
  borderRadius: 8,
  border: '1px solid transparent',
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0,
}

const metaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 6,
}

const metaCardStyle: CSSProperties = {
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.05)',
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
  lineHeight: 1.2,
}

const infoRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const actionBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '5px 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.4)',
  fontSize: 11,
  fontWeight: 600,
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
}

const linkButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 28,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.85)',
  fontSize: 11.5,
  fontWeight: 650,
  textDecoration: 'none',
  transition: 'all 140ms ease',
}

const primaryLinkButtonStyle: CSSProperties = {
  ...linkButtonStyle,
  borderColor: 'rgba(214, 166, 75, 0.4)',
  background: 'linear-gradient(180deg, rgba(214,166,75,0.2), rgba(180,130,40,0.25))',
  color: '#ffffff',
  boxShadow: '0 0 10px rgba(214,166,75,0.15)',
}

const disabledActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 28,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.04)',
  background: 'rgba(0,0,0,0.2)',
  color: 'rgba(255,255,255,0.25)',
  fontSize: 11.5,
  fontWeight: 600,
}