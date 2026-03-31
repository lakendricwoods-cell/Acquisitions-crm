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
      <div style={innerStyle}>
        <div style={headerStyle}>
          <div style={titleWrapStyle}>
            <h1 style={titleStyle}>{title}</h1>
            {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
          </div>

          {actions ? <div style={actionsStyle}>{actions}</div> : null}
        </div>

        <div style={contentStyle}>{children}</div>
      </div>
    </div>
  )
}

const outerStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
}

const innerStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1320,
  margin: '0 auto',
  minWidth: 0,
  padding: '20px 20px 28px',
  boxSizing: 'border-box',
}

const headerStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 18,
  flexWrap: 'wrap',
}

const titleWrapStyle: CSSProperties = {
  minWidth: 0,
  flex: '1 1 420px',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1.1,
  color: '#f8fcff',
  textShadow: '0 0 18px rgba(88,230,255,0.08)',
}

const subtitleStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--text-soft)',
  maxWidth: '100%',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap',
  minWidth: 0,
  flex: '0 1 auto',
}

const contentStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  display: 'grid',
  gap: 18,
}