"use client"

import { useState, type CSSProperties } from "react"
import DealCard from "@/components/pipeline/deal-card"
import SegmentedScoreBar from "@/components/ui/segmented-score-bar"
import type { PipelineLead, StageColor } from "@/components/pipeline/types"

type StageColumnProps = {
  stage: string
  label: string
  color: StageColor
  strength: number
  leads: PipelineLead[]
  draggingLeadId: string | null
  updatingLeadId: string | null
  onMoveLead: (leadId: string, stage: string) => void
  onDragLeadStart: (leadId: string | null) => void
  onDragLeadEnd: () => void
}

export default function StageColumn({
  stage,
  label,
  color,
  strength,
  leads,
  draggingLeadId,
  updatingLeadId,
  onMoveLead,
  onDragLeadStart,
  onDragLeadEnd,
}: StageColumnProps) {
  const [isOver, setIsOver] = useState(false)

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const leadId = event.dataTransfer.getData("text/plain")

    setIsOver(false)
    onDragLeadEnd()

    if (!leadId) return
    await onMoveLead(leadId, stage)
  }

  return (
    <div
      style={{
        ...columnStyle,
        borderColor: isOver ? color.border : "var(--border)",
        boxShadow: isOver
          ? `0 0 0 1px ${color.border}, 0 18px 40px ${color.glow}`
          : "var(--shadow-soft)",
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <div style={headerStyle}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={titleRowStyle}>
            <span
              style={{
                ...stageDotStyle,
                background: color.hex,
                boxShadow: `0 0 18px ${color.glow}`,
              }}
            />
            <span style={titleStyle}>{label}</span>
            <span className="crm-badge soft">{leads.length}</span>
          </div>

          <SegmentedScoreBar label="Strength" value={strength} />
        </div>
      </div>

      <div style={bodyStyle}>
        {leads.length === 0 ? (
          <div style={emptyStyle}>No deals in this stage yet.</div>
        ) : (
          leads.map((lead) => (
            <DealCard
              key={lead.id}
              lead={lead}
              color={color}
              isDragging={draggingLeadId === lead.id}
              isUpdating={updatingLeadId === lead.id}
              onMoveLead={onMoveLead}
              onDragStart={() => onDragLeadStart(lead.id)}
              onDragEnd={onDragLeadEnd}
            />
          ))
        )}
      </div>
    </div>
  )
}

const columnStyle: CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  minHeight: 700,
  maxHeight: 700,
  borderRadius: 22,
  border: "1px solid var(--border)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.014))",
  overflow: "hidden",
}

const headerStyle: CSSProperties = {
  padding: 14,
  borderBottom: "1px solid var(--line)",
  background: "rgba(255,255,255,0.02)",
}

const titleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "var(--text)",
}

const stageDotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  flexShrink: 0,
}

const bodyStyle: CSSProperties = {
  overflowY: "auto",
  padding: 12,
  display: "grid",
  alignContent: "start",
  gap: 12,
}

const emptyStyle: CSSProperties = {
  minHeight: 120,
  display: "grid",
  placeItems: "center",
  borderRadius: 16,
  border: "1px dashed var(--border)",
  color: "var(--text-faint)",
  fontSize: 12,
}