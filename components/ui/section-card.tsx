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
  background: '#050505',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  boxShadow: '0 0 0px transparent',
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
  gap: 4,
  minWidth: 0,
}

const titleStyle: CSSProperties = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.78)',
  fontWeight: 600,
  lineHeight: 1.2,
}

const subtitleStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.50)',
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