"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import type { PipelineLead, StageColor } from "@/components/pipeline/types"

type DealCardProps = {
  lead: PipelineLead
  color: StageColor
  isDragging: boolean
  isUpdating: boolean
  onMoveLead: (leadId: string, stage: string) => void
  onDragStart: () => void
  onDragEnd: () => void
}

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—"
  return `$${Math.round(value).toLocaleString()}`
}

export default function DealCard({
  lead,
  color,
  isDragging,
  isUpdating,
  onDragStart,
  onDragEnd,
}: DealCardProps) {
  const smsBody = encodeURIComponent(
    `Hi${lead.owner_name ? ` ${lead.owner_name}` : ""}, this is Lakendric with Foundation Acquisitions. I wanted to follow up on ${lead.property_address_1 || "your property"}.`,
  )

  const telLink = lead.owner_phone_primary
    ? `tel:${lead.owner_phone_primary}`
    : undefined

  const smsLink = lead.owner_phone_primary
    ? `sms:${lead.owner_phone_primary}?body=${smsBody}`
    : undefined

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", lead.id)
        event.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      style={{
        ...cardStyle,
        boxShadow: isDragging
          ? `0 20px 50px ${color.glow}`
          : `inset 3px 0 0 ${color.hex}, var(--shadow-soft)`,
        opacity: isUpdating ? 0.6 : 1,
        transform: isDragging ? "scale(1.02)" : "scale(1)",
      }}
    >
      <div style={cardTopStyle}>
        <div style={{ minWidth: 0 }}>
          <div style={titleStyle}>{lead.property_address_1 || "Untitled Lead"}</div>
          <div style={subStyle}>
            {[lead.city, lead.state].filter(Boolean).join(", ") || "Location pending"}
          </div>
        </div>

        <div
          className="crm-badge"
          style={{
            background: color.softBg,
            borderColor: color.border,
            color: color.hex,
            flexShrink: 0,
          }}
        >
          {lead.heat_score || 0}%
        </div>
      </div>

      <div style={metaGridStyle}>
        <Meta label="Seller" value={lead.owner_name || "—"} />
        <Meta label="Source" value={lead.lead_source || "—"} />
        <Meta label="ARV" value={money(lead.arv)} />
        <Meta label="MAO" value={money(lead.mao)} />
        <Meta label="Spread" value={money(lead.projected_spread)} />
        <Meta label="Asking" value={money(lead.asking_price)} />
      </div>

      <div style={infoRowStyle}>
        <span className="crm-badge soft">
          {lead.next_action || "Continue qualification"}
        </span>
      </div>

      <div style={actionRowStyle}>
        {telLink ? (
          <a href={telLink} style={linkButtonStyle}>
            Call
          </a>
        ) : (
          <span style={disabledActionStyle}>Call</span>
        )}

        {smsLink ? (
          <a href={smsLink} style={linkButtonStyle}>
            Text
          </a>
        ) : (
          <span style={disabledActionStyle}>Text</span>
        )}

        <Link href={`/leads/${lead.id}`} style={linkButtonStyle}>
          Note
        </Link>

        <Link href={`/leads/${lead.id}`} style={linkButtonStyle}>
          Workspace
        </Link>

        <Link href={`/leads/${lead.id}`} style={linkButtonStyle}>
          Offer
        </Link>
      </div>
    </article>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={metaCardStyle}>
      <div style={metaLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.038), rgba(255,255,255,0.018))",
  padding: 13,
  transition:
    "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
}

const cardTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
}

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--text)",
  lineHeight: 1.25,
  letterSpacing: "-0.02em",
}

const subStyle: CSSProperties = {
  marginTop: 4,
  color: "var(--text-soft)",
  fontSize: 12,
}

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
}

const metaCardStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.02)",
  padding: "8px 9px",
}

const metaLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-faint)",
  marginBottom: 4,
}

const metaValueStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 650,
  color: "var(--text)",
  lineHeight: 1.3,
}

const infoRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const actionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const linkButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 30,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--text)",
  fontSize: 12,
  fontWeight: 650,
  textDecoration: "none",
}

const disabledActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 30,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.02)",
  color: "var(--text-faint)",
  fontSize: 12,
  fontWeight: 650,
}