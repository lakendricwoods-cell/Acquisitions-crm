'use client'

import LeadsMobile from '@/components/leads/leads-mobile'
import { useIsMobile } from '@/hooks/use-is-mobile'

export default function LeadsPage() {

  const isMobile = useIsMobile()

  // ✅ THIS MUST BE INSIDE FUNCTION
  if (isMobile) {
    return <LeadsMobile />
  }

  // ✅ DESKTOP UI BELOW
  return (
    <div>
      {/* your existing desktop UI */}
    </div>
  )
}

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import { supabase } from '@/lib/supabase'
import {
  computeLeadScores,
  type GenericLeadRecord,
} from '@/lib/intelligence/lead-score-v2'
import { getStageColor, getStageLabel } from '@/lib/ui/stage-colors'

type LeadRow = GenericLeadRecord & {
  id: string
  property_address_1?: string | null
  property_address?: string | null
  owner_name?: string | null
  owner_phone_primary?: string | null
  phone1?: string | null
  owner_email?: string | null
  email1?: string | null
  owner_mailing_address?: string | null
  city?: string | null
  property_city?: string | null
  state?: string | null
  property_state?: string | null
  zip?: string | null
  property_zip?: string | null
  status?: string | null
  stage?: string | null
  asking_price?: number | null
  listing_price?: number | null
  estimated_value?: number | null
  market_value?: number | null
  arv?: number | null
  days_on_market?: number | null
  beds?: number | null
  baths?: number | null
  square_feet?: number | null
  building_sqft?: number | null
  property_type?: string | null
  equity_estimate?: number | null
  equity_amount?: number | null
  equity_percent?: number | null
  occupancy_status?: string | null
  ownership_length?: number | null
  next_action?: string | null
  source_columns?: Record<string, unknown> | null
  created_at?: string
  heat_score?: number | null
  completeness_score?: number | null
  risk_label?: string | null
  repair_estimate_total?: number | null
  mao?: number | null
  projected_spread?: number | null
}

type ScoreType = 'overall' | 'motivation' | 'contactability' | 'marketability'

