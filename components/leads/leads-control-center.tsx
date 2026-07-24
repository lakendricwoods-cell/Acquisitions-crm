'use client'

import { useState, useMemo, type CSSProperties } from 'react'

export type Lead = {
  id: string
  property_address_1?: string | null
  property_city?: string | null
  property_state?: string | null
  property_zip?: string | null
  owner_name?: string | null
  phone?: string | null
  email?: string | null
  stage?: string | null
  market_value?: number | null
  arv?: number | null
  strength_score?: number | null
  motivation_score?: number | null
  contact_score?: number | null
  market_score?: number | null
}

type Props = {
  initialLeads?: Lead[]
  onOpenWorkspace?: (id: string) => void
}

function money(val?: number | null) {
  if (!val) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val)
}

const FILTER_TAGS = [
  'All',
  'High Priority',
  'Workable',
  'Missing Contact',
  'Missing Market',
]

export default function LeadsControlCenter({
  initialLeads = [],
  onOpenWorkspace,
}: Props) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('All')

  const filtered = useMemo(() => {
    return initialLeads.filter((lead) => {
      const query = search.toLowerCase()
      const matchSearch =
        !search ||
        (lead.property_address_1 || '').toLowerCase().includes(query) ||
        (lead.owner_name || '').toLowerCase().includes(query) ||
        (lead.phone || '').toLowerCase().includes(query)

      if (!matchSearch) return false

      if (activeTag === 'High Priority') return (lead.strength_score ?? 0) >= 80
      if (activeTag === 'Workable') return (lead.strength_score ?? 0) >= 50
      if (activeTag === 'Missing Contact') return !lead.phone && !lead.email
      return true
    })
  }, [initialLeads, search, activeTag])

  return (
    <div style={containerStyle}>
      {/* Executive Summary Stats */}
      <div style={statsRowStyle}>
        <StatCard label="TOTAL LEADS" value={initialLeads.length || 45} tone="gold" />
        <StatCard label="HIGH PRIORITY" value={0} tone="amber" />
        <StatCard label="WORKABLE" value={initialLeads.length || 45} tone="ice" />
        <StatCard label="WEAK CONTACT" value={initialLeads.length || 45} tone="neutral" />
      </div>

      {/* Main Glass Workspace Card */}
      <div style={mainPanelStyle}>
        {/* Header Control Bar */}
        <div style={panelHeaderStyle}>
          <div>
            <h2 style={panelTitleStyle}>Lead Control Center</h2>
            <p style={panelSubtitleStyle}>
              Filter and analyze off-market assets across your active inventory.
            </p>
          </div>

          <div style={filterHeaderRightStyle}>
            <input
              type="text"
              placeholder="Search address, owner, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div style={pillsRowStyle}>
          {FILTER_TAGS.map((tag) => {
            const isActive = activeTag === tag
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                style={{
                  ...pillStyle,
                  ...(isActive ? activePillStyle : {}),
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>

        {/* Executive Table */}
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={thRowStyle}>
                <th style={{ ...thStyle, width: '26%' }}>LEAD ADDRESS</th>
                <th style={{ ...thStyle, width: '16%' }}>OWNER</th>
                <th style={{ ...thStyle, width: '13%' }}>STAGE</th>
                <th style={{ ...thStyle, width: '12%', textAlign: 'right' }}>VALUE</th>
                <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>STRENGTH</th>
                <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>MOTIVATION</th>
                <th style={{ ...thStyle, width: '7%', textAlign: 'center' }}>MARKET</th>
                <th style={{ ...thStyle, width: '10%', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} style={trStyle}>
                  {/* Lead Address */}
                  <td style={tdStyle}>
                    <div style={addressMainStyle} title={lead.property_address_1 || ''}>
                      {lead.property_address_1 || 'Unmapped Asset'}
                    </div>
                    <div style={addressSubStyle}>
                      {[lead.property_city, lead.property_state, lead.property_zip]
                        .filter(Boolean)
                        .join(', ') || 'Saint Petersburg, FL'}
                    </div>
                  </td>

                  {/* Owner */}
                  <td style={tdStyle}>
                    <div style={ownerNameStyle}>{lead.owner_name || 'Unknown Owner'}</div>
                  </td>

                  {/* Contact Stage */}
                  <td style={tdStyle}>
                    <span style={stageBadgeStyle}>{lead.stage || 'New Lead'}</span>
                  </td>

                  {/* Price */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={priceTextStyle}>{money(lead.market_value)}</div>
                  </td>

                  {/* Score Badges */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <ScoreCapsule score={lead.strength_score ?? 65} />
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <ScoreCapsule score={lead.motivation_score ?? 70} />
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <ScoreCapsule score={lead.market_score ?? 75} />
                  </td>

                  {/* Workspace Action */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => onOpenWorkspace?.(lead.id)}
                      style={actionButtonStyle}
                    >
                      Workspace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const isGold = tone === 'gold'
  const isAmber = tone === 'amber'
  const isIce = tone === 'ice'

  return (
    <div
      style={{
        ...statCardBaseStyle,
        borderColor: isGold
          ? 'rgba(214,166,75,0.3)'
          : isAmber
            ? 'rgba(245,158,11,0.25)'
            : isIce
              ? 'rgba(147,197,253,0.25)'
              : 'rgba(255,255,255,0.08)',
      }}
    >
      <div style={statLabelStyle}>{label}</div>
      <div
        style={{
          ...statValueStyle,
          color: isGold ? '#d6a64b' : isAmber ? '#f59e0b' : isIce ? '#93c5fd' : '#ffffff',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ScoreCapsule({ score }: { score: number }) {
  const isHigh = score >= 75
  const isMid = score >= 50

  return (
    <span
      style={{
        ...capsuleBaseStyle,
        color: isHigh ? '#4ade80' : isMid ? '#d6a64b' : 'rgba(255,255,255,0.5)',
        background: isHigh
          ? 'rgba(74,222,128,0.1)'
          : isMid
            ? 'rgba(214,166,75,0.1)'
            : 'rgba(255,255,255,0.04)',
        borderColor: isHigh
          ? 'rgba(74,222,128,0.25)'
          : isMid
            ? 'rgba(214,166,75,0.25)'
            : 'rgba(255,255,255,0.08)',
      }}
    >
      {score}
    </span>
  )
}

// ---------------- STYLES ----------------

const containerStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  width: '100%',
  boxSizing: 'border-box',
}

const statsRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}

const statCardBaseStyle: CSSProperties = {
  padding: '16px 20px',
  borderRadius: 16,
  background: 'linear-gradient(180deg, rgba(20,18,14,0.7), rgba(8,8,8,0.85))',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
}

const statLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 6,
}

const statValueStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: '-0.02em',
}

const mainPanelStyle: CSSProperties = {
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.08)',
  background:
    'radial-gradient(circle at top left, rgba(214,166,75,0.05), transparent 40%), linear-gradient(180deg, rgba(14,12,10,0.9), rgba(6,6,6,0.95))',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  padding: 24,
  display: 'grid',
  gap: 18,
  boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const panelHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
}

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '-0.02em',
}

const panelSubtitleStyle: CSSProperties = {
  margin: '4px 0 0 0',
  fontSize: 12.5,
  color: 'rgba(255,255,255,0.45)',
}

const filterHeaderRightStyle: CSSProperties = {
  minWidth: 260,
}

const searchInputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#ffffff',
  fontSize: 12.5,
  outline: 'none',
  boxSizing: 'border-box',
}

const pillsRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 4,
}

const pillStyle: CSSProperties = {
  padding: '6px 14px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.5)',
  fontSize: 11.5,
  fontWeight: 650,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
}

const activePillStyle: CSSProperties = {
  background: 'rgba(214,166,75,0.15)',
  borderColor: 'rgba(214,166,75,0.4)',
  color: '#d6a64b',
}

const tableWrapperStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(0,0,0,0.2)',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12.5,
  textAlign: 'left',
  minWidth: 950,
}

const thRowStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}

const thStyle: CSSProperties = {
  padding: '14px 16px',
  color: 'rgba(255,255,255,0.4)',
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
}

const trStyle: CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.04)',
}

const tdStyle: CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
  color: 'rgba(255,255,255,0.85)',
}

const addressMainStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#ffffff',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 260,
}

const addressSubStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.4)',
  marginTop: 2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 260,
}

const ownerNameStyle: CSSProperties = {
  fontWeight: 650,
  color: 'rgba(255,255,255,0.9)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 160,
}

const stageBadgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 6,
  fontSize: 10.5,
  fontWeight: 700,
  color: '#d6a64b',
  background: 'rgba(214,166,75,0.12)',
  border: '1px solid rgba(214,166,75,0.25)',
  whiteSpace: 'nowrap',
}

const priceTextStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 750,
  color: '#ffffff',
}

const capsuleBaseStyle: CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 750,
  border: '1px solid transparent',
}

const actionButtonStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  background: 'rgba(214,166,75,0.12)',
  border: '1px solid rgba(214,166,75,0.35)',
  color: '#d6a64b',
  fontSize: 11.5,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
}