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
  borderRadius: 13,
  border: '1px solid transparent',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontWeight: 700,
  lineHeight: 1,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition:
    'transform 160ms ease, opacity 160ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
}

const regularStyle: CSSProperties = {
  minHeight: 38,
  padding: '0 14px',
  fontSize: 13,
}

const compactStyle: CSSProperties = {
  minHeight: 30,
  padding: '0 11px',
  fontSize: 12,
  borderRadius: 10,
}

const defaultStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(12,12,12,0.95), rgba(0,0,0,0.98))',
  borderColor: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.92)',
  boxShadow: '0 0 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
}

const goldStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #f0ca7e 0%, #d6a64b 100%)',
  borderColor: 'rgba(214,166,75,0.4)',
  color: '#140f06',
  fontWeight: 750,
  boxShadow: '0 0 18px rgba(214,166,75,0.22), inset 0 1px 0 rgba(255,255,255,0.25)',
}

const ghostStyle: CSSProperties = {
  background: 'transparent',
  borderColor: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.68)',
  boxShadow: 'none',
}

const dangerStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(28,10,14,0.92), rgba(8,0,2,0.98))',
  borderColor: 'rgba(251,113,133,0.3)',
  color: '#fda4af',
  boxShadow: '0 0 14px rgba(251,113,133,0.12), inset 0 1px 0 rgba(255,255,255,0.02)',
}

const disabledStyle: CSSProperties = {
  opacity: 0.45,
  cursor: 'not-allowed',
  boxShadow: 'none',
  transform: 'none',
}