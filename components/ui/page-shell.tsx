'use client'

import type { CSSProperties, ReactNode } from 'react'

type PageShellProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
}: PageShellProps) {
  return (
    <div style={outerStyle}>
      <div style={headerStyle}>
        <div style={titleWrapStyle}>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </div>

        {actions ? <div style={actionsStyle}>{actions}</div> : null}
      </div>

      <div style={contentStyle}>{children}</div>
    </div>
  )
}

const outerStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  maxWidth: 1680,
  margin: '0 auto',
  padding: '22px 22px 28px',
  boxSizing: 'border-box',
  display: 'grid',
  gap: 18,
  background: 'transparent',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
}

const titleWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  minWidth: 0,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1.08,
  color: '#ffffff',
}

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.58)',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const contentStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  display: 'grid',
  gap: 18,
}