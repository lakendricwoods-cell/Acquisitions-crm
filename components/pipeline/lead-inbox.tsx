'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import ActionButton from '@/components/ui/action-button'
import type { PipelineLead } from '@/components/pipeline/types'

type LeadInboxProps = {
  leads: PipelineLead[]
  updatingLeadId: string | null
  onMoveLead: (leadId: string, stage: string) => void
}

const ACTIVE_STAGES = [
  'new_lead',
  'contact_attempted',
  'contacted',
  'follow_up',
  'appointment_set',
  'negotiation',
  'offer_sent',
  'offer_accepted',
  'under_contract',
  'due_diligence',
  'buyer_found',
  'closing',
]

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
}

export default function LeadInbox({
  leads,
  updatingLeadId,
  onMoveLead,
}: LeadInboxProps) {
  const [selectedStage, setSelectedStage] = useState('new_lead')
  const [search, setSearch] = useState('')

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
        .join(' ')
        .toLowerCase()

      return search.trim()
        ? haystack.includes(search.trim().toLowerCase())
        : true
    })
  }, [leads, search])

  return (
    <div style={containerStyle}>
      <div style={toolbarStyle}>
        <div style={searchWrapStyle}>
          <span style={searchIconStyle}>🔍</span>
          <input
            style={inputStyle}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads to review or move into your active flow..."
          />
        </div>

        <div style={selectWrapStyle}>
          <select
            style={selectStyle}
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
          >
            {ACTIVE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                Move to: {stage.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <span style={selectArrowStyle}>▾</span>
        </div>
      </div>

      <div style={listStyle}>
        {visibleLeads.length === 0 ? (
          <div style={emptyStyle}>
            No leads match your search criteria.
          </div>
        ) : (
          visibleLeads.map((lead) => (
            <div key={lead.id} style={cardStyle}>
              <div style={topStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={titleStyle}>{lead.property_address_1 || 'Untitled Lead'}</div>
                  <div style={subStyle}>
                    {[lead.city, lead.state].filter(Boolean).join(', ') || 'Location pending'}
                  </div>
                </div>

                <div style={badgeGroupStyle}>
                  <span style={badgeStyle}>
                    {lead.status || 'new_lead'}
                  </span>
                  <span style={heatBadgeStyle}>
                    ⚡ {lead.heat_score || 0}% strength
                  </span>
                </div>
              </div>

              <div style={detailGridStyle}>
                <Detail label="Seller" value={lead.owner_name || '—'} />
                <Detail label="Phone" value={lead.owner_phone_primary || '—'} />
                <Detail label="ARV" value={money(lead.arv)} />
                <Detail label="MAO" value={money(lead.mao)} />
                <Detail label="Spread" value={money(lead.projected_spread)} isHighlight />
                <Detail label="Next Action" value={lead.next_action || 'Continue qualification'} />
              </div>

              {lead.notes_summary ? (
                <div style={notesStyle}>
                  <span style={{ color: '#d6a64b', fontWeight: 600 }}>Notes: </span>
                  {lead.notes_summary}
                </div>
              ) : null}

              <div style={actionsStyle}>
                <ActionButton
                  tone="gold"
                  onClick={() => onMoveLead(lead.id, selectedStage)}
                  disabled={updatingLeadId === lead.id}
                >
                  {updatingLeadId === lead.id ? 'Moving...' : 'Move to Stage'}
                </ActionButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  isHighlight = false,
}: {
  label: string
  value: string
  isHighlight?: boolean
}) {
  return (
    <div
      style={{
        ...detailStyle,
        borderColor: isHighlight ? 'rgba(214, 166, 75, 0.3)' : 'rgba(255,255,255,0.05)',
        background: isHighlight
          ? 'linear-gradient(180deg, rgba(30,24,14,0.8), rgba(12,10,6,0.9))'
          : 'linear-gradient(180deg, rgba(22,20,16,0.7), rgba(10,10,10,0.9))',
      }}
    >
      <div style={detailLabelStyle}>{label}</div>
      <div
        style={{
          ...detailValueStyle,
          color: isHighlight ? '#d6a64b' : '#ffffff',
        }}
      >
        {value}
      </div>
    </div>
  )
}

const containerStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
  alignItems: 'center',
  padding: 12,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(12,10,6,0.85), rgba(0,0,0,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}

const searchWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  fontSize: 12,
  opacity: 0.5,
  pointerEvents: 'none',
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  paddingLeft: 34,
  paddingRight: 14,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.6)',
  color: '#ffffff',
  fontSize: 13,
  outline: 'none',
}

const selectWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}

const selectStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  paddingLeft: 14,
  paddingRight: 32,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.6)',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 13,
  appearance: 'none',
  outline: 'none',
  cursor: 'pointer',
}

const selectArrowStyle: CSSProperties = {
  position: 'absolute',
  right: 12,
  fontSize: 12,
  color: '#d6a64b',
  pointerEvents: 'none',
}

const listStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const cardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(16,14,10,0.92), rgba(6,6,6,0.98))',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  padding: 16,
  display: 'grid',
  gap: 14,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

const topStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const titleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 750,
  color: '#ffffff',
  letterSpacing: '-0.01em',
}

const subStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 12,
  color: 'rgba(255,255,255,0.50)',
}

const badgeGroupStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.80)',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'capitalize',
}

const heatBadgeStyle: CSSProperties = {
  ...badgeStyle,
  borderColor: 'rgba(214, 166, 75, 0.3)',
  background: 'rgba(214, 166, 75, 0.12)',
  color: '#d6a64b',
}

const detailGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 8,
}

const detailStyle: CSSProperties = {
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.05)',
  padding: '8px 10px',
}

const detailLabelStyle: CSSProperties = {
  fontSize: 9.5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.38)',
  marginBottom: 4,
  fontWeight: 600,
}

const detailValueStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.3,
  fontWeight: 700,
}

const notesStyle: CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.70)',
  lineHeight: 1.5,
  borderTop: '1px solid rgba(255,255,255,0.06)',
  paddingTop: 12,
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
}

const emptyStyle: CSSProperties = {
  padding: 32,
  textAlign: 'center',
  borderRadius: 18,
  border: '1px dashed rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.2)',
  color: 'rgba(255,255,255,0.4)',
  fontSize: 13,
}