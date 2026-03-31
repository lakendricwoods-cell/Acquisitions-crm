'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import PageShell from '@/components/ui/page-shell'
import StatPill from '@/components/ui/stat-pill'
import { supabase } from '@/lib/supabase'

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

const PIPELINE_STAGES = [
  { key: 'lead_inbox', label: 'Lead Inbox', color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
  { key: 'new_lead', label: 'New Lead', color: '#d6a64b', bg: 'rgba(214,166,75,0.08)' },
  { key: 'skip_trace', label: 'Skip Trace', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
  { key: 'contact_attempted', label: 'Contact Attempted', color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  { key: 'contacted', label: 'Contacted', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  { key: 'follow_up', label: 'Follow Up', color: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
  { key: 'appointment_set', label: 'Appointment Set', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
  { key: 'offer_sent', label: 'Offer Sent', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { key: 'negotiation', label: 'Negotiation', color: '#ec4899', bg: 'rgba(236,72,153,0.08)' },
  { key: 'verbal_yes', label: 'Verbal Yes', color: '#84cc16', bg: 'rgba(132,204,22,0.08)' },
  { key: 'under_contract', label: 'Under Contract', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  { key: 'title_opened', label: 'Title Opened', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { key: 'buyer_marketing', label: 'Buyer Marketing', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  { key: 'assigned', label: 'Assigned', color: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
  { key: 'double_close', label: 'Double Close', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  { key: 'closed', label: 'Closed', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  { key: 'dead', label: 'Dead', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
] as const

function normalizeStatus(status: string | null | undefined) {
  const value = (status || '').trim().toLowerCase()

  if (!value) return 'lead_inbox'
  if (['lead_inbox', 'lead inbox', 'inbox', 'imported'].includes(value)) return 'lead_inbox'
  if (['new_lead', 'new lead', 'new', 'open', 'active', 'fresh', 'lead'].includes(value)) return 'new_lead'
  if (['skip_trace', 'skip trace', 'tracing'].includes(value)) return 'skip_trace'
  if (['contact_attempted', 'contact attempted', 'attempted', 'trying to contact'].includes(value)) return 'contact_attempted'
  if (['contacted', 'contact', 'spoken to owner', 'owner contacted'].includes(value)) return 'contacted'
  if (['follow_up', 'follow up', 'followup', 'callback', 'nurture'].includes(value)) return 'follow_up'
  if (['appointment_set', 'appointment set', 'meeting set'].includes(value)) return 'appointment_set'
  if (['offer_sent', 'offer sent', 'offer', 'sent offer'].includes(value)) return 'offer_sent'
  if (['negotiation', 'negotiating', 'countered', 'counter offer'].includes(value)) return 'negotiation'
  if (['verbal_yes', 'verbal yes', 'agreed verbally'].includes(value)) return 'verbal_yes'
  if (['under_contract', 'under contract', 'contract', 'contracted'].includes(value)) return 'under_contract'
  if (['title_opened', 'title opened', 'title'].includes(value)) return 'title_opened'
  if (['buyer_marketing', 'buyer marketing', 'blast to buyers'].includes(value)) return 'buyer_marketing'
  if (['assigned', 'assignment signed'].includes(value)) return 'assigned'
  if (['double_close', 'double close'].includes(value)) return 'double_close'
  if (['closed', 'sold', 'done'].includes(value)) return 'closed'
  if (['dead', 'dead lead', 'lost'].includes(value)) return 'dead'

  return 'new_lead'
}

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
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
      const items = leads.filter((lead) => normalizeStatus(lead.status) === stage.key)
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
      subtitle="Full multi-stage deal flow with every stage color-coded."
      actions={
        <>
          <StatPill label="Leads" value={leads.length} />
          <StatPill
            label="Contracts"
            value={grouped.find((s) => s.key === 'under_contract')?.count ?? 0}
          />
          <StatPill label="Visible Value" value={money(totalValue)} />
        </>
      }
    >
      <div style={pipelineScrollOuterStyle}>
        <div style={pipelineShellStyle}>
          {grouped.map((stage) => (
            <section
              key={stage.key}
              style={{
                ...columnStyle,
                borderColor: `${stage.color}44`,
                background: stage.bg,
                boxShadow: `0 0 0 1px ${stage.color}22 inset, 0 24px 48px rgba(0,0,0,0.24)`,
              }}
            >
              <div style={columnHeaderStyle}>
                <div style={columnTopRowStyle}>
                  <div>
                    <div style={columnTitleStyle}>{stage.label}</div>
                    <div style={columnSubtitleStyle}>{stage.count} lead{stage.count === 1 ? '' : 's'}</div>
                  </div>
                  <span
                    className="crm-badge"
                    style={{
                      background: `${stage.color}22`,
                      borderColor: `${stage.color}55`,
                      color: stage.color,
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
                    <Link key={lead.id} href={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                      <article
                        style={{
                          ...leadCardStyle,
                          borderColor: `${stage.color}44`,
                        }}
                      >
                        <div style={leadTopStyle}>
                          <div style={leadTitleStyle}>
                            {lead.property_address_1 || 'Unknown property'}
                          </div>
                          <span
                            className="crm-badge soft"
                            style={{
                              background: `${stage.color}18`,
                              borderColor: `${stage.color}44`,
                              color: stage.color,
                            }}
                          >
                            {lead.lead_type || 'standard'}
                          </span>
                        </div>

                        <div style={leadSubStyle}>
                          {[lead.city, lead.state, lead.zip].filter(Boolean).join(', ') || 'Location pending'}
                        </div>

                        <div style={leadMetaGridStyle}>
                          <Meta label="Owner" value={lead.owner_name || '—'} />
                          <Meta
                            label="Value"
                            value={money(lead.house_value ?? lead.estimated_value ?? lead.market_value)}
                          />
                          <Meta label="Equity" value={money(lead.equity_amount)} />
                          <Meta label="Mortgage" value={money(lead.mortgage_balance)} />
                        </div>
                      </article>
                    </Link>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={metaStyle}>
      <div style={metaLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  )
}

const pipelineScrollOuterStyle: CSSProperties = {
  overflowX: 'auto',
  overflowY: 'hidden',
  width: '100%',
  paddingBottom: 4,
}

const pipelineShellStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(17, minmax(300px, 300px))',
  gap: 16,
  alignItems: 'start',
  minWidth: 'max-content',
}

const columnStyle: CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  minHeight: 'calc(100vh - 220px)',
  maxHeight: 'calc(100vh - 220px)',
  borderRadius: 22,
  border: '1px solid var(--border)',
  overflow: 'hidden',
}

const columnHeaderStyle: CSSProperties = {
  padding: 14,
  borderBottom: '1px solid var(--line)',
}

const columnTopRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const columnTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text)',
}

const columnSubtitleStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'var(--text-soft)',
  lineHeight: 1.4,
}

const columnScrollStyle: CSSProperties = {
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: 12,
  display: 'grid',
  alignContent: 'start',
  gap: 12,
}

const emptyStyle: CSSProperties = {
  minHeight: 120,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 16,
  border: '1px dashed var(--border)',
  color: 'var(--text-faint)',
  fontSize: 12,
}

const leadCardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.03)',
  padding: 13,
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
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text)',
}

const leadSubStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--text-soft)',
}

const leadMetaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
}

const metaStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'rgba(255,255,255,0.02)',
  padding: '8px 9px',
}

const metaLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-faint)',
  marginBottom: 4,
}

const metaValueStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 650,
  color: 'var(--text)',
  lineHeight: 1.3,
}