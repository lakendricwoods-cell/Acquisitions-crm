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
  borderRadius: 16,
  border: '1px solid rgba(88,230,255,0.12)',
  background: 'linear-gradient(180deg, rgba(11,19,36,0.94), rgba(8,14,28,0.96))',
  boxShadow: 'inset 0 0 16px rgba(88,230,255,0.04)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-faint)',
}

const valueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: '#f7fcff',
  textShadow: '0 0 14px rgba(88,230,255,0.08)',
}