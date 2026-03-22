import StatPill from "@/components/ui/stat-pill"

type PipelineMetricsProps = {
  metrics: {
    total: number
    active: number
    projectedSpread: number
    avgStrength: number
  }
}

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`
}

export default function PipelineMetrics({ metrics }: PipelineMetricsProps) {
  return (
    <>
      <StatPill label="Visible" value={metrics.total} />
      <StatPill label="Active" value={metrics.active} />
      <StatPill label="Projected Spread" value={money(metrics.projectedSpread)} />
      <StatPill label="Avg Strength" value={`${metrics.avgStrength}%`} />
    </>
  )
}