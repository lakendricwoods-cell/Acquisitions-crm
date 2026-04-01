'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
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

type FilterKey =
  | 'all'
  | 'high'
  | 'missing-contact'
  | 'missing-market'
  | 'workable'

type ScoreType = 'overall' | 'motivation' | 'contactability' | 'marketability'

export default function LeadsMobile() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
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
      actions={
        <>
          <StatPill label="Total" value={stats.total} />
          <StatPill label="High" value={stats.highPriority} />
          <StatPill label="Workable" value={stats.workable} />
        </>
      }
    >
      <SectionCard
        title="Lead Control"
        subtitle="Mobile-ready view for searching, scanning, and opening leads fast."
      >
        <div style={mobileToolbarStyle}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, owner, phone, email, city..."
            className="crm-input"
            style={searchStyle}
          />

          <div style={chipRowStyle}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={filter === 'all' ? activeChipStyle : chipStyle}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('high')}
              style={filter === 'high' ? activeChipStyle : chipStyle}
            >
              High Priority
            </button>
            <button
              type="button"
              onClick={() => setFilter('workable')}
              style={filter === 'workable' ? activeChipStyle : chipStyle}
            >
              Workable
            </button>
            <button
              type="button"
              onClick={() => setFilter('missing-contact')}
              style={filter === 'missing-contact' ? activeChipStyle : chipStyle}
            >
              Missing Contact
            </button>
            <button
              type="button"
              onClick={() => setFilter('missing-market')}
              style={filter === 'missing-market' ? activeChipStyle : chipStyle}
            >
              Missing Market
            </button>
          </div>

          <div style={quickRowStyle}>
            <ActionButton
              compact
              tone="gold"
              onClick={() => setQuickAddOpen((prev) => !prev)}
            >
              {quickAddOpen ? 'Close Quick Add' : 'Quick Add Lead'}
            </ActionButton>
          </div>

          {quickAddOpen ? (
            <div style={quickAddGridStyle}>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Property address"
                className="crm-input"
                style={inputStyle}
              />
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Owner name"
                className="crm-input"
                style={inputStyle}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="crm-input"
                style={inputStyle}
              />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="crm-input"
                style={inputStyle}
              />
              <input
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="Asking price"
                className="crm-input"
                style={inputStyle}
              />

              <ActionButton tone="gold" onClick={handleQuickAdd} disabled={saving}>
                {saving ? 'Saving...' : 'Add Lead'}
              </ActionButton>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="crm-muted">Loading leads...</div>
        ) : filteredRows.length === 0 ? (
          <div className="crm-muted">No leads found.</div>
        ) : (
          <div style={cardListStyle}>
            {filteredRows.map(({ lead, scores }) => {
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

              const leadPhone = firstNonEmpty(lead.owner_phone_primary, lead.phone1)
              const leadEmail = firstNonEmpty(lead.owner_email, lead.email1)

              return (
                <Link key={lead.id} href={`/leads/${lead.id}`} style={cardLinkStyle}>
                  <article style={leadCardStyle}>
                    <div style={leadCardTopStyle}>
                      <div style={leadTitleWrapStyle}>
                        <div style={leadAddressStyle}>{leadAddress}</div>
                        <div style={leadLocationStyle}>
                          {leadLocation || 'No location data'}
                        </div>
                      </div>

                      <span
                        className="crm-badge"
                        style={{
                          borderColor: `${stageColor}55`,
                          color: stageColor,
                          background: `${stageColor}14`,
                        }}
                      >
                        {getStageLabel(stageValue)}
                      </span>
                    </div>

                    <div style={identityBlockStyle}>
                      <div style={identityLabelStyle}>Owner</div>
                      <div style={identityValueStyle}>
                        {lead.owner_name || 'Missing owner'}
                      </div>
                    </div>

                    <div style={contactGridStyle}>
                      <div style={contactCardStyle}>
                        <div style={miniKeyStyle}>Phone</div>
                        <div style={miniValueStyle}>{leadPhone || 'No phone'}</div>
                      </div>
                      <div style={contactCardStyle}>
                        <div style={miniKeyStyle}>Email</div>
                        <div style={miniValueStyle}>{leadEmail || 'No email'}</div>
                      </div>
                    </div>

                    <div style={scoreGridStyle}>
                      <ScorePill
                        label="Strength"
                        score={scores.overall.score}
                        tone="gold"
                      />
                      <ScorePill
                        label="Motivation"
                        score={scores.motivation.score}
                        tone="orange"
                      />
                      <ScorePill
                        label="Contact"
                        score={scores.contactability.score}
                        tone="blue"
                      />
                      <ScorePill
                        label="Market"
                        score={scores.marketability.score}
                        tone="green"
                      />
                    </div>

                    <div style={valuationGridStyle}>
                      <ValueCard
                        label="Price"
                        value={formatMoney(
                          lead.asking_price ?? lead.listing_price ?? null
                        )}
                      />
                      <ValueCard
                        label="ARV"
                        value={formatMoney(
                          lead.arv ?? lead.estimated_value ?? lead.market_value ?? null
                        )}
                      />
                    </div>

                    <div style={openRowStyle}>
                      <span style={openWorkspaceStyle}>Open Workspace</span>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}

function ScorePill({
  label,
  score,
  tone,
}: {
  label: string
  score: number
  tone: 'gold' | 'orange' | 'blue' | 'green'
}) {
  const tones = {
    gold: {
      background: 'rgba(214,166,75,0.12)',
      borderColor: 'rgba(214,166,75,0.26)',
      valueColor: '#e6be67',
    },
    orange: {
      background: 'rgba(245,158,11,0.12)',
      borderColor: 'rgba(245,158,11,0.26)',
      valueColor: '#ffb84d',
    },
    blue: {
      background: 'rgba(96,165,250,0.12)',
      borderColor: 'rgba(96,165,250,0.26)',
      valueColor: '#8fc1ff',
    },
    green: {
      background: 'rgba(34,197,94,0.12)',
      borderColor: 'rgba(34,197,94,0.26)',
      valueColor: '#7fe3a0',
    },
  }[tone]

  return (
    <div
      style={{
        ...scorePillStyle,
        background: tones.background,
        borderColor: tones.borderColor,
      }}
    >
      <div style={scorePillLabelStyle}>{label}</div>
      <div style={{ ...scorePillValueStyle, color: tones.valueColor }}>{score}</div>
    </div>
  )
}

function ValueCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={valueCardStyle}>
      <div style={miniKeyStyle}>{label}</div>
      <div style={valueCardValueStyle}>{value}</div>
    </div>
  )
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)
}

function humanizeScoreType(scoreType: ScoreType) {
  if (scoreType === 'overall') return 'Overall'
  if (scoreType === 'motivation') return 'Motivation'
  if (scoreType === 'contactability') return 'Contactability'
  return 'Marketability'
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
}

const mobileToolbarStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const searchStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
}

const chipRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  overflowY: 'hidden',
  paddingBottom: 2,
}

const chipStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 12px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.02)',
  color: 'rgba(255,255,255,0.74)',
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 700,
}

const activeChipStyle: CSSProperties = {
  ...chipStyle,
  border: '1px solid rgba(214,166,75,0.28)',
  background: 'rgba(214,166,75,0.12)',
  color: '#ffffff',
}

const quickRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
}

const quickAddGridStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 42,
}

const cardListStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const leadCardStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.985), rgba(0,0,0,1))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.02), 0 0 14px rgba(214,166,75,0.05)',
}

const leadCardTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
}

const leadTitleWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  minWidth: 0,
  flex: 1,
}

const leadAddressStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.08,
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '-0.03em',
  wordBreak: 'break-word',
}

const leadLocationStyle: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.4,
  color: 'rgba(255,255,255,0.52)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const identityBlockStyle: CSSProperties = {
  display: 'grid',
  gap: 3,
}

const identityLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.38)',
}

const identityValueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.2,
  wordBreak: 'break-word',
}

const contactGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const contactCardStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const miniKeyStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.4)',
}

const miniValueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.25,
  wordBreak: 'break-word',
}

const scoreGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const scorePillStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const scorePillLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.46)',
}

const scorePillValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1,
}

const valuationGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const valueCardStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const valueCardValueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#ffffff',
}

const openRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: 2,
}

const openWorkspaceStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#e0b84f',
}