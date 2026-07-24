'use client'

import React, { type CSSProperties } from 'react'

export type LeadRow = {
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
  leads: LeadRow[]
  onOpenWorkspace: (leadId: string) => void
}

function money(val?: number | null) {
  if (!val) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function LeadsDesktop({ leads, onOpenWorkspace }: Props) {
  return (
    <div style={tableCardStyle}>
      <div style={scrollWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={{ ...thStyle, width: '25%' }}>Lead</th>
              <th style={{ ...thStyle, width: '16%' }}>Owner</th>
              <th style={{ ...thStyle, width: '14%' }}>Contact Stage</th>
              <th style={{ ...thStyle, width: '11%', textAlign: 'right' }}>Price</th>
              <th style={{ ...thStyle, width: '11%', textAlign: 'right' }}>ARV</th>
              <th style={{ ...thStyle, width: '6%', textAlign: 'center' }}>Strength</th>
              <th style={{ ...thStyle, width: '6%', textAlign: 'center' }}>Motivation</th>
              <th style={{ ...thStyle, width: '11%', textAlign: 'right' }}>Workspace</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const cityStateZip = [
                lead.property_city,
                lead.property_state,
                lead.property_zip,
              ]
                .filter(Boolean)
                .join(', ')

              return (
                <tr key={lead.id} style={trStyle}>
                  {/* Lead Address */}
                  <td style={tdStyle}>
                    <div style={addressLineStyle} title={lead.property_address_1 || ''}>
                      {lead.property_address_1 || 'Unmapped Address'}
                    </div>
                    {cityStateZip ? (
                      <div style={subCityStyle}>{cityStateZip}</div>
                    ) : null}
                  </td>

                  {/* Owner */}
                  <td style={tdStyle}>
                    <div style={ownerNameStyle}>{lead.owner_name || 'Unknown Owner'}</div>
                  </td>

                  {/* Contact Stage */}
                  <td style={tdStyle}>
                    <div style={stageFlexStyle}>
                      <span style={subContactStyle}>
                        {lead.phone ? lead.phone : 'No phone'}
                      </span>
                      <span style={stageBadgeStyle}>{lead.stage || 'New Lead'}</span>
                    </div>
                  </td>

                  {/* Price */}
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                    {money(lead.market_value)}
                  </td>

                  {/* ARV */}
                  <td style={{ ...tdStyle, textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>
                    {money(lead.arv)}
                  </td>

                  {/* Strength */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={scorePillStyle}>
                      {lead.strength_score ?? 65}
                    </span>
                  </td>

                  {/* Motivation */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={scorePillStyle}>
                      {lead.motivation_score ?? 70}
                    </span>
                  </td>

                  {/* Workspace Action */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => onOpenWorkspace(lead.id)}
                      style={actionBtnStyle}
                    >
                      Open Workspace
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const tableCardStyle: CSSProperties = {
  width: '100%',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(16,14,10,0.85), rgba(6,6,6,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

const scrollWrapperStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: 12.5,
  minWidth: 900,
}

const headerRowStyle: CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.02)',
}

const thStyle: CSSProperties = {
  padding: '12px 14px',
  color: 'rgba(255,255,255,0.45)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

const trStyle: CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  transition: 'background 0.15s ease',
}

const tdStyle: CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
  color: 'rgba(255,255,255,0.85)',
}

const addressLineStyle: CSSProperties = {
  fontWeight: 700,
  color: '#ffffff',
  fontSize: 13,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 240,
}

const subCityStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.4)',
  marginTop: 2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 240,
}

const ownerNameStyle: CSSProperties = {
  fontWeight: 600,
  color: 'rgba(255,255,255,0.9)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 160,
}

const stageFlexStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  alignItems: 'flex-start',
}

const subContactStyle: CSSProperties = {
  fontSize: 10.5,
  color: 'rgba(255,255,255,0.4)',
}

const stageBadgeStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 6,
  background: 'rgba(214,166,75,0.15)',
  border: '1px solid rgba(214,166,75,0.3)',
  color: '#d6a64b',
  display: 'inline-block',
  whiteSpace: 'nowrap',
}

const scorePillStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 750,
  color: '#ffffff',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  padding: '2px 8px',
}

const actionBtnStyle: CSSProperties = {
  background: 'rgba(214,166,75,0.12)',
  border: '1px solid rgba(214,166,75,0.35)',
  color: '#d6a64b',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 11.5,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
}