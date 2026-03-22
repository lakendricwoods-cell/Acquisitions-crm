"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import PageShell from "@/components/ui/page-shell"
import SectionCard from "@/components/ui/section-card"
import ActionButton from "@/components/ui/action-button"
import StatPill from "@/components/ui/stat-pill"
import { getStageHex, getStageLabel } from "@/lib/ui/stage-colors"

type DealLead = {
  id: string
  property_address_1: string | null
  city: string | null
  state: string | null
  owner_name: string | null
  owner_phone_primary: string | null
  asking_price: number | null
  arv: number | null
  mao: number | null
  projected_spread: number | null
  lead_source: string | null
  status: string | null
  next_action: string | null
  created_at: string | null
}

const DEAL_STAGES = ["offer_sent", "negotiation", "under_contract", "closed"] as const

function normalizeStatus(status: string | null | undefined) {
  return status || "lead_inbox"
}

function formatMoney(value: number | null | undefined) {
  if (value == null) return "—"
  return `$${value.toLocaleString()}`
}

function getDealStrength(deal: DealLead) {
  let score = 0
  if (deal.owner_name) score += 20
  if (deal.asking_price != null) score += 20
  if (deal.mao != null) score += 20
  if (deal.arv != null || deal.projected_spread != null) score += 20
  if (deal.next_action) score += 20
  return score
}

