'use client'

import type { ReactNode, CSSProperties } from 'react'

type Props = {
  title?: string
  subtitle?: string
  actions?: ReactNode
  right?: ReactNode
  children: ReactNode
}

const cardStyle: CSSProperties = {
  width: '100%',
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(16,14,10,0.85), rgba(6,6,6,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxSizing: 'border-box',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
}

const headingWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
}

const titleStyle: CSSProperties = {
  fontSize: 14,
  color: '#ffffff',
  fontWeight: 750,
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
}

const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.48)',
  lineHeight: 1.4,
}

const rightWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

export default function SectionCard({
  title,
  subtitle,
  actions,
  right,
  children,
}: Props) {
  const headerRight = actions ?? right

  return (
    <div style={cardStyle}>
      {(title || subtitle || headerRight) && (
        <div style={headerStyle}>
          <div style={headingWrapStyle}>
            {title ? <div style={titleStyle}>{title}</div> : null}
            {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : null}
          </div>

          {headerRight ? <div style={rightWrapStyle}>{headerRight}</div> : null}
        </div>
      )}

      <div>{children}</div>
    </div>
  )
}