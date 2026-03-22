'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import WorkspaceCanvas from '@/components/workspace-canvas'
import { supabase } from '@/lib/supabase'
import { computeLeadScores } from '@/lib/intelligence/lead-score-v2'

type LeadRecord = {
  id: string
  property_address_1?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  county?: string | null
  owner_name?: string | null
  owner_mailing_address?: string | null
  owner_mailing_city?: string | null
  owner_mailing_state?: string | null
  owner_mailing_zip?: string | null
  property_type?: string | null
  property_use?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  square_feet?: number | null
  year_built?: number | null
  apn?: string | null
  status?: string | null
  lead_type?: string | null
  house_value?: number | null
  estimated_value?: number | null
  market_value?: number | null
  equity_amount?: number | null
  equity_percent?: number | null
  mortgage_balance?: number | null
  last_sale_amount?: number | null
  last_sale_date?: string | null
  default_amount?: number | null
  auction_date?: string | null
  lender_name?: string | null
  ownership_length?: number | null
  owner_occupied?: boolean | null
  vacant?: boolean | null
  raw_import_data?: Record<string, unknown> | null
  source_columns?: Record<string, unknown> | null
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function yn(value: boolean | null | undefined, positive = 'Yes', negative = 'No') {
  if (value === null || value === undefined) return '—'
  return value ? positive : negative
}

export default function LeadWorkspacePage() {
  const params = useParams()
  const leadId = String(params?.leadId || '')
  const [lead, setLead] = useState<LeadRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLead() {
      if (!leadId) return

      setLoading(true)

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) {
        console.error(error)
        setLead(null)
        setLoading(false)
        return
      }

      setLead(data as LeadRecord)
      setLoading(false)
    }

    void loadLead()
  }, [leadId])

  const scores = useMemo(() => {
    if (!lead) return null
    return computeLeadScores(lead as any)
  }, [lead])

  if (loading) {
    return (
      <PageShell title="Lead Workspace" subtitle="Loading lead workspace...">
        <SectionCard title="Loading" subtitle="Pulling uploaded lead intelligence.">
          <div className="crm-muted">Loading...</div>
        </SectionCard>
      </PageShell>
    )
  }

  if (!lead || !scores) {
    return (
      <PageShell title="Lead Workspace" subtitle="Lead could not be found.">
        <SectionCard title="Lead not found" subtitle="This record could not be loaded.">
          <Link href="/leads">
            <ActionButton>Back to Leads</ActionButton>
          </Link>
        </SectionCard>
      </PageShell>
    )
  }

  const topValue = lead.house_value ?? lead.estimated_value ?? lead.market_value ?? null
  const addressLine =
    [lead.city, lead.state, lead.zip].filter(Boolean).join(', ') || 'No city/state/zip'

  return (
    <PageShell
      title="Lead Workspace"
      subtitle="Imported property intelligence and deal thinking surface."
      actions={
        <>
          <StatPill label="Strength" value={scores.overall.score} />
          <StatPill label="Motivation" value={scores.motivation.score} />
          <StatPill label="Contact" value={scores.contactability.score} />
          <StatPill label="Market" value={scores.marketability.score} />
        </>
      }
    >
      <div style={pageGridStyle}>
        <div style={leftRailStyle}>
          <SectionCard
            title={lead.property_address_1 || 'Unknown property'}
            subtitle={addressLine}
            actions={
              <span className="crm-badge soft">
                {lead.lead_type || 'standard'}
              </span>
            }
          >
            <div style={heroSignalGridStyle}>
              <HeroSignal
                label="House Value"
                value={money(topValue)}
                tone="gold"
              />
              <HeroSignal
                label="Equity"
                value={money(lead.equity_amount)}
                tone="green"
              />
              <HeroSignal
                label="Mortgage Balance"
                value={money(lead.mortgage_balance)}
                tone="ice"
              />
              <HeroSignal
                label="Last Money In"
                value={money(lead.last_sale_amount)}
                tone="gold"
              />
              <HeroSignal
                label="Last Sale Date"
                value={lead.last_sale_date || '—'}
                tone="ice"
              />
              <HeroSignal
                label="Owner"
                value={lead.owner_name || '—'}
                tone="green"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Property Signals"
            subtitle="Promoted from uploaded data and used for scoring."
          >
            <div style={propertyGridStyle}>
              <InfoTile label="Lead Type" value={lead.lead_type || 'standard'} tone="gold" />
              <InfoTile label="APN" value={lead.apn || '—'} tone="ice" />
              <InfoTile label="County" value={lead.county || '—'} tone="green" />
              <InfoTile
                label="Beds / Baths"
                value={`${lead.bedrooms ?? '—'} / ${lead.bathrooms ?? '—'}`}
                tone="gold"
              />
              <InfoTile
                label="Square Feet"
                value={lead.square_feet ? String(lead.square_feet) : '—'}
                tone="ice"
              />
              <InfoTile
                label="Year Built"
                value={lead.year_built ? String(lead.year_built) : '—'}
                tone="green"
              />
              <InfoTile
                label="Ownership Length"
                value={lead.ownership_length ? `${lead.ownership_length} yrs` : '—'}
                tone="gold"
              />
              <InfoTile
                label="Occupied / Vacant"
                value={`${yn(lead.owner_occupied, 'Owner Occupied', 'Not Owner Occupied')}${lead.vacant === true ? ' · Vacant' : ''}`}
                tone="ice"
              />
              <InfoTile
                label="Default Amount"
                value={money(lead.default_amount)}
                tone="green"
              />
              <InfoTile
                label="Auction Date"
                value={lead.auction_date || '—'}
                tone="gold"
              />
              <InfoTile
                label="Lender"
                value={lead.lender_name || '—'}
                tone="ice"
              />
              <InfoTile
                label="Mailing Address"
                value={
                  [
                    lead.owner_mailing_address,
                    lead.owner_mailing_city,
                    lead.owner_mailing_state,
                    lead.owner_mailing_zip,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'
                }
                tone="green"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Score Summary"
            subtitle="These are based on the imported fields now visible above."
          >
            <div style={scoreGridStyle}>
              <ScoreCard
                title="Overall Strength"
                detail={scores.overall}
                tone="gold"
              />
              <ScoreCard
                title="Motivation"
                detail={scores.motivation}
                tone="green"
              />
              <ScoreCard
                title="Contactability"
                detail={scores.contactability}
                tone="ice"
              />
              <ScoreCard
                title="Marketability"
                detail={scores.marketability}
                tone="gold"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Raw Uploaded Intelligence"
            subtitle="Verification layer from the import source."
          >
            <div style={rawWrapStyle}>
              <pre style={rawPreStyle}>
                {JSON.stringify(lead.raw_import_data || lead.source_columns || {}, null, 2)}
              </pre>
            </div>
          </SectionCard>
        </div>

        <div style={rightRailStyle}>
          <WorkspaceCanvas leadId={lead.id} leadTitle={lead.property_address_1 || 'Lead'} />
        </div>
      </div>
    </PageShell>
  )
}

