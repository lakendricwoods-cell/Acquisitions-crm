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
  borderRadius: 14,
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
    'transform 140ms ease, opacity 140ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
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
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
  borderColor: 'rgba(88,230,255,0.28)',
  color: '#d8f8ff',
  boxShadow: '0 0 14px rgba(88,230,255,0.16), inset 0 0 0 1px rgba(88,230,255,0.03)',
}

const goldStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
  borderColor: 'rgba(255,179,71,0.30)',
  color: '#ffe2b7',
  boxShadow: '0 0 14px rgba(255,179,71,0.14), inset 0 0 0 1px rgba(255,179,71,0.03)',
}

const ghostStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
  borderColor: 'rgba(88,230,255,0.12)',
  color: 'var(--text)',
  boxShadow: 'inset 0 0 12px rgba(88,230,255,0.03)',
}

const dangerStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
  borderColor: 'rgba(255,107,143,0.28)',
  color: '#ffd6e0',
  boxShadow: '0 0 14px rgba(255,107,143,0.12), inset 0 0 0 1px rgba(255,107,143,0.03)',
}

const disabledStyle: CSSProperties = {
  opacity: 0.55,
  cursor: 'not-allowed',
  boxShadow: 'none',
}