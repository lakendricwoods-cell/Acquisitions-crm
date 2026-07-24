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
        gap: isMobile ? 16 : 22,
      }}
    >
      <header
        style={{
          ...headerContainerStyle,
          padding: isMobile ? '14px 16px' : '18px 22px',
          gap: isMobile ? 12 : 16,
        }}
      >
        <div style={titleWrapStyle}>
          <h1
            style={{
              ...titleStyle,
              fontSize: isMobile ? 22 : 26,
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
      </header>

      <main style={contentStyle}>{children}</main>
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

const headerContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(16,14,10,0.85), rgba(6,6,6,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
}

const titleWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  minWidth: 0,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontWeight: 800,
  lineHeight: 1.1,
  color: '#ffffff',
  letterSpacing: '-0.02em',
}

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: 'rgba(255,255,255,0.50)',
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