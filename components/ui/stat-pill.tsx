import type { ReactNode } from "react"

type StatPillProps = {
  label: string
  value: ReactNode
}

export default function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="crm-stat-pill">
      <span className="crm-stat-pill-label">{label}</span>
      <span className="crm-stat-pill-value">{value}</span>
    </div>
  )
}