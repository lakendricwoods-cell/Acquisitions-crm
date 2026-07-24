'use client'

import type { CSSProperties } from 'react'

type StatPillProps = {
  label: string
  value: string | number
}

export default function StatPill({ label, value }: StatPillProps) {
  return (
    <div style={pillStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  )
}

const pillStyle: CSSProperties = {
  minWidth: 0,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(16,14,10,0.92), rgba(6,6,6,0.98))',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.4)',
  padding: '8px 12px',
  display: 'grid',
  gap: 2,
}

const labelStyle: CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.42)',
}

const valueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
}