export default function DealsPage() {
  const [deals, setDeals] = useState<DealLead[]>([])
  const [loading, setLoading] = useState(true)

  async function loadDeals() {
    setLoading(true)

    const { data, error } = await supabase
      .from("leads")
      .select(`
        id,
        property_address_1,
        city,
        state,
        owner_name,
        owner_phone_primary,
        asking_price,
        arv,
        mao,
        projected_spread,
        lead_source,
        status,
        next_action,
        created_at
      `)
      .in("status", [...DEAL_STAGES])
      .order("created_at", { ascending: false })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setDeals((data || []) as DealLead[])
  }

  useEffect(() => {
    loadDeals()
  }, [])

  const grouped = useMemo(() => {
    return DEAL_STAGES.map((stage) => ({
      stage,
      label: getStageLabel(stage),
      hex: getStageHex(stage),
      items: deals.filter((deal) => normalizeStatus(deal.status) === stage),
    }))
  }, [deals])

  const offerSent = grouped.find((g) => g.stage === "offer_sent")?.items.length || 0
  const negotiating = grouped.find((g) => g.stage === "negotiation")?.items.length || 0
  const underContract = grouped.find((g) => g.stage === "under_contract")?.items.length || 0
  const closed = grouped.find((g) => g.stage === "closed")?.items.length || 0

  const totalSpread = deals.reduce((sum, deal) => sum + (deal.projected_spread || 0), 0)
  const avgStrength =
    deals.length > 0
      ? Math.round(deals.reduce((sum, deal) => sum + getDealStrength(deal), 0) / deals.length)
      : 0

  const blockers = useMemo(() => {
    const items: string[] = []

    const missingAction = deals.filter((deal) => !deal.next_action).length
    if (missingAction > 0) {
      items.push(`${missingAction} deal-stage records have no next action set.`)
    }

    const missingAsking = deals.filter((deal) => deal.asking_price == null).length
    if (missingAsking > 0) {
      items.push(`${missingAsking} deal-stage records are missing asking price.`)
    }

    const missingSpread = deals.filter((deal) => deal.projected_spread == null).length
    if (missingSpread > 0) {
      items.push(`${missingSpread} deal-stage records are missing spread.`)
    }

    const weak = deals.filter((deal) => getDealStrength(deal) <= 40).length
    if (weak > 0) {
      items.push(`${weak} deal-stage records are weakly filled and need more execution data.`)
    }

    if (items.length === 0) {
      items.push("No major blockers detected. Keep pushing execution and disposition.")
    }

    return items.slice(0, 4)
  }, [deals])

  const nextMoves = useMemo(() => {
    const items: string[] = []

    if (offerSent > 0) items.push(`Follow up on ${offerSent} offer-sent deals.`)
    if (negotiating > 0) items.push(`Advance ${negotiating} negotiations toward signed terms.`)
    if (underContract > 0) items.push(`Disposition ${underContract} under-contract deals to buyers.`)
    if (closed > 0) items.push(`Review ${closed} closed deals for reporting and buyer feedback.`)

    if (items.length === 0) {
      items.push("No active deals yet. Promote qualified leads into execution stages.")
    }

    return items.slice(0, 4)
  }, [offerSent, negotiating, underContract, closed])

  return (
    <PageShell
      title="Deals"
      subtitle="Transaction-stage operating page for active wholesale execution."
      actions={
        <>
          <StatPill label="Offer Sent" value={offerSent} />
          <StatPill label="Negotiating" value={negotiating} />
          <StatPill label="Under Contract" value={underContract} />
          <StatPill label="Closed" value={closed} />
        </>
      }
    >
      <SectionCard
        title="Deal Snapshot"
        subtitle="Live execution-stage summary across active transactions."
        actions={<ActionButton onClick={loadDeals}>Refresh</ActionButton>}
      >
        <div style={snapshotRowStyle}>
          <DealMetricCard label="Total Deals" value={String(deals.length)} accent="#d6a64b" />
          <DealMetricCard label="Projected Spread" value={formatMoney(totalSpread)} accent="#46df8b" />
          <DealMetricCard label="Avg Strength" value={`${avgStrength}%`} accent="#ffffff" />
          <DealMetricCard label="Negotiating" value={String(negotiating)} accent="#b48cff" />
        </div>
      </SectionCard>

      <div style={dealsLayoutStyle}>
        <div style={dealBoardStyle}>
          {grouped.map((group) => (
            <SectionCard
              key={group.stage}
              title={group.label}
              subtitle={`${group.items.length} deal${group.items.length === 1 ? "" : "s"} in this stage.`}
              actions={
                <span
                  style={{
                    ...stageMiniBadgeStyle,
                    color: group.hex,
                    borderColor: `${group.hex}55`,
                    background: `${group.hex}12`,
                  }}
                >
                  {group.items.length}
                </span>
              }
            >
              {loading ? (
                <div className="crm-muted">Loading deals...</div>
              ) : group.items.length === 0 ? (
                <div style={emptyStateStyle}>No deals in this stage.</div>
              ) : (
                <div style={dealStackStyle}>
                  {group.items.map((deal) => (
                    <div
                      key={deal.id}
                      style={{
                        ...dealCardStyle,
                        borderColor: `${group.hex}55`,
                        boxShadow: `0 12px 28px rgba(0,0,0,0.28), 0 0 18px ${group.hex}12`,
                      }}
                    >
                      <div style={dealCardTopStyle}>
                        <div>
                          <div style={dealTitleStyle}>
                            {deal.property_address_1 || "Untitled Deal"}
                          </div>
                          <div style={dealSubStyle}>
                            {[deal.city, deal.state].filter(Boolean).join(", ") || "—"}
                          </div>
                        </div>

                        <span
                          style={{
                            ...strengthBadgeStyle,
                            color: group.hex,
                            borderColor: `${group.hex}55`,
                            background: `${group.hex}14`,
                          }}
                        >
                          {getDealStrength(deal)}%
                        </span>
                      </div>

                      <div style={dealMetricGridStyle}>
                        <DealTile label="Seller" value={deal.owner_name || "—"} />
                        <DealTile label="Source" value={deal.lead_source || "—"} />
                        <DealTile label="Asking" value={formatMoney(deal.asking_price)} />
                        <DealTile label="ARV" value={formatMoney(deal.arv)} />
                        <DealTile label="MAO" value={formatMoney(deal.mao)} />
                        <DealTile label="Spread" value={formatMoney(deal.projected_spread)} />
                      </div>

                      <div style={dealNotesBarStyle}>
                        {deal.next_action || "Continue deal execution"}
                      </div>

                      <div style={dealActionRowStyle}>
                        <Link href={`/leads/${deal.id}`}>
                          <ActionButton compact>Open Workspace</ActionButton>
                        </Link>
                        <Link href="/pipeline">
                          <ActionButton compact>Pipeline</ActionButton>
                        </Link>
                        {deal.owner_phone_primary ? (
                          <a href={`tel:${deal.owner_phone_primary}`}>
                            <ActionButton compact>Call</ActionButton>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ))}
        </div>

        <div style={dealSideRailStyle}>
          <SectionCard
            title="Next Moves"
            subtitle="Highest-value execution actions right now."
          >
            <div style={insightStackStyle}>
              {nextMoves.map((item, index) => (
                <div key={`${item}-${index}`} style={insightRowStyle}>
                  <span style={goldDotStyle} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Blockers"
            subtitle="Things slowing deals down right now."
          >
            <div style={insightStackStyle}>
              {blockers.map((item, index) => (
                <div key={`${item}-${index}`} style={blockerRowStyle}>
                  <span style={warnDotStyle} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Stage Distribution"
            subtitle="Execution mix across active transactions."
          >
            <div style={distributionStackStyle}>
              {grouped.map((group) => {
                const pct = deals.length > 0 ? Math.round((group.items.length / deals.length) * 100) : 0

                return (
                  <div key={group.stage} style={distributionRowStyle}>
                    <div style={distributionRowTopStyle}>
                      <span style={distributionNameStyle}>{group.label}</span>
                      <span style={distributionPctStyle}>{pct}%</span>
                    </div>

                    <div style={distributionTrackStyle}>
                      <div
                        style={{
                          ...distributionFillStyle,
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${group.hex}, #d6a64b)`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}

function DealTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={dealTileStyle}>
      <div style={dealTileLabelStyle}>{label}</div>
      <div style={dealTileValueStyle}>{value}</div>
    </div>
  )
}

function DealMetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div style={{ ...metricCardStyle, borderColor: `${accent}40` }}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...metricValueStyle, color: accent }}>{value}</div>
    </div>
  )
}

const snapshotRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
}

const metricCardStyle: CSSProperties = {
  minHeight: 110,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.02)",
  padding: "14px 16px",
  display: "grid",
  gap: 10,
  alignContent: "start",
}

const metricLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--white-faint)",
}

const metricValueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 760,
  letterSpacing: "-0.04em",
}

const dealsLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: 16,
  alignItems: "start",
}

const dealBoardStyle: CSSProperties = {
  display: "grid",
  gap: 16,
}

const dealSideRailStyle: CSSProperties = {
  display: "grid",
  gap: 16,
}

const stageMiniBadgeStyle: CSSProperties = {
  minHeight: 28,
  padding: "0 10px",
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: 11,
  fontWeight: 700,
}

const dealStackStyle: CSSProperties = {
  display: "grid",
  gap: 12,
}

const dealCardStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: 16,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.02)",
}

const dealCardTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
}

const dealTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 760,
  letterSpacing: "-0.03em",
  color: "var(--white-hi)",
}

const dealSubStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "var(--white-soft)",
}

const strengthBadgeStyle: CSSProperties = {
  minHeight: 30,
  padding: "0 10px",
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: 11,
  fontWeight: 700,
}

const dealMetricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
}

const dealTileStyle: CSSProperties = {
  minHeight: 56,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.05)",
  background: "rgba(255,255,255,0.018)",
  padding: "10px 12px",
  display: "grid",
  gap: 4,
}

const dealTileLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--white-faint)",
}

const dealTileValueStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 650,
  color: "var(--white-hi)",
}

const dealNotesBarStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.05)",
  background: "rgba(255,255,255,0.018)",
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  fontSize: 12,
  color: "var(--white-soft)",
}

const dealActionRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
}

const insightStackStyle: CSSProperties = {
  display: "grid",
  gap: 10,
}

const insightRowStyle: CSSProperties = {
  minHeight: 54,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.05)",
  background: "rgba(255,255,255,0.02)",
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "var(--white-soft)",
  fontSize: 13,
  lineHeight: 1.45,
}

const blockerRowStyle: CSSProperties = {
  ...insightRowStyle,
}

const goldDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "var(--gold)",
  boxShadow: "0 0 12px rgba(214,166,75,0.35)",
  flexShrink: 0,
}

const warnDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "#ffb347",
  boxShadow: "0 0 12px rgba(255,179,71,0.35)",
  flexShrink: 0,
}

const distributionStackStyle: CSSProperties = {
  display: "grid",
  gap: 12,
}

const distributionRowStyle: CSSProperties = {
  display: "grid",
  gap: 7,
}

const distributionRowTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 12,
}

const distributionNameStyle: CSSProperties = {
  color: "var(--white-soft)",
  fontWeight: 600,
}

const distributionPctStyle: CSSProperties = {
  color: "var(--white-hi)",
  fontWeight: 700,
}

const distributionTrackStyle: CSSProperties = {
  height: 9,
  borderRadius: 999,
  overflow: "hidden",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.04)",
}

const distributionFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: 999,
}

const emptyStateStyle: CSSProperties = {
  minHeight: 110,
  display: "grid",
  placeItems: "center",
  borderRadius: 18,
  border: "1px dashed rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.015)",
  color: "var(--white-faint)",
  fontSize: 13,
}