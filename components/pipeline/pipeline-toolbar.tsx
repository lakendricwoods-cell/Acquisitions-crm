'use client'

import type { CSSProperties } from 'react'
import ActionButton from '@/components/ui/action-button'

type StepFilter =
  | 'all'
  | 'current'
  | 'next'

type PipelineToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  stepFilter: StepFilter
  onStepFilterChange: (
    value: StepFilter
  ) => void
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
        <span style={searchIconStyle}>
          🔍
        </span>

        <input
          style={inputStyle}
          className="crm-input"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search address, seller, source, next action..."
        />

        {search ? (
          <button
            type="button"
            onClick={() =>
              onSearchChange('')
            }
            style={clearButtonStyle}
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}
      </div>

      <div style={selectWrapStyle}>
        <select
          style={selectStyle}
          className="crm-select"
          value={stepFilter}
          onChange={(event) =>
            onStepFilterChange(
              event.target.value as StepFilter
            )
          }
        >
          <option value="all">
            Show All Stages
          </option>

          <option value="current">
            Current Active Work
          </option>

          <option value="next">
            Next Step Focus
          </option>
        </select>

        <span style={selectArrowStyle}>
          ▾
        </span>
      </div>

      <div style={actionWrapStyle}>
        <ActionButton
          tone="ghost"
          onClick={onRefresh}
        >
          ↻ Refresh
        </ActionButton>
      </div>
    </div>
  )
}

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(260px, 1fr) minmax(200px, 240px) auto',
  gap: 12,
  alignItems: 'center',
  padding: 12,
  borderRadius: 18,
  border:
    '1px solid rgba(255,255,255,0.06)',
  background:
    'linear-gradient(180deg, rgba(12,10,6,0.85), rgba(0,0,0,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
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
  paddingRight: 34,
  borderRadius: 12,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.6)',
  color: '#ffffff',
  fontSize: 13,
  outline: 'none',
}

const clearButtonStyle: CSSProperties = {
  position: 'absolute',
  right: 8,
  width: 25,
  height: 25,
  borderRadius: '50%',
  border:
    '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  fontSize: 17,
  lineHeight: 1,
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
  border:
    '1px solid rgba(255,255,255,0.08)',
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