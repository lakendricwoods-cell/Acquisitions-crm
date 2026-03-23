'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'

type LeadRecord = {
  id: string
  property_address_1: string | null
  city: string | null
  state: string | null
  zip: string | null
  owner_name: string | null
  status: string | null
  lead_type: string | null
  house_value: number | null
  estimated_value: number | null
  market_value: number | null
  equity_amount: number | null
  mortgage_balance: number | null
}

type StageConfig = {
  key: string
  label: string
  description: string
  border: string
  glow: string
  chipBg: string
  chipText: string
  panelBg: string
}

const PIPELINE_STAGES: StageConfig[] = [
  {
    key: 'new_lead',
    label: 'New Lead',
    description: 'Fresh imports and first-pass review.',
    border: 'rgba(147,197,253,0.38)',
    glow: 'rgba(147,197,253,0.16)',
    chipBg: 'rgba(147,197,253,0.12)',
    chipText: '#dcebff',
    panelBg:
      'radial-gradient(circle at top left, rgba(147,197,253,0.16), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'researching',
    label: 'Researching',
    description: 'Signal validation and underwriting.',
    border: 'rgba(214,166,75,0.36)',
    glow: 'rgba(214,166,75,0.16)',
    chipBg: 'rgba(214,166,75,0.12)',
    chipText: '#f3d899',
    panelBg:
      'radial-gradient(circle at top left, rgba(214,166,75,0.16), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'contacted',
    label: 'Contacted',
    description: 'Seller reached and posture assessed.',
    border: 'rgba(94,234,212,0.34)',
    glow: 'rgba(94,234,212,0.14)',
    chipBg: 'rgba(94,234,212,0.12)',
    chipText: '#d8fffb',
    panelBg:
      'radial-gradient(circle at top left, rgba(94,234,212,0.15), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'negotiating',
    label: 'Negotiating',
    description: 'Price shaping and deal framing.',
    border: 'rgba(196,181,253,0.36)',
    glow: 'rgba(196,181,253,0.16)',
    chipBg: 'rgba(196,181,253,0.12)',
    chipText: '#ede7ff',
    panelBg:
      'radial-gradient(circle at top left, rgba(196,181,253,0.16), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'under_contract',
    label: 'Under Contract',
    description: 'Agreement secured and buyer side begins.',
    border: 'rgba(74,222,128,0.34)',
    glow: 'rgba(74,222,128,0.16)',
    chipBg: 'rgba(74,222,128,0.12)',
    chipText: '#d8ffe6',
    panelBg:
      'radial-gradient(circle at top left, rgba(74,222,128,0.15), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'dead',
    label: 'Dead / Parked',
    description: 'Inactive or parked leads.',
    border: 'rgba(248,113,113,0.34)',
    glow: 'rgba(248,113,113,0.16)',
    chipBg: 'rgba(248,113,113,0.12)',
    chipText: '#ffd9d9',
    panelBg:
      'radial-gradient(circle at top left, rgba(248,113,113,0.14), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
]

function normalizeStage(status: string | null | undefined) {
  const value = (status || '').trim().toLowerCase()
  if (!value) return 'new_lead'
  if (value === 'new' || value === 'new lead') return 'new_lead'
  if (value === 'researching' || value === 'research') return 'researching'
  if (value === 'contacted' || value === 'contact') return 'contacted'
  if (value === 'negotiating' || value === 'negotiation') return 'negotiating'
  if (value === 'under contract' || value === 'under_contract' || value === 'contract') {
    return 'under_contract'
  }
  if (value === 'dead' || value === 'parked' || value === 'closed_lost') return 'dead'
  return 'new_lead'
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLeads() {
      setLoading(true)

      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          property_address_1,
          city,
          state,
          zip,
          owner_name,
          status,
          lead_type,
          house_value,
          estimated_value,
          market_value,
          equity_amount,
          mortgage_balance
        `)
        .order('updated_at', { ascending: false, nullsFirst: false })

      if (!error && data) {
        setLeads(data as LeadRecord[])
      } else {
        setLeads([])
      }

      setLoading(false)
    }

    void loadLeads()
  }, [])

  const grouped = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => {
      const items = leads.filter((lead) => normalizeStage(lead.status) === stage.key)
      return {
        ...stage,
        items,
        count: items.length,
      }
    })
  }, [leads])

  const totalValue = useMemo(() => {
    return leads.reduce((sum, lead) => {
      return sum + (lead.house_value ?? lead.estimated_value ?? lead.market_value ?? 0)
    }, 0)
  }, [leads])

  return (
    <PageShell
      title="Pipeline"
      subtitle="Color-coded deal flow with per-stage scrolling and imported value signals."
      actions={
        <>
          <StatPill label="Leads" value={leads.length} />
          <StatPill label="Contracts" value={grouped.find((s) => s.key === 'under_contract')?.count ?? 0} />
          <StatPill label="Visible Value" value={money(totalValue)} />
        </>
      }
    >
      <div style={pipelineShellStyle}>
        {grouped.map((stage) => (
          <section
            key={stage.key}
            style={{
              ...columnStyle,
              borderColor: stage.border,
              background: stage.panelBg,
              boxShadow: `0 0 0 1px ${stage.glow} inset, 0 24px 48px rgba(0,0,0,0.34)`,
            }}
          >
            <div style={columnHeaderStyle}>
              <div style={columnTopRowStyle}>
                <div>
                  <div style={columnTitleStyle}>{stage.label}</div>
                  <div style={columnSubtitleStyle}>{stage.description}</div>
                </div>
                <span
                  className="crm-badge"
                  style={{
                    background: stage.chipBg,
                    borderColor: stage.border,
                    color: stage.chipText,
                  }}
                >
                  {stage.count}
                </span>
              </div>
            </div>

            <div style={columnScrollStyle}>
              {loading ? (
                <div style={emptyStyle}>Loading stage...</div>
              ) : stage.items.length === 0 ? (
                <div style={emptyStyle}>No leads here.</div>
              ) : (
                stage.items.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <article
                      style={{
                        ...leadCardStyle,
                        borderColor: stage.border,
                      }}
                    >
                      <div style={leadTopStyle}>
                        <div style={leadTitleStyle}>
                          {lead.property_address_1 || 'Unknown property'}
                        </div>
                        <span
                          className="crm-badge soft"
                          style={{
                            background: stage.chipBg,
                            borderColor: stage.border,
                            color: stage.chipText,
                          }}
                        >
                          {lead.lead_type || 'standard'}
                        </span>
                      </div>

                      <div style={leadSubStyle}>
                        {[lead.city, lead.state].filter(Boolean).join(', ') || 'No city/state'}
                      </div>

                      <div style={signalGridStyle}>
                        <SignalMini
                          label="Value"
                          value={money(lead.house_value ?? lead.estimated_value ?? lead.market_value ?? null)}
                        />
                        <SignalMini
                          label="Equity"
                          value={money(lead.equity_amount)}
                        />
                        <SignalMini
                          label="Mortgage"
                          value={money(lead.mortgage_balance)}
                        />
                      </div>

                      <div style={leadOwnerStyle}>{lead.owner_name || 'No owner name'}</div>

                      <div style={leadFooterStyle}>
                        <ActionButton tone="gold">
                          Open Workspace
                        </ActionButton>
                      </div>
                    </article>
                  </Link>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  )
}

function SignalMini({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={signalMiniStyle}>
      <div style={signalMiniLabelStyle}>{label}</div>
      <div style={signalMiniValueStyle}>{value}</div>
    </div>
  )
}

const pipelineShellStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(280px, 1fr))',
  gap: 14,
  overflowX: 'auto',
  alignItems: 'start',
  minHeight: 'calc(100vh - 170px)',
  paddingBottom: 4,
}

const columnStyle: CSSProperties = {
  minWidth: 280,
  height: 'calc(100vh - 170px)',
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  overflow: 'hidden',
}

const columnHeaderStyle: CSSProperties = {
  padding: 14,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

const columnTopRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
}

const columnTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 760,
  color: 'var(--white-hi)',
}

const columnSubtitleStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  lineHeight: 1.45,
  color: 'var(--white-faint)',
}

const columnScrollStyle: CSSProperties = {
  overflowY: 'auto',
  padding: 14,
  display: 'grid',
  alignContent: 'start',
  gap: 12,
}

const leadCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008)), rgba(0,0,0,0.18)',
  display: 'grid',
  gap: 10,
}

const leadTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
}

const leadTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 740,
  lineHeight: 1.4,
  color: 'var(--white-hi)',
}

const leadSubStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--white-faint)',
}

const signalGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
}

const signalMiniStyle: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.05)',
}

const signalMiniLabelStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--white-faint)',
}

const signalMiniValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--white-hi)',
}

const leadOwnerStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--white-soft)',
}

const leadFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
}

const emptyStyle: CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
  color: 'var(--white-faint)',
  fontSize: 12,
  textAlign: 'center',
}