function HeroSignal({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? { border: 'rgba(214,166,75,0.22)', bg: 'rgba(214,166,75,0.09)', text: '#f3d899' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.22)', bg: 'rgba(147,197,253,0.09)', text: '#dcecff' }
        : { border: 'rgba(74,222,128,0.22)', bg: 'rgba(74,222,128,0.09)', text: '#d8ffe6' }

  return (
    <div style={{ ...heroSignalStyle, borderColor: palette.border, background: palette.bg }}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={{ ...heroValueStyle, color: palette.text }}>{value}</div>
    </div>
  )
}

function InfoTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? { border: 'rgba(214,166,75,0.18)', bg: 'rgba(214,166,75,0.07)' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.18)', bg: 'rgba(147,197,253,0.07)' }
        : { border: 'rgba(74,222,128,0.18)', bg: 'rgba(74,222,128,0.07)' }

  return (
    <div style={{ ...tileStyle, borderColor: palette.border, background: palette.bg }}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={tileValueStyle}>{value}</div>
    </div>
  )
}

function ScoreCard({
  title,
  detail,
  tone,
}: {
  title: string
  detail: { score: number; label: string; interpretation: string }
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? { border: 'rgba(214,166,75,0.18)', bg: 'rgba(214,166,75,0.07)', text: '#f3d899' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.18)', bg: 'rgba(147,197,253,0.07)', text: '#dcecff' }
        : { border: 'rgba(74,222,128,0.18)', bg: 'rgba(74,222,128,0.07)', text: '#d8ffe6' }

  return (
    <div style={{ ...scoreCardStyle, borderColor: palette.border, background: palette.bg }}>
      <div style={infoLabelStyle}>{title}</div>
      <div style={{ ...scoreValueStyle, color: palette.text }}>{detail.score}</div>
      <div style={scoreLabelStyle}>{detail.label}</div>
      <div style={scoreInterpretationStyle}>{detail.interpretation}</div>
    </div>
  )
}

const pageGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.08fr) minmax(430px, 0.92fr)',
  gap: 16,
}

const leftRailStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const rightRailStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroSignalGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
}

const heroSignalStyle: CSSProperties = {
  padding: 14,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
}

const heroValueStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--white-hi)',
}

const propertyGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}

const tileStyle: CSSProperties = {
  padding: 12,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
}

const infoLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--white-faint)',
  marginBottom: 8,
}

const tileValueStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 700,
  color: 'var(--white-hi)',
}

const scoreGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}

const scoreCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
}

const scoreValueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
}

const scoreLabelStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--white-hi)',
}

const scoreInterpretationStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--white-soft)',
}

const rawWrapStyle: CSSProperties = {
  borderRadius: 16,
  overflow: 'auto',
  background: 'rgba(0,0,0,0.24)',
  border: '1px solid rgba(255,255,255,0.06)',
  maxHeight: 420,
}

const rawPreStyle: CSSProperties = {
  margin: 0,
  padding: 14,
  fontSize: 11,
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.82)',
}