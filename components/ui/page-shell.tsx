'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function sync() {
      setIsMobile(window.innerWidth <= 900)
    }

    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  return (
    <div
      style={{
        ...outerStyle,
        padding: isMobile ? '14px 14px 22px' : '22px 24px 28px',
        gap: isMobile ? 14 : 18,
      }}
    >
      <div
        style={{
          ...headerStyle,
          gap: isMobile ? 12 : 16,
        }}
      >
        <div style={titleWrapStyle}>
          <h1
            style={{
              ...titleStyle,
              fontSize: isMobile ? 24 : 28,
            }}
          >
            {title}
          </h1>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </div>

        {actions ? (
          <div
            style={{
              ...actionsStyle,
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
            }}
          >
            {actions}
          </div>
        ) : null}
      </div>

      <div style={contentStyle}>{children}</div>
    </div>
  )
}

const outerStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  display: 'grid',
  background: 'transparent',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
}

const titleWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  minWidth: 0,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontWeight: 800,
  lineHeight: 1.08,
  color: '#ffffff',
}

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.58)',
  maxWidth: 720,
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