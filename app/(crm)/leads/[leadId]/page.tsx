'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ActionButton from '@/components/ui/action-button'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import WorkspaceCanvas from '@/components/workspace-canvas'
import { supabase } from '@/lib/supabase'
import { computeLeadScores } from '@/lib/intelligence/lead-score-v2'
import { resolveField, resolveNumericField } from '@/lib/resolve-field'
import { FIELD_ALIASES } from '@/lib/field-aliases'
import { computeOwnershipYears } from '@/lib/compute-fields'

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
  stage?: string | null
  lead_status?: string | null
  deal_status?: string | null
  pipeline_stage?: string | null
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
  lead_intelligence?: Record<string, unknown> | null
  raw_import_data?: Record<string, unknown> | null
  source_columns?: Record<string, unknown> | null
}

const STAGE_OPTIONS = [
  { value: 'new_lead', label: 'New Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'appointment_set', label: 'Appointment Set' },
  { value: 'offer_sent', label: 'Offer Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
  { value: 'dead_lead', label: 'Dead / Archive' },
]

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

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function toText(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length ? text : null
}

function toBoolean(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value

  const text = String(value).trim().toLowerCase()

  if (
    ['1', 'true', 'yes', 'y', 'occupied', 'owner occupied', 'homestead', 'primary'].includes(text)
  ) {
    return true
  }

  if (
    ['0', 'false', 'no', 'n', 'vacant', 'non owner occupied', 'not owner occupied'].includes(text)
  ) {
    return false
  }

  return null
}

function debugBedroomSource(lead: LeadRecord) {
  const checks = [
    ['lead.bedrooms', lead.bedrooms],
    ['lead.lead_intelligence.bedrooms', (lead.lead_intelligence as any)?.bedrooms],
    ['lead.raw_import_data.bedrooms', (lead.raw_import_data as any)?.bedrooms],
    ['lead.raw_import_data.beds', (lead.raw_import_data as any)?.beds],
    ['lead.raw_import_data.bedroom_count', (lead.raw_import_data as any)?.bedroom_count],
    ['lead.raw_import_data.nbr_beds', (lead.raw_import_data as any)?.nbr_beds],
    ['lead.source_columns.bedrooms', (lead.source_columns as any)?.bedrooms],
    ['lead.source_columns.beds', (lead.source_columns as any)?.beds],
  ]

  return checks.find(([, value]) => value !== undefined && value !== null && value !== '') || null
}

export default function LeadWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const leadId = String(params?.leadId || '')
  const [lead, setLead] = useState<LeadRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLead() {
      if (!leadId) return

      setLoading(true)

      const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single()

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

  const normalizedLead = useMemo(() => {
    if (!lead) return null

    const beds = resolveNumericField(lead as any, FIELD_ALIASES.beds, null, {
      treatZeroAsMissing: true,
      min: 1,
    })

    const baths = resolveNumericField(lead as any, FIELD_ALIASES.baths, null, {
      treatZeroAsMissing: false,
      min: 0,
    })

    const sqft = resolveNumericField(lead as any, FIELD_ALIASES.sqft, null, {
      treatZeroAsMissing: true,
      min: 1,
    })

    const ownerName =
      toText(resolveField(lead as any, FIELD_ALIASES.ownerName)) ||
      toText((lead.lead_intelligence as any)?.owner_name) ||
      lead.owner_name

    const ownerOccupied =
      toBoolean(resolveField(lead as any, FIELD_ALIASES.ownerOccupied)) ??
      toBoolean((lead.lead_intelligence as any)?.owner_occupied) ??
      lead.owner_occupied

    const lastSaleDate =
      toText(resolveField(lead as any, FIELD_ALIASES.lastSaleDate)) ||
      toText((lead.lead_intelligence as any)?.last_sale_date) ||
      lead.last_sale_date

    const estimatedValue =
      toNumber(resolveField(lead as any, FIELD_ALIASES.estimatedValue)) ??
      toNumber((lead.lead_intelligence as any)?.house_value) ??
      toNumber((lead.lead_intelligence as any)?.estimated_value) ??
      toNumber((lead.lead_intelligence as any)?.market_value) ??
      lead.house_value ??
      lead.estimated_value ??
      lead.market_value

    const ownershipYears = computeOwnershipYears({
      ...lead,
      last_sale_date: lastSaleDate,
    })

    const currentStage =
      lead.status || lead.stage || lead.lead_status || lead.deal_status || lead.pipeline_stage || 'new_lead'

    return {
      ...lead,
      stage: currentStage,
      bedrooms: beds ?? null,
      bathrooms: baths ?? null,
      square_feet: sqft ?? null,
      owner_name: ownerName ?? null,
      owner_occupied: ownerOccupied,
      last_sale_date: lastSaleDate ?? null,
      ownership_length: ownershipYears ?? lead.ownership_length ?? null,
      resolved_value: estimatedValue ?? null,
      bed_debug_source: debugBedroomSource(lead),
    }
  }, [lead])

  const scores = useMemo(() => {
    if (!normalizedLead) return null
    return computeLeadScores(normalizedLead as any)
  }, [normalizedLead])

  async function handleUpdateStage(nextStage: string) {
    if (!leadId) return

    const payload = {
      status: nextStage,
      stage: nextStage,
      lead_status: nextStage,
      deal_status: nextStage,
      pipeline_stage: nextStage,
    }

    const { error } = await supabase.from('leads').update(payload).eq('id', leadId)

    if (error) {
      alert(`Failed to update stage: ${error.message}`)
      return
    }

    setLead((curr) => (curr ? { ...curr, ...payload } : null))
  }

  async function handleDeleteLead() {
    if (!leadId) return
    if (!confirm('Are you sure you want to permanently delete this lead?')) return

    const { error } = await supabase.from('leads').delete().eq('id', leadId)

    if (error) {
      alert(`Failed to delete lead: ${error.message}`)
      return
    }

    router.push('/leads')
  }

  if (loading) {
    return (
      <PageShell title="Lead Workspace" subtitle="Loading lead workspace...">
        <SectionCard title="Loading" subtitle="Pulling uploaded lead intelligence.">
          <div style={loadingBoxStyle}>
            <div style={spinnerStyle} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Retrieving property intelligence...
            </span>
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  if (!normalizedLead || !scores) {
    return (
      <PageShell title="Lead Workspace" subtitle="Lead could not be found.">
        <SectionCard title="Lead not found" subtitle="This record could not be loaded.">
          <Link href="/leads">
            <ActionButton tone="gold">Back to Leads</ActionButton>
          </Link>
        </SectionCard>
      </PageShell>
    )
  }

  const topValue =
    normalizedLead.resolved_value ??
    normalizedLead.house_value ??
    normalizedLead.estimated_value ??
    normalizedLead.market_value ??
    null

  const addressLine =
    [normalizedLead.city, normalizedLead.state, normalizedLead.zip].filter(Boolean).join(', ') ||
    'No city/state/zip'

  return (
    <PageShell
      title="Lead Workspace"
      subtitle="Imported property intelligence and deal thinking surface."
      actions={
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={normalizedLead.stage}
              onChange={(e) => handleUpdateStage(e.target.value)}
              style={workspaceSelectStyle}
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={optionStyle}>
                  Stage: {opt.label}
                </option>
              ))}
            </select>

            <ActionButton compact tone="danger" onClick={handleDeleteLead}>
              Delete Lead
            </ActionButton>
          </div>
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
            title={normalizedLead.property_address_1 || 'Unknown property'}
            subtitle={addressLine}
            actions={<span style={typeBadgeStyle}>{normalizedLead.lead_type || 'standard'}</span>}
          >
            <div style={heroSignalGridStyle}>
              <HeroSignal label="House Value" value={money(topValue)} tone="gold" />
              <HeroSignal label="Equity" value={money(normalizedLead.equity_amount)} tone="green" />
              <HeroSignal
                label="Mortgage Balance"
                value={money(normalizedLead.mortgage_balance)}
                tone="ice"
              />
              <HeroSignal
                label="Last Money In"
                value={money(normalizedLead.last_sale_amount)}
                tone="gold"
              />
              <HeroSignal
                label="Last Sale Date"
                value={normalizedLead.last_sale_date || '—'}
                tone="ice"
              />
              <HeroSignal label="Owner" value={normalizedLead.owner_name || '—'} tone="green" />
            </div>
          </SectionCard>

          <SectionCard
            title="Property Signals"
            subtitle="Promoted from uploaded data and used for scoring."
          >
            <div style={propertyGridStyle}>
              <InfoTile label="Lead Type" value={normalizedLead.lead_type || 'standard'} tone="gold" />
              <InfoTile label="APN" value={normalizedLead.apn || '—'} tone="ice" />
              <InfoTile label="County" value={normalizedLead.county || '—'} tone="green" />
              <InfoTile
                label="Beds / Baths"
                value={`${normalizedLead.bedrooms ?? '—'} / ${normalizedLead.bathrooms ?? '—'}`}
                tone="gold"
              />
              <InfoTile
                label="Square Feet"
                value={normalizedLead.square_feet ? String(normalizedLead.square_feet) : '—'}
                tone="ice"
              />
              <InfoTile
                label="Year Built"
                value={normalizedLead.year_built ? String(normalizedLead.year_built) : '—'}
                tone="green"
              />
              <InfoTile
                label="Ownership Length"
                value={normalizedLead.ownership_length ? `${normalizedLead.ownership_length} yrs` : '—'}
                tone="gold"
              />
              <InfoTile
                label="Occupied / Vacant"
                value={`${yn(normalizedLead.owner_occupied, 'Owner Occupied', 'Not Owner Occupied')}${normalizedLead.vacant === true ? ' · Vacant' : ''}`}
                tone="ice"
              />
              <InfoTile
                label="Default Amount"
                value={money(normalizedLead.default_amount)}
                tone="green"
              />
              <InfoTile
                label="Auction Date"
                value={normalizedLead.auction_date || '—'}
                tone="gold"
              />
              <InfoTile label="Lender" value={normalizedLead.lender_name || '—'} tone="ice" />
              <InfoTile
                label="Mailing Address"
                value={
                  [
                    normalizedLead.owner_mailing_address,
                    normalizedLead.owner_mailing_city,
                    normalizedLead.owner_mailing_state,
                    normalizedLead.owner_mailing_zip,
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
              <ScoreCard title="Overall Strength" detail={scores.overall} tone="gold" />
              <ScoreCard title="Motivation" detail={scores.motivation} tone="green" />
              <ScoreCard title="Contactability" detail={scores.contactability} tone="ice" />
              <ScoreCard title="Marketability" detail={scores.marketability} tone="gold" />
            </div>
          </SectionCard>

          <SectionCard
            title="Raw Uploaded Intelligence"
            subtitle="Verification layer from the import source."
          >
            <div style={rawWrapStyle}>
              <pre style={rawPreStyle}>
                {JSON.stringify(
                  {
                    bed_debug_source: normalizedLead.bed_debug_source,
                    lead_intelligence: normalizedLead.lead_intelligence || {},
                    raw_import_data: normalizedLead.raw_import_data || {},
                    source_columns: normalizedLead.source_columns || {},
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </SectionCard>
        </div>

        <div style={rightRailStyle}>
          <WorkspaceCanvas
            leadId={normalizedLead.id}
            leadTitle={normalizedLead.property_address_1 || 'Lead'}
          />
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
      ? { border: 'rgba(214,166,75,0.25)', bg: 'linear-gradient(180deg, rgba(30,24,14,0.8), rgba(12,10,6,0.9))', text: '#d6a64b' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.22)', bg: 'linear-gradient(180deg, rgba(16,22,30,0.8), rgba(6,10,14,0.9))', text: '#93c5fd' }
        : { border: 'rgba(74,222,128,0.22)', bg: 'linear-gradient(180deg, rgba(14,28,18,0.8), rgba(6,12,8,0.9))', text: '#4ade80' }

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
      ? { border: 'rgba(214,166,75,0.18)', bg: 'rgba(214,166,75,0.05)', text: '#f0ca7e' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.18)', bg: 'rgba(147,197,253,0.05)', text: '#dcecff' }
        : { border: 'rgba(74,222,128,0.18)', bg: 'rgba(74,222,128,0.05)', text: '#bbf7d0' }

  return (
    <div style={{ ...infoTileStyle, borderColor: palette.border, background: palette.bg }}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={{ ...infoValueStyle, color: palette.text }}>{value}</div>
    </div>
  )
}

function ScoreCard({
  title,
  detail,
  tone,
}: {
  title: string
  detail: { score: number; reason?: string | null }
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? { border: 'rgba(214,166,75,0.25)', bg: 'linear-gradient(180deg, rgba(28,22,12,0.85), rgba(8,6,3,0.95))', text: '#d6a64b' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.22)', bg: 'linear-gradient(180deg, rgba(14,20,28,0.85), rgba(4,8,12,0.95))', text: '#93c5fd' }
        : { border: 'rgba(74,222,128,0.22)', bg: 'linear-gradient(180deg, rgba(12,26,16,0.85), rgba(4,10,6,0.95))', text: '#4ade80' }

  return (
    <div style={{ ...scoreCardStyle, borderColor: palette.border, background: palette.bg }}>
      <div style={infoLabelStyle}>{title}</div>
      <div style={{ ...scoreValueStyle, color: palette.text }}>{detail.score}</div>
      <div style={scoreReasonStyle}>{detail.reason || 'No explanation provided.'}</div>
    </div>
  )
}

const workspaceSelectStyle: CSSProperties = {
  minHeight: 32,
  padding: '0 10px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  outline: 'none',
  cursor: 'pointer',
  border: '1px solid rgba(214,166,75,0.4)',
  background: 'rgba(214,166,75,0.12)',
  color: '#e0b84f',
}

const optionStyle: CSSProperties = {
  background: '#121212',
  color: '#ffffff',
}

const pageGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
  gap: 18,
  alignItems: 'start',
}

const leftRailStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
  minWidth: 0,
}

const rightRailStyle: CSSProperties = {
  minWidth: 0,
}

const heroSignalGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 10,
}

const propertyGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
}

const scoreGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
}

const heroSignalStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid transparent',
  padding: '12px 14px',
  display: 'grid',
  gap: 4,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

const infoTileStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid transparent',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const scoreCardStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid transparent',
  padding: '14px',
  display: 'grid',
  gap: 6,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

const typeBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 8,
  border: '1px solid rgba(214, 166, 75, 0.3)',
  background: 'rgba(214, 166, 75, 0.1)',
  color: '#d6a64b',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const infoLabelStyle: CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.42)',
}

const heroValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
}

const infoValueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 650,
  lineHeight: 1.35,
}

const scoreValueStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: '-0.02em',
}

const scoreReasonStyle: CSSProperties = {
  fontSize: 11.5,
  lineHeight: 1.4,
  color: 'rgba(255,255,255,0.55)',
}

const rawWrapStyle: CSSProperties = {
  maxHeight: 360,
  overflow: 'auto',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(0,0,0,0.4)',
}

const rawPreStyle: CSSProperties = {
  margin: 0,
  padding: 14,
  fontSize: 11.5,
  fontFamily: 'monospace',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  color: 'rgba(255,255,255,0.6)',
}

const loadingBoxStyle: CSSProperties = {
  minHeight: 180,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
}

const spinnerStyle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  border: '2px solid rgba(214, 166, 75, 0.2)',
  borderTopColor: '#d6a64b',
  animation: 'spin 0.8s linear infinite',
}
