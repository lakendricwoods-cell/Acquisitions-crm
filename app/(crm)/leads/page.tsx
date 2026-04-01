'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import { supabase } from '@/lib/supabase'

type LeadRow = {
  id: string
  property_address_1?: string | null
  property_address?: string | null
  owner_name?: string | null
  owner_phone_primary?: string | null
  phone1?: string | null
  owner_email?: string | null
  email1?: string | null
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
  market_value?: number | null
  estimated_value?: number | null
  arv?: number | null
  created_at?: string | null
}

type FilterKey = 'all' | 'high' | 'workable' | 'missing-contact' | 'missing-market'

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
}

function titleCase(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function getLeadStage(lead: LeadRow) {
  return firstNonEmpty(lead.status, lead.stage, 'new_lead') || 'new_lead'
}

function getStageTone(stage: string) {
  const normalized = stage.toLowerCase()

  if (normalized.includes('contract')) return '#4ade80'
  if (normalized.includes('contact')) return '#f59e0b'
  if (normalized.includes('follow')) return '#8b5cf6'
  if (normalized.includes('appoint')) return '#38bdf8'
  if (normalized.includes('offer')) return '#fbbf24'
  if (normalized.includes('dead')) return '#94a3b8'

  return '#e0b84f'
}

function getMarketValue(lead: LeadRow) {
  return lead.market_value ?? lead.estimated_value ?? lead.asking_price ?? lead.listing_price ?? null
}

function getArvValue(lead: LeadRow) {
  return lead.arv ?? null
}

function getPhone(lead: LeadRow) {
  return firstNonEmpty(lead.owner_phone_primary, lead.phone1) || null
}

function getEmail(lead: LeadRow) {
  return firstNonEmpty(lead.owner_email, lead.email1) || null
}

function computeContactScore(lead: LeadRow) {
  let score = 15
  if (lead.owner_name) score += 25
  if (getPhone(lead)) score += 45
  if (getEmail(lead)) score += 15
  return Math.min(100, score)
}

function computeMarketScore(lead: LeadRow) {
  let score = 20
  if (getMarketValue(lead) != null) score += 40
  if (getArvValue(lead) != null) score += 25
  if (firstNonEmpty(lead.city, lead.property_city)) score += 10
  if (firstNonEmpty(lead.state, lead.property_state)) score += 5
  return Math.min(100, score)
}

function computeMotivationScore(lead: LeadRow) {
  let score = 55
  if (lead.asking_price != null) score += 10
  if (lead.status || lead.stage) score += 10
  if (lead.owner_name) score += 5
  return Math.min(100, score)
}

function computeStrengthScore(lead: LeadRow) {
  const contact = computeContactScore(lead)
  const market = computeMarketScore(lead)
  const motivation = computeMotivationScore(lead)
  const readiness = firstNonEmpty(lead.property_address_1, lead.property_address) ? 85 : 40

  return Math.round(
    contact * 0.3 +
      market * 0.25 +
      motivation * 0.2 +
      readiness * 0.15 +
      market * 0.1
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth <= 900)
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  useEffect(() => {
    async function loadLeads() {
      setLoading(true)

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load leads:', error)
        setLeads([])
      } else {
        setLeads((data as LeadRow[]) || [])
      }

      setLoading(false)
    }

    void loadLeads()
  }, [])

  const rows = useMemo(() => {
    return leads.map((lead) => {
      const stage = getLeadStage(lead)
      return {
        lead,
        address:
          firstNonEmpty(lead.property_address_1, lead.property_address) || 'Unknown property',
        location:
          [
            firstNonEmpty(lead.city, lead.property_city),
            firstNonEmpty(lead.state, lead.property_state),
            firstNonEmpty(lead.zip, lead.property_zip),
          ]
            .filter(Boolean)
            .join(', ') || 'Location pending',
        owner: lead.owner_name || 'Unknown owner',
        phone: getPhone(lead) || 'No phone',
        email: getEmail(lead) || 'No email',
        stage,
        stageLabel: titleCase(stage),
        stageColor: getStageTone(stage),
        priceText: formatMoney(getMarketValue(lead)),
        arvText: formatMoney(getArvValue(lead)),
        strength: computeStrengthScore(lead),
        motivation: computeMotivationScore(lead),
        contact: computeContactScore(lead),
        market: computeMarketScore(lead),
      }
    })
  }, [leads])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [
        row.address,
        row.location,
        row.owner,
        row.phone,
        row.email,
        row.stageLabel,
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = !q || haystack.includes(q)
      if (!matchesQuery) return false

      if (filter === 'high') return row.strength >= 80
      if (filter === 'workable') return row.strength >= 60
      if (filter === 'missing-contact') return row.contact < 60
      if (filter === 'missing-market') return row.market < 70

      return true
    })
  }, [rows, query, filter])

  const stats = useMemo(() => {
    return {
      total: rows.length,
      highPriority: rows.filter((row) => row.strength >= 80).length,
      workable: rows.filter((row) => row.strength >= 60).length,
      weakContact: rows.filter((row) => row.contact < 60).length,
    }
  }, [rows])

  return (
    <PageShell
      title="Leads"
      subtitle={
        isMobile
          ? 'Mobile-ready lead list for fast scanning and one-tap workspace access.'
          : 'Control center for searching, filtering, and opening the right lead fast.'
      }
      actions={
        <>
          <StatPill label="Total" value={stats.total} />
          <StatPill label="High Priority" value={stats.highPriority} />
          <StatPill label="Workable" value={stats.workable} />
          <StatPill label="Weak Contact" value={stats.weakContact} />
          {!isMobile ? (
            <Link href="/imports">
              <ActionButton compact tone="gold">Import</ActionButton>
            </Link>
          ) : null}
        </>
      }
    >
      <SectionCard
        title="Lead Control Center"
        subtitle={
          isMobile
            ? 'Search and open leads without pinching or zooming.'
            : 'Search and filter leads across the desktop table or mobile card list.'
        }
      >
        <div style={toolbarStyle}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="crm-input"
            placeholder="Search address, owner, phone, email, city..."
            style={searchStyle}
          />

          <div style={filterRowStyle}>
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
        </div>

        {loading ? (
          <div className="crm-muted">Loading leads...</div>
        ) : filteredRows.length === 0 ? (
          <div className="crm-muted">No leads found.</div>
        ) : isMobile ? (
          <div style={mobileListStyle}>
            {filteredRows.map((row) => (
              <Link key={row.lead.id} href={`/leads/${row.lead.id}`} style={cardLinkStyle}>
                <article style={mobileCardStyle}>
                  <div style={mobileCardTopStyle}>
                    <div style={mobileAddressWrapStyle}>
                      <div style={mobileAddressStyle}>{row.address}</div>
                      <div style={mobileSubStyle}>{row.location}</div>
                    </div>

                    <span
                      style={{
                        ...stageBadgeStyle,
                        color: row.stageColor,
                        borderColor: `${row.stageColor}55`,
                        background: `${row.stageColor}14`,
                      }}
                    >
                      {row.stageLabel}
                    </span>
                  </div>

                  <div style={infoBlockStyle}>
                    <div style={miniKeyStyle}>Owner</div>
                    <div style={mobileValueStyle}>{row.owner}</div>
                  </div>

                  <div style={infoBlockStyle}>
                    <div style={miniKeyStyle}>Contact</div>
                    <div style={mobileValueStyle}>{row.phone}</div>
                  </div>

                  <div style={scoreGridStyle}>
                    <ScorePill label="Strength" score={row.strength} tone="gold" />
                    <ScorePill label="Motivation" score={row.motivation} tone="orange" />
                    <ScorePill label="Contact" score={row.contact} tone="blue" />
                    <ScorePill label="Market" score={row.market} tone="green" />
                  </div>

                  <div style={valueGridStyle}>
                    <MiniValueCard label="Price" value={row.priceText} />
                    <MiniValueCard label="ARV" value={row.arvText} />
                  </div>

                  <div style={mobileActionRowStyle}>
                    <span style={openWorkspaceStyle}>Open Workspace</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Owner</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Price</th>
                  <th>ARV</th>
                  <th>Strength</th>
                  <th>Motivation</th>
                  <th>Contact</th>
                  <th>Market</th>
                  <th>Workspace</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.lead.id}>
                    <td>
                      <div style={desktopLeadTitleStyle}>{row.address}</div>
                      <div style={desktopSubStyle}>{row.location}</div>
                    </td>
                    <td>{row.owner}</td>
                    <td>
                      <div>{row.phone}</div>
                      <div style={desktopSubStyle}>{row.email}</div>
                    </td>
                    <td>
                      <span
                        className="crm-badge soft"
                        style={{
                          color: row.stageColor,
                          borderColor: `${row.stageColor}55`,
                          background: `${row.stageColor}14`,
                        }}
                      >
                        {row.stageLabel}
                      </span>
                    </td>
                    <td>{row.priceText}</td>
                    <td>{row.arvText}</td>
                    <td><span className="crm-badge soft">Strength {row.strength}</span></td>
                    <td><span className="crm-badge soft">Motivation {row.motivation}</span></td>
                    <td><span className="crm-badge soft">Contact {row.contact}</span></td>
                    <td><span className="crm-badge soft">Market {row.market}</span></td>
                    <td>
                      <Link href={`/leads/${row.lead.id}`}>
                        <ActionButton compact>Open Workspace</ActionButton>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

function MiniValueCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={miniValueCardStyle}>
      <div style={miniKeyStyle}>{label}</div>
      <div style={miniValueStyle}>{value}</div>
    </div>
  )
}

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const searchStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
}

const filterRowStyle: CSSProperties = {
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

const mobileListStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const mobileCardStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(6,6,6,0.98), rgba(0,0,0,1))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.02), 0 0 12px rgba(214,166,75,0.05)',
}

const mobileCardTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const mobileAddressWrapStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: 4,
  flex: 1,
}

const mobileAddressStyle: CSSProperties = {
  fontSize: 22,
  lineHeight: 1.04,
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '-0.03em',
  wordBreak: 'break-word',
}

const mobileSubStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  color: 'rgba(255,255,255,0.52)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const stageBadgeStyle: CSSProperties = {
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
  border: '1px solid rgba(255,255,255,0.08)',
}

const infoBlockStyle: CSSProperties = {
  display: 'grid',
  gap: 3,
}

const miniKeyStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.40)',
}

const mobileValueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 650,
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

const valueGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const miniValueCardStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const miniValueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 750,
  color: '#ffffff',
}

const mobileActionRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: 2,
}

const openWorkspaceStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#e0b84f',
}

const desktopLeadTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 750,
  color: '#ffffff',
  lineHeight: 1.2,
}

const desktopSubStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.52)',
  lineHeight: 1.4,
}