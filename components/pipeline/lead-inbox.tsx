import { useMemo, useState, type CSSProperties } from "react"
import ActionButton from "@/components/ui/action-button"
import type { PipelineLead } from "@/components/pipeline/types"

type LeadInboxProps = {
  leads: PipelineLead[]
  updatingLeadId: string | null
  onMoveLead: (leadId: string, stage: string) => void
}

const ACTIVE_STAGES = [
  "new_lead",
  "contact_attempted",
  "contacted",
  "follow_up",
  "appointment_set",
  "negotiation",
  "offer_sent",
  "offer_accepted",
  "under_contract",
  "due_diligence",
  "buyer_found",
  "closing",
]

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—"
  return `$${Math.round(value).toLocaleString()}`
}

export default function LeadInbox({
  leads,
  updatingLeadId,
  onMoveLead,
}: LeadInboxProps) {
  const [selectedStage, setSelectedStage] = useState("new_lead")
  const [search, setSearch] = useState("")

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      const haystack = [
        lead.property_address_1,
        lead.city,
        lead.state,
        lead.owner_name,
        lead.owner_phone_primary,
        lead.notes_summary,
        lead.next_action,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return search.trim()
        ? haystack.includes(search.trim().toLowerCase())
        : true
    })
  }, [leads, search])

  return (
    <div className="crm-stack">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1fr) 220px",
          gap: 12,
        }}
      >
        <input
          className="crm-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads to review or move into your active flow..."
        />

        <select
          className="crm-select"
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
        >
          {ACTIVE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              Move to: {stage}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        {visibleLeads.length === 0 ? (
          <div className="crm-muted">No leads yet.</div>
        ) : (
          visibleLeads.map((lead) => (
            <div key={lead.id} style={cardStyle}>
              <div style={topStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={titleStyle}>{lead.property_address_1 || "Untitled Lead"}</div>
                  <div style={subStyle}>
                    {[lead.city, lead.state].filter(Boolean).join(", ") || "Location pending"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="crm-badge soft">{lead.status || "new_lead"}</span>
                  <span className="crm-badge soft">{lead.heat_score || 0}% strength</span>
                </div>
              </div>

              <div style={detailGridStyle}>
                <Detail label="Seller" value={lead.owner_name || "—"} />
                <Detail label="Phone" value={lead.owner_phone_primary || "—"} />
                <Detail label="ARV" value={money(lead.arv)} />
                <Detail label="MAO" value={money(lead.mao)} />
                <Detail label="Spread" value={money(lead.projected_spread)} />
                <Detail label="Next Action" value={lead.next_action || "Continue qualification"} />
              </div>

              {lead.notes_summary ? (
                <div style={notesStyle}>{lead.notes_summary}</div>
              ) : null}

              <div style={actionsStyle}>
                <ActionButton
                  onClick={() => onMoveLead(lead.id, selectedStage)}
                  disabled={updatingLeadId === lead.id}
                >
                  {updatingLeadId === lead.id ? "Moving..." : "Move to Stage"}
                </ActionButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailStyle}>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  borderRadius: 20,
  border: "1px solid var(--border)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
  padding: 14,
  display: "grid",
  gap: 12,
}

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
}

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--text)",
}

const subStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "var(--text-soft)",
}

const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
}

const detailStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.02)",
  padding: "8px 9px",
}

const detailLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-faint)",
  marginBottom: 4,
}

const detailValueStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.35,
  color: "var(--text)",
  fontWeight: 650,
}

const notesStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--text-soft)",
  lineHeight: 1.5,
  borderTop: "1px solid var(--line)",
  paddingTop: 12,
}

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
}