export default function LeadsPage() {
  const isMobile = useIsMobile()
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<
    'all' | 'high' | 'missing-contact' | 'missing-market' | 'workable'
  >('all')
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null)
  const [selectedScore, setSelectedScore] = useState<ScoreType>('overall')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const [address, setAddress] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [askingPrice, setAskingPrice] = useState('')
  const [saving, setSaving] = useState(false)

  const loadLeads = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load leads:', error)
      setLeads([])
      setLoading(false)
      return
    }

    setLeads((data as LeadRow[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadLeads()
  }, [])

  const rows = useMemo(() => {
    return leads.map((lead) => ({
      lead,
      scores: computeLeadScores(lead),
    }))
  }, [leads])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()

    return rows.filter(({ lead, scores }) => {
      const haystack = [
        lead.property_address_1,
        lead.property_address,
        lead.owner_name,
        lead.owner_phone_primary,
        lead.phone1,
        lead.owner_email,
        lead.email1,
        lead.city,
        lead.property_city,
        lead.state,
        lead.property_state,
        lead.zip,
        lead.property_zip,
        lead.status,
        lead.stage,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = q.length === 0 || haystack.includes(q)
      if (!matchesQuery) return false

      if (filter === 'high') return scores.overall.score >= 80
      if (filter === 'missing-contact') return scores.contactability.score <= 25
      if (filter === 'missing-market') return scores.marketability.score <= 25
      if (filter === 'workable') return scores.overall.score >= 45

      return true
    })
  }, [rows, query, filter])

  const stats = useMemo(() => {
    const totals = rows.map((item) => item.scores)

    return {
      total: rows.length,
      highPriority: totals.filter((item) => item.overall.score >= 80).length,
      workable: totals.filter((item) => item.overall.score >= 45).length,
      weakContact: totals.filter((item) => item.contactability.score <= 25).length,
    }
  }, [rows])

  const openScore = (lead: LeadRow, scoreType: ScoreType) => {
    setSelectedLead(lead)
    setSelectedScore(scoreType)
    setDrawerOpen(true)
  }

  const sendToWorkspaceCanvas = async () => {
    if (!selectedLead) return

    const scores = computeLeadScores(selectedLead)
    const detail =
      selectedScore === 'overall'
        ? scores.overall
        : selectedScore === 'motivation'
          ? scores.motivation
          : selectedScore === 'contactability'
            ? scores.contactability
            : scores.marketability

    const leadAddress =
      firstNonEmpty(selectedLead.property_address_1, selectedLead.property_address) || 'Lead'

    const leadPhone = firstNonEmpty(
      selectedLead.owner_phone_primary,
      selectedLead.phone1
    )
    const leadEmail = firstNonEmpty(selectedLead.owner_email, selectedLead.email1)
    const leadCity = firstNonEmpty(selectedLead.city, selectedLead.property_city)
    const leadState = firstNonEmpty(selectedLead.state, selectedLead.property_state)
    const leadZip = firstNonEmpty(selectedLead.zip, selectedLead.property_zip)
    const leadStage = firstNonEmpty(selectedLead.status, selectedLead.stage)

    const { error } = await supabase.from('workspace_canvas_blocks').insert({
      lead_id: selectedLead.id,
      block_type: 'score-analysis',
      title: `${humanizeScoreType(selectedScore)} Analysis`,
      body: `${leadAddress} — ${detail.label} (${detail.score}/100)`,
      payload: {
        scoreType: selectedScore,
        detail,
        leadSnapshot: {
          id: selectedLead.id,
          property_address_1: leadAddress,
          owner_name: selectedLead.owner_name ?? null,
          owner_phone_primary: leadPhone ?? null,
          owner_email: leadEmail ?? null,
          city: leadCity ?? null,
          state: leadState ?? null,
          zip: leadZip ?? null,
          status: leadStage ?? null,
        },
      },
      x: 24,
      y: 24,
      w: 360,
      h: 260,
    })

    if (error) {
      console.error('Failed to send block to workspace canvas:', error)
      alert(error.message)
      return
    }

    setDrawerOpen(false)
    alert('Sent to Workspace Canvas')
  }

  const handleQuickAdd = async () => {
    if (!address.trim()) {
      alert('Property address required')
      return
    }

    setSaving(true)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      setSaving(false)
      alert('You must be logged in')
      return
    }

    const baseLead = {
      property_address_1: address.trim(),
      owner_name: ownerName.trim() || null,
      owner_phone_primary: phone.trim() || null,
      city: city.trim() || null,
      asking_price: askingPrice ? Number(askingPrice) : null,
      status: 'new_lead',
      created_by_user_id: user.id,
      assigned_user_id: user.id,
      contact_attempts: 0,
      next_action: 'Enrich contact and market data',
    }

    const { error } = await supabase.from('leads').insert(baseLead)

    setSaving(false)

    if (error) {
      console.error('Failed to add lead:', error)
      alert(error.message)
      return
    }

    setAddress('')
    setOwnerName('')
    setPhone('')
    setCity('')
    setAskingPrice('')
    setQuickAddOpen(false)
    await loadLeads()
  }

  return (
    <PageShell
      title="Leads"
      subtitle="Excel-style control center with explainable lead scoring and workspace handoff."
      actions={
        <>
          <StatPill label="Total" value={stats.total} />
          <StatPill label="High Priority" value={stats.highPriority} />
          <StatPill label="Workable" value={stats.workable} />
          <StatPill label="Weak Contact" value={stats.weakContact} />
        </>
      }
    >
      <SectionCard
        title="Lead Control Center"
        subtitle="High scores now require both motivation potential and execution readiness."
      >
        <div style={toolbarStyle}>
          <div style={toolbarTopRowStyle}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search address, owner, phone, email, city..."
              style={searchStyle}
            />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ActionButton onClick={() => setQuickAddOpen((prev) => !prev)}>
                {quickAddOpen ? 'Close Quick Add' : 'Quick Add Lead'}
              </ActionButton>
            </div>
          </div>

          <div style={filterRowStyle}>
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </FilterButton>
            <FilterButton active={filter === 'high'} onClick={() => setFilter('high')}>
              High Priority
            </FilterButton>
            <FilterButton active={filter === 'workable'} onClick={() => setFilter('workable')}>
              Workable
            </FilterButton>
            <FilterButton
              active={filter === 'missing-contact'}
              onClick={() => setFilter('missing-contact')}
            >
              Missing Contact
            </FilterButton>
            <FilterButton
              active={filter === 'missing-market'}
              onClick={() => setFilter('missing-market')}
            >
              Missing Market
            </FilterButton>
          </div>

          {quickAddOpen ? (
            <div style={quickAddGridStyle}>
              <input
                placeholder="Property address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Owner name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Asking price"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                style={inputStyle}
              />
              <ActionButton tone="gold" onClick={handleQuickAdd}>
                {saving ? 'Saving...' : 'Add Lead'}
              </ActionButton>
            </div>
          ) : null}
        </div>

        <div style={gridWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Lead</th>
                <th style={thStyle}>Owner</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Stage</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>ARV</th>
                <th style={thStyle}>Strength</th>
                <th style={thStyle}>Motivation</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Market</th>
                <th style={thStyle}>Workspace</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={emptyCellStyle}>
                    Loading leads...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} style={emptyCellStyle}>
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ lead, scores }) => {
                  const stageValue = firstNonEmpty(lead.status, lead.stage, 'new_lead')
                  const stageColor = getStageColor(stageValue)
                  const leadAddress =
                    firstNonEmpty(lead.property_address_1, lead.property_address) ||
                    'Unknown property'
                  const leadLocation = [
                    firstNonEmpty(lead.city, lead.property_city),
                    firstNonEmpty(lead.state, lead.property_state),
                    firstNonEmpty(lead.zip, lead.property_zip),
                  ]
                    .filter(Boolean)
                    .join(', ')

                  const leadPhone = firstNonEmpty(
                    lead.owner_phone_primary,
                    lead.phone1
                  )
                  const leadEmail = firstNonEmpty(lead.owner_email, lead.email1)

                  return (
                    <tr key={lead.id} style={rowStyle}>
                      <td style={tdStyle}>
                        <div style={leadTitleStyle}>{leadAddress}</div>
                        <div style={subTextStyle}>
                          {leadLocation || 'No location data'}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div>
                          {lead.owner_name || (
                            <span style={mutedTextStyle}>Missing owner</span>
                          )}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div>
                          {leadPhone || <span style={mutedTextStyle}>No phone</span>}
                        </div>
                        <div style={subTextStyle}>{leadEmail || 'No email'}</div>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            ...stagePillStyle,
                            background: stageColor.softBg,
                            borderColor: stageColor.border,
                            color: stageColor.hex,
                          }}
                        >
                          {getStageLabel(stageValue)}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {formatMoney(
                          lead.asking_price ?? lead.listing_price ?? null
                        )}
                      </td>

                      <td style={tdStyle}>
                        {formatMoney(
                          lead.arv ?? lead.estimated_value ?? lead.market_value ?? null
                        )}
                      </td>

                      <td style={tdStyle}>
                        <ScorePill
                          label="Strength"
                          value={scores.overall.score}
                          tone="gold"
                          onClick={() => openScore(lead, 'overall')}
                        />
                      </td>

                      <td style={tdStyle}>
                        <ScorePill
                          label="Motivation"
                          value={scores.motivation.score}
                          tone="amber"
                          onClick={() => openScore(lead, 'motivation')}
                        />
                      </td>

                      <td style={tdStyle}>
                        <ScorePill
                          label="Contact"
                          value={scores.contactability.score}
                          tone="ice"
                          onClick={() => openScore(lead, 'contactability')}
                        />
                      </td>

                      <td style={tdStyle}>
                        <ScorePill
                          label="Market"
                          value={scores.marketability.score}
                          tone="green"
                          onClick={() => openScore(lead, 'marketability')}
                        />
                      </td>

                      <td style={tdStyle}>
                        <Link href={`/leads/${lead.id}`}>
                          <ActionButton tone="gold">Open Workspace</ActionButton>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {drawerOpen && selectedLead ? (
        <ScoreDrawer
          lead={selectedLead}
          scoreType={selectedScore}
          onClose={() => setDrawerOpen(false)}
          onSendToCanvas={sendToWorkspaceCanvas}
        />
      ) : null}
    </PageShell>
  )
}

