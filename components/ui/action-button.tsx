'use client'

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

export type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  compact?: boolean
  tone?: 'default' | 'gold' | 'ghost' | 'danger'
}

export default function ActionButton({
  children,
  compact = false,
  tone = 'default',
  type = 'button',
  style,
  disabled,
  ...props
}: ActionButtonProps) {
  const toneStyle =
    tone === 'gold'
      ? goldStyle
      : tone === 'ghost'
        ? ghostStyle
        : tone === 'danger'
          ? dangerStyle
          : defaultStyle

  return (
    <button
      type={type}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...(compact ? compactStyle : regularStyle),
        ...toneStyle,
        ...(disabled ? disabledStyle : null),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

const baseStyle: CSSProperties = {
  appearance: 'none',
  borderRadius: 12,
  border: '1px solid transparent',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontWeight: 700,
  lineHeight: 1,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  transition:
    'transform 140ms ease, opacity 140ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
}

const regularStyle: CSSProperties = {
  minHeight: 38,
  padding: '0 16px',
  fontSize: 13,
  letterSpacing: '-0.01em',
}

const compactStyle: CSSProperties = {
  minHeight: 30,
  padding: '0 11px',
  fontSize: 11.5,
  borderRadius: 9,
  letterSpacing: '-0.01em',
}

const defaultStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(28,24,18,0.9), rgba(12,10,6,0.95))',
  borderColor: 'rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.92)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
}

const goldStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #f0ca7e 0%, #d6a64b 100%)',
  borderColor: 'rgba(214,166,75,0.5)',
  color: '#0e0b04',
  fontWeight: 800,
  boxShadow:
    '0 0 20px rgba(214,166,75,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
}

const ghostStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderColor: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.75)',
  boxShadow: 'none',
}

const dangerStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(40,12,18,0.9), rgba(16,4,6,0.95))',
  borderColor: 'rgba(251,113,133,0.35)',
  color: '#fda4af',
  boxShadow:
    '0 0 16px rgba(251,113,133,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const disabledStyle: CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
  boxShadow: 'none',
  transform: 'none',
}