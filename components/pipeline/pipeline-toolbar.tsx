'use client'

import type { CSSProperties } from 'react'
import ActionButton from '@/components/ui/action-button'

type PipelineToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  stepFilter: 'all' | 'current' | 'next'
  onStepFilterChange: (value: 'all' | 'current' | 'next') => void
  onRefresh: () => void
}

export default function PipelineToolbar({
  search,
  onSearchChange,
  stepFilter,
  onStepFilterChange,
  onRefresh,
}: PipelineToolbarProps) {
  return (
    <div style={toolbarStyle}>
      <div style={searchWrapStyle}>
        <span style={searchIconStyle}>🔍</span>
        <input
          style={inputStyle}
          className="crm-input"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search address, seller, phone, source, next action..."
        />
      </div>

      <div style={selectWrapStyle}>
        <select
          style={selectStyle}
          className="crm-select"
          value={stepFilter}
          onChange={(e) =>
            onStepFilterChange(e.target.value as 'all' | 'current' | 'next')
          }
        >
          <option value="all">Show All Stages</option>
          <option value="current">Current Active Work</option>
          <option value="next">Next Step Focus</option>
        </select>
        <span style={selectArrowStyle}>▾</span>
      </div>

      <div style={actionWrapStyle}>
        <ActionButton tone="ghost" onClick={onRefresh}>
          Refresh Pipeline
        </ActionButton>
      </div>
    </div>
  )
}

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
  alignItems: 'center',
  padding: 12,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(12,10,6,0.85), rgba(0,0,0,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
}

const searchWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  fontSize: 12,
  opacity: 0.5,
  pointerEvents: 'none',
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  paddingLeft: 34,
  paddingRight: 14,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.6)',
  color: '#ffffff',
  fontSize: 13,
  outline: 'none',
  transition: 'all 160ms ease',
}

const selectWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}

const selectStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  paddingLeft: 14,
  paddingRight: 32,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.6)',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 13,
  appearance: 'none',
  outline: 'none',
  cursor: 'pointer',
}

const selectArrowStyle: CSSProperties = {
  position: 'absolute',
  right: 12,
  fontSize: 12,
  color: '#d6a64b',
  pointerEvents: 'none',
}

const actionWrapStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
}