function ScoreDrawer({
  lead,
  scoreType,
  onClose,
  onSendToCanvas,
}: {
  lead: LeadRow
  scoreType: ScoreType
  onClose: () => void
  onSendToCanvas: () => void
}) {
  const scores = computeLeadScores(lead)
  const detail =
    scoreType === 'overall'
      ? scores.overall
      : scoreType === 'motivation'
        ? scores.motivation
        : scoreType === 'contactability'
          ? scores.contactability
          : scores.marketability

  const leadAddress =
    firstNonEmpty(lead.property_address_1, lead.property_address) ||
    'Unknown property'

  return (
    <div style={drawerOverlayStyle}>
      <div style={drawerBackdropStyle} onClick={onClose} />
      <div style={drawerPanelStyle}>
        <div style={drawerHeaderStyle}>
          <div>
            <div style={drawerEyebrowStyle}>Score Detail</div>
            <div style={drawerTitleStyle}>{humanizeScoreType(scoreType)}</div>
            <div style={drawerSubStyle}>{leadAddress}</div>
          </div>

          <button style={ghostCloseStyle} onClick={onClose}>
            Close
          </button>
        </div>

        <div style={scoreHeroStyle}>
          <div style={heroScoreStyle}>{detail.score}</div>
          <div>
            <div style={heroLabelStyle}>{detail.label}</div>
            <div style={heroInterpretStyle}>{detail.interpretation}</div>
          </div>
        </div>

        <MiniGraph
          overall={scores.overall.score}
          motivation={scores.motivation.score}
          contact={scores.contactability.score}
          market={scores.marketability.score}
        />

        <DrawerSection title="Why it scored this way" items={detail.positives} />
        <DrawerSection title="What is missing" items={detail.missing} />
        <DrawerSection title="What would improve it" items={detail.improvements} />
        <DrawerSection title="System concerns" items={detail.concerns} />
        <FieldsSection fields={detail.fields} />

        <div style={drawerActionsStyle}>
          <ActionButton tone="gold" onClick={onSendToCanvas}>
            Send to Workspace Canvas
          </ActionButton>

          <Link href={`/leads/${lead.id}`}>
            <ActionButton>Open Lead Workspace</ActionButton>
          </Link>
        </div>
      </div>
    </div>
  )
}

