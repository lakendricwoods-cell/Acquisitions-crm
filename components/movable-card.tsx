'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

type MovableCardProps = {
  title: string
  initialX: number
  initialY: number
  width: number
  children: React.ReactNode
}

export default function MovableCard({
  title,
  initialX,
  initialY,
  width,
  children,
}: MovableCardProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [dragging, setDragging] = useState(false)
  const offsetRef = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setDragging(true)
  }

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const parentLeft = 0
      const parentTop = 0

      setPosition({
        x: Math.max(0, e.clientX - offsetRef.current.x - parentLeft - 248),
        y: Math.max(0, e.clientY - offsetRef.current.y - parentTop - 110),
      })
    }

    const handleMouseUp = () => setDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  return (
    <div
      style={{
        ...cardStyle,
        left: position.x,
        top: position.y,
        width,
        boxShadow: dragging ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        transform: dragging ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      <div onMouseDown={handleMouseDown} style={headerStyle}>
        <strong>{title}</strong>
        <div style={grabPillStyle} />
      </div>

      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  position: 'absolute',
  borderRadius: 24,
  border: '1px solid var(--border)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,248,244,0.98) 100%)',
  overflow: 'hidden',
  userSelect: 'none',
  transition: 'box-shadow 0.18s ease, transform 0.18s ease',
}

const headerStyle: CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid var(--border)',
  cursor: 'grab',
  background: 'rgba(255,255,255,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const grabPillStyle: CSSProperties = {
  width: 34,
  height: 6,
  borderRadius: 999,
  background: 'var(--border-strong)',
}