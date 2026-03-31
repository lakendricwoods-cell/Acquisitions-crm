'use client'

import type { ReactNode, CSSProperties } from 'react'

type Props = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

const containerStyle: CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: '24px 28px',
  background: 'transparent',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
}

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: '#ffffff',
}

const subtitleStyle: CSSProperties = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.6)',
}

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
}: Props) {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>{title}</div>
          {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>{actions}</div>
      </div>

      <div style={{ width: '100%' }}>{children}</div>
    </div>
  )
}