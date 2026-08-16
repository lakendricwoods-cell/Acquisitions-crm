'use client'

import type { CSSProperties } from 'react'
import StatPill from '@/components/ui/stat-pill'

type PipelineMetricsProps = {
  metrics: {
    total: number
    active: number
    projectedSpread: number
    avgStrength: number
  }
}

function money(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '$0'
  }

  return `$${Math.round(value).toLocaleString()}`
}

function safePercent(
  value: number | null | undefined
): number {
  if (value == null || Number.isNaN(value)) {
    return 0
  }

  return Math.max(
    0,
    Math.min(100, Math.round(value))
  )
}

export default function PipelineMetrics({
  metrics,
}: PipelineMetricsProps) {
  return (
    <div style={containerStyle}>
      <StatPill
        label="Visible"
        value={metrics.total ?? 0}
      />

      <StatPill
        label="Active"
        value={metrics.active ?? 0}
      />

      <StatPill
        label="Projected Spread"
        value={money(metrics.projectedSpread)}
      />

      <StatPill
        label="Avg Strength"
        value={`${safePercent(metrics.avgStrength)}%`}
      />
    </div>
  )
}

const containerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
  padding: 12,
  borderRadius: 18,
  border:
    '1px solid rgba(255,255,255,0.06)',
  background:
    'linear-gradient(180deg, rgba(14,12,8,0.85), rgba(0,0,0,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}