'use client'

import type { CSSProperties, ReactNode } from 'react'

type SectionCardProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function SectionCard({
  title,
  subtitle,
  actions,
  children,
}: SectionCardProps) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div style={titleWrapStyle}>
          <h3 style={titleStyle}>{title}</h3>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </div>

        {actions ? <div style={actionsStyle}>{actions}</div> : null}
      </div>

      <div style={contentStyle}>{children}</div>
    </section>
  )
}

const cardStyle: CSSProperties = {
  borderRadius: 20,
  border: '1px solid rgba(88,230,255,0.12)',
  background: 'linear-gradient(180deg, rgba(4,6,12,0.98), rgba(1,3,8,0.99))',
  boxShadow:
    'inset 0 0 0 1px rgba(88,230,255,0.03), 0 0 16px rgba(88,230,255,0.04), 0 20px 44px rgba(0,0,0,0.38)',
  padding: 16,
  minWidth: 0,
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
  flexWrap: 'wrap',
}

const titleWrapStyle: CSSProperties = {
  minWidth: 0,
  flex: '1 1 280px',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  color: '#f7fcff',
  letterSpacing: '0.01em',
}

const subtitleStyle: CSSProperties = {
  margin: '5px 0 0',
  fontSize: 12,
  lineHeight: 1.45,
  color: 'var(--text-soft)',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const contentStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
}