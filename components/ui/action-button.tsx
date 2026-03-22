import type { CSSProperties, ReactNode } from 'react'

type ActionButtonProps = {
  children: ReactNode
  variant?: 'default' | 'primary' | 'gold'
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
}

export default function ActionButton({
  children,
  variant = 'default',
  type = 'button',
  onClick,
  disabled = false,
}: ActionButtonProps) {
  const palette =
    variant === 'gold'
      ? {
          background: 'linear-gradient(180deg, #f4d78b 0%, #c89b3c 100%)',
          border: '1px solid rgba(240, 198, 107, 0.75)',
          color: '#18130a',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 24px rgba(201,163,78,0.22)',
        }
      : variant === 'primary'
        ? {
            background: 'linear-gradient(180deg, #1e1a16 0%, #0f0d0b 100%)',
            border: '1px solid rgba(201,163,78,0.28)',
            color: '#f4ddaa',
            boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
          }
        : {
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.86)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
          }

  const style: CSSProperties = {
    height: 46,
    borderRadius: 16,
    padding: '0 16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease',
    ...palette,
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={style}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </button>
  )
}