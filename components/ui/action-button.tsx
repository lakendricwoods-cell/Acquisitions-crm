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
  transition:
    'transform 120ms ease, opacity 120ms ease, background 120ms ease, border-color 120ms ease',
  whiteSpace: 'nowrap',
}

const regularStyle: CSSProperties = {
  minHeight: 40,
  padding: '0 14px',
  fontSize: 13,
}

const compactStyle: CSSProperties = {
  minHeight: 32,
  padding: '0 10px',
  fontSize: 12,
  borderRadius: 10,
}

const defaultStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(214,166,75,0.20), rgba(214,166,75,0.12))',
  borderColor: 'rgba(214,166,75,0.28)',
  color: '#f5dfab',
  boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
}

const goldStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(214,166,75,0.24), rgba(214,166,75,0.14))',
  borderColor: 'rgba(214,166,75,0.34)',
  color: '#f6dfa0',
  boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
}

const ghostStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  borderColor: 'rgba(255,255,255,0.10)',
  color: 'var(--text, #f5f7fb)',
}

const dangerStyle: CSSProperties = {
  background: 'rgba(239,68,68,0.12)',
  borderColor: 'rgba(239,68,68,0.24)',
  color: '#ffd4d4',
}

const disabledStyle: CSSProperties = {
  opacity: 0.55,
  cursor: 'not-allowed',
  boxShadow: 'none',
}