function MiniGraph({
  overall,
  motivation,
  contact,
  market,
}: {
  overall: number
  motivation: number
  contact: number
  market: number
}) {
  return (
    <div style={miniGraphWrapStyle}>
      <MiniGraphRow label="Strength" value={overall} />
      <MiniGraphRow label="Motivation" value={motivation} />
      <MiniGraphRow label="Contact" value={contact} />
      <MiniGraphRow label="Market" value={market} />
    </div>
  )
}

function MiniGraphRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={miniGraphMetaStyle}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={miniTrackStyle}>
        <div style={{ ...miniFillStyle, width: `${value}%` }} />
      </div>
    </div>
  )
}

function DrawerSection({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  return (
    <div style={drawerCardStyle}>
      <div style={drawerCardTitleStyle}>{title}</div>
      {items.length === 0 ? (
        <div style={drawerMutedStyle}>No data yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((item, index) => (
            <div key={`${title}-${index}`} style={drawerItemStyle}>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FieldsSection({
  fields,
}: {
  fields: Array<{ key: string; value: string }>
}) {
  return (
    <div style={drawerCardStyle}>
      <div style={drawerCardTitleStyle}>Fields evaluated</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {fields.map((field, index) => (
          <div key={`${field.key}-${index}`} style={fieldRowStyle}>
            <div style={fieldNameStyle}>{field.key}</div>
            <div style={fieldValueStyle}>{field.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...filterButtonStyle,
        background: active ? 'rgba(201,163,78,0.14)' : 'rgba(255,255,255,0.04)',
        borderColor: active ? 'rgba(201,163,78,0.28)' : 'rgba(255,255,255,0.08)',
        color: active ? '#f4ddaa' : 'rgba(255,255,255,0.72)',
      }}
    >
      {children}
    </button>
  )
}

function ScorePill({
  label,
  value,
  tone,
  onClick,
}: {
  label: string
  value: number
  tone: 'gold' | 'amber' | 'ice' | 'green'
  onClick: () => void
}) {
  const palette =
    tone === 'gold'
      ? {
          border: 'rgba(201,163,78,0.25)',
          bg: 'rgba(201,163,78,0.12)',
          text: '#f4ddaa',
        }
      : tone === 'amber'
        ? {
            border: 'rgba(245,158,11,0.25)',
            bg: 'rgba(245,158,11,0.12)',
            text: '#f6d08d',
          }
        : tone === 'ice'
          ? {
              border: 'rgba(147,197,253,0.25)',
              bg: 'rgba(147,197,253,0.12)',
              text: '#dcecff',
            }
          : {
              border: 'rgba(74,222,128,0.25)',
              bg: 'rgba(74,222,128,0.12)',
              text: '#cef8da',
            }

  return (
    <button
      onClick={onClick}
      style={{
        ...scorePillStyle,
        borderColor: palette.border,
        background: palette.bg,
        color: palette.text,
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  )
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num)
}

function humanizeScoreType(type: ScoreType) {
  if (type === 'overall') return 'Overall Strength'
  if (type === 'motivation') return 'Motivation'
  if (type === 'contactability') return 'Contactability'
  return 'Marketability'
}

const toolbarStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  marginBottom: 18,
}

const toolbarTopRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
}

const searchStyle: React.CSSProperties = {
  height: 48,
  minWidth: 320,
  flex: 1,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'white',
  padding: '0 14px',
}

const filterRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const filterButtonStyle: React.CSSProperties = {
  height: 38,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  padding: '0 14px',
}

const quickAddGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  padding: 14,
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
}

const inputStyle: React.CSSProperties = {
  height: 46,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'white',
  padding: '0 12px',
}

const gridWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 26,
  border: '1px solid rgba(255,255,255,0.08)',
  background:
    'linear-gradient(180deg, rgba(12,12,12,0.9) 0%, rgba(7,7,7,0.88) 100%)',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 1400,
  borderCollapse: 'collapse',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '16px 14px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: 'rgba(255,255,255,0.42)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  position: 'sticky',
  top: 0,
}

const rowStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

const tdStyle: React.CSSProperties = {
  padding: '16px 14px',
  color: 'rgba(255,255,255,0.88)',
  verticalAlign: 'top',
}

const emptyCellStyle: React.CSSProperties = {
  padding: 28,
  textAlign: 'center',
  color: 'rgba(255,255,255,0.5)',
}

const leadTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  letterSpacing: '-0.02em',
}

const subTextStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
}

const mutedTextStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.35)',
}

const stagePillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 32,
  padding: '0 12px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 12,
  fontWeight: 700,
}

const scorePillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minWidth: 118,
  gap: 10,
  height: 38,
  padding: '0 12px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  cursor: 'pointer',
}

const drawerOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
}

const drawerBackdropStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(6px)',
}

const drawerPanelStyle: React.CSSProperties = {
  width: 'min(100%, 560px)',
  height: '100%',
  overflowY: 'auto',
  padding: 22,
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  background:
    'linear-gradient(180deg, rgba(12,12,12,0.96) 0%, rgba(7,7,7,0.95) 100%)',
  color: 'white',
}

const drawerHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
}

const drawerEyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
}

const drawerTitleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.03em',
}

const drawerSubStyle: React.CSSProperties = {
  marginTop: 8,
  color: 'rgba(255,255,255,0.52)',
  fontSize: 14,
}

const ghostCloseStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.75)',
  padding: '0 14px',
}

const scoreHeroStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  marginTop: 18,
  marginBottom: 18,
  padding: 18,
  borderRadius: 22,
  border: '1px solid rgba(201,163,78,0.18)',
  background: 'rgba(201,163,78,0.08)',
}

const heroScoreStyle: React.CSSProperties = {
  width: 84,
  height: 84,
  borderRadius: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 30,
  fontWeight: 800,
  background: 'rgba(255,255,255,0.04)',
}

const heroLabelStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
}

const heroInterpretStyle: React.CSSProperties = {
  marginTop: 8,
  color: 'rgba(255,255,255,0.72)',
  lineHeight: 1.55,
}

const miniGraphWrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 16,
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  marginBottom: 18,
}

const miniGraphMetaStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 12,
  color: 'rgba(255,255,255,0.62)',
}

const miniTrackStyle: React.CSSProperties = {
  height: 8,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.08)',
  overflow: 'hidden',
}

const miniFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background:
    'linear-gradient(90deg, rgba(201,163,78,0.88) 0%, rgba(255,224,155,0.94) 100%)',
}

const drawerCardStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 16,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
}

const drawerCardTitleStyle: React.CSSProperties = {
  marginBottom: 10,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.48)',
}

const drawerItemStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.82)',
  lineHeight: 1.5,
  fontSize: 14,
}

const drawerMutedStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: 14,
}

const drawerActionsStyle: React.CSSProperties = {
  marginTop: 18,
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
}

const fieldRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  padding: 10,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
}

const fieldNameStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: 12,
}

const fieldValueStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.86)',
  fontSize: 12,
  textAlign: 'right',
}