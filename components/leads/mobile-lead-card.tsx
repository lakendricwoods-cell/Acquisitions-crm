'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'

export type MobileLeadCardData = {
  id: string
  address: string
  cityStateZip: string
  owner: string
  stage: string
  strength: number
  motivation: number
  contact: number
  market: number
  priceText: string
  arvText: string
  phoneText: string
}

export default function MobileLeadCard({
  lead,
}: {
  lead: MobileLeadCardData
}) {
  return (
    <Link href={`/leads/${lead.id}`} style={linkStyle}>
      <article style={cardStyle}>
        <div style={topRowStyle}>
          <div style={addressWrapStyle}>
            <div style={addressStyle}>{lead.address}</div>
            <div style={subStyle}>{lead.cityStateZip}</div>
          </div>

          <span style={stageBadgeStyle}>{lead.stage}</span>
        </div>

        <div style={ownerRowStyle}>
          <div style={labelStyle}>Owner</div>
          <div style={valueStyle}>{lead.owner}</div>
        </div>

        <div style={ownerRowStyle}>
          <div style={labelStyle}>Contact</div>
          <div style={valueStyle}>{lead.phoneText}</div>
        </div>

        <div style={metricGridStyle}>
          <Metric label="Strength" value={lead.strength} tone="gold" />
          <Metric label="Motivation" value={lead.motivation} tone="gold" />
          <Metric label="Contact" value={lead.contact} tone="blue" />
          <Metric label="Market" value={lead.market} tone="green" />
        </div>

        <div style={bottomGridStyle}>
          <MiniStat label="Price" value={lead.priceText} />
          <MiniStat label="ARV" value={lead.arvText} />
        </div>

        <div style={actionRowStyle}>
          <span style={openTextStyle}>Open Workspace</span>
        </div>
      </article>
    </Link>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'gold' | 'blue' | 'green'
}) {
  const toneMap = {
    gold: {
      border: 'rgba(214,166,75,0.28)',
      bg: 'rgba(214,166,75,0.10)',
      color: '#e7bf6a',
    },
    blue: {
      border: 'rgba(90,150,255,0.22)',
      bg: 'rgba(90,150,255,0.08)',
      color: '#93b9ff',
    },
    green: {
      border: 'rgba(34,197,94,0.24)',
      bg: 'rgba(34,197,94,0.08)',
      color: '#7ce39f',
    },
  }[tone]

  return (
    <div
      style={{
        ...metricStyle,
        borderColor: toneMap.border,
        background: toneMap.bg,
      }}
    >
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...metricValueStyle, color: toneMap.color }}>{value}</div>
    </div>
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={miniStatStyle}>
      <div style={miniLabelStyle}>{label}</div>
      <div style={miniValueStyle}>{value}</div>
    </div>
  )
}

const linkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(6,6,6,0.98), rgba(0,0,0,1))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.02), 0 0 12px rgba(214,166,75,0.05)',
}

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const addressWrapStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: 4,
  flex: 1,
}

const addressStyle: CSSProperties = {
  fontSize: 22,
  lineHeight: 1.04,
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '-0.03em',
  wordBreak: 'break-word',
}

const subStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  color: 'rgba(255,255,255,0.52)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const stageBadgeStyle: CSSProperties = {
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(61,110,255,0.12)',
  border: '1px solid rgba(61,110,255,0.28)',
  color: '#76a1ff',
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
}

const ownerRowStyle: CSSProperties = {
  display: 'grid',
  gap: 3,
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.38)',
}

const valueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 650,
  color: '#ffffff',
  lineHeight: 1.25,
  wordBreak: 'break-word',
}

const metricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const metricStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const metricLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.45)',
}

const metricValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
}

const bottomGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const miniStatStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const miniLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.40)',
}

const miniValueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 750,
  color: '#ffffff',
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: 2,
}

const openTextStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#e0b84f',
}