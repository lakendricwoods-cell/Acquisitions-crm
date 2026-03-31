'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import StatPill from '@/components/ui/stat-pill'
import { getStageHex, getStageLabel } from '@/lib/ui/stage-colors'
import { resolveField, resolveNumericField } from '@/lib/resolve-field'
import { FIELD_ALIASES } from '@/lib/field-aliases'
import { computeOwnershipYears } from '@/lib/compute-fields'

type LeadRow = {
  id: string
  property_address_1: string | null
  city: string | null
  state: string | null
  zip?: string | null
  owner_name: string | null
  owner_phone_primary?: string | null
  asking_price: number | null
  arv: number | null
  mao: number | null
  projected_spread: number | null
  next_action: string | null
  lead_source: string | null
  status: string | null
  created_at: string | null
  updated_at?: string | null
  lead_type?: string | null
  house_value?: number | null
  estimated_value?: number | null
  market_value?: number | null
  equity_amount?: number | null
  mortgage_balance?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  ownership_length?: number | null
  last_sale_date?: string | null
  lead_intelligence?: Record<string, unknown> | null
  raw_import_data?: Record<string, unknown> | null
  source_columns?: Record<string, unknown> | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  priority: string | null
  created_at: string | null
  due_at?: string | null
  due_date?: string | null
  lead_id?: string | null
}

type DealRow = {
  id: string
  status: string | null
  assignment_fee: number | null
  created_at: string | null
}

const STAGES = [
  'lead_inbox',
  'new_lead',
  'contact_attempted',
  'contacted',
  'follow_up',
  'offer_sent',
  'negotiation',
  'under_contract',
  'closed',
] as const

function normalizeStatus(status: string | null | undefined) {
  const value = (status || '').trim().toLowerCase()

  if (!value) return 'lead_inbox'
  if (['lead_inbox', 'lead inbox', 'inbox'].includes(value)) return 'lead_inbox'
  if (['new_lead', 'new lead', 'new', 'active', 'lead'].includes(value)) return 'new_lead'
  if (['contact_attempted', 'contact attempted'].includes(value)) return 'contact_attempted'
  if (['contacted', 'contact'].includes(value)) return 'contacted'
  if (['follow_up', 'follow up'].includes(value)) return 'follow_up'
  if (['offer_sent', 'offer sent'].includes(value)) return 'offer_sent'
  if (['negotiation', 'negotiating'].includes(value)) return 'negotiation'
  if (['under_contract', 'under contract', 'contract'].includes(value)) return 'under_contract'
  if (['closed', 'sold'].includes(value)) return 'closed'

  return 'lead_inbox'
}

function normalizeLeadType(type: string | null | undefined) {
  const value = (type || '').trim().toLowerCase()
  if (!value) return 'standard'
  if (value === 'foreclosure') return 'foreclosure'
  if (value === 'tax_lien' || value === 'tax lien') return 'tax_lien'
  if (
    value === 'foreclosure_tax_lien' ||
    value === 'foreclosure tax lien' ||
    value === 'foreclosure+tax'
  ) {
    return 'foreclosure_tax_lien'
  }
  return 'standard'
}

function formatMoney(value: number | null | undefined) {
  if (value == null) return '—'
  return `$${value.toLocaleString()}`
}

function compactMoney(value: number | null | undefined) {
  if (!value) return '$0'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${Math.round(value)}`
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

function getTaskDueValue(task: TaskRow) {
  return task.due_at || task.due_date || null
}

function isOverdue(value: string | null | undefined) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() < Date.now()
}

function normalizeLead(lead: LeadRow) {
  const beds = resolveNumericField(lead as any, FIELD_ALIASES.beds, null, {
    treatZeroAsMissing: true,
    min: 1,
  })

  const baths = resolveNumericField(lead as any, FIELD_ALIASES.baths, null, {
    treatZeroAsMissing: false,
    min: 0,
  })

  const ownerName =
    toText(resolveField(lead as any, FIELD_ALIASES.ownerName)) ||
    toText((lead.lead_intelligence as any)?.owner_name) ||
    lead.owner_name

  const value =
    toNumber(resolveField(lead as any, FIELD_ALIASES.estimatedValue)) ??
    toNumber((lead.lead_intelligence as any)?.house_value) ??
    toNumber((lead.lead_intelligence as any)?.estimated_value) ??
    toNumber((lead.lead_intelligence as any)?.market_value) ??
    lead.house_value ??
    lead.estimated_value ??
    lead.market_value ??
    lead.arv ??
    null

  const equity =
    toNumber((lead.lead_intelligence as any)?.equity_amount) ??
    lead.equity_amount ??
    null

  const mortgage =
    toNumber((lead.lead_intelligence as any)?.mortgage_balance) ??
    lead.mortgage_balance ??
    null

  const normalized = normalizeStatus(lead.status)

  const ownershipYears =
    computeOwnershipYears({
      ...lead,
      last_sale_date:
        toText(resolveField(lead as any, FIELD_ALIASES.lastSaleDate)) ||
        toText((lead.lead_intelligence as any)?.last_sale_date) ||
        lead.last_sale_date,
    }) ??
    lead.ownership_length ??
    null

  return {
    ...lead,
    status: normalized,
    owner_name: ownerName,
    bedrooms: beds,
    bathrooms: baths,
    resolved_value: value,
    resolved_equity: equity,
    resolved_mortgage: mortgage,
    ownership_length: ownershipYears,
  }
}

function getLeadStrength(lead: ReturnType<typeof normalizeLead>) {
  let score = 0
  if (lead.owner_name) score += 20
  if (lead.owner_phone_primary) score += 20
  if (lead.asking_price != null) score += 10
  if (lead.mao != null) score += 10
  if (lead.resolved_value != null) score += 15
  if (lead.resolved_equity != null) score += 10
  if (lead.bedrooms != null) score += 5
  if (lead.bathrooms != null) score += 5
  if (lead.ownership_length != null) score += 5
  return score
}

function getLeadReadiness(lead: ReturnType<typeof normalizeLead>) {
  const strength = getLeadStrength(lead)
  if (strength >= 80) return 'Ready'
  if (strength >= 50) return 'Building'
  return 'Early'
}

const LEAD_TYPE_STYLES: Record<
  string,
  { label: string; bg: string; border: string; text: string }
> = {
  standard: {
    label: 'Standard',
    bg: 'rgba(147,197,253,0.12)',
    border: 'rgba(147,197,253,0.24)',
    text: '#dcebff',
  },
  foreclosure: {
    label: 'Foreclosure',
    bg: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.24)',
    text: '#ffd9d9',
  },
  tax_lien: {
    label: 'Tax Lien',
    bg: 'rgba(214,166,75,0.12)',
    border: 'rgba(214,166,75,0.24)',
    text: '#f3d899',
  },
  foreclosure_tax_lien: {
    label: 'Foreclosure + Tax',
    bg: 'rgba(196,181,253,0.12)',
    border: 'rgba(196,181,253,0.24)',
    text: '#ede7ff',
  },
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [deals, setDeals] = useState<DealRow[]>([])
  const [loading, setLoading] = useState(true)

  async function loadLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id,
        property_address_1,
        city,
        state,
        zip,
        owner_name,
        owner_phone_primary,
        asking_price,
        arv,
        mao,
        projected_spread,
        next_action,
        lead_source,
        status,
        created_at,
        updated_at,
        lead_type,
        house_value,
        estimated_value,
        market_value,
        equity_amount,
        mortgage_balance,
        bedrooms,
        bathrooms,
        ownership_length,
        last_sale_date,
        lead_intelligence,
        raw_import_data,
        source_columns
      `)
      .order('updated_at', { ascending: false, nullsFirst: false })

    if (error) throw error
    return (data || []) as LeadRow[]
  }

  async function loadTasks() {
    const attempts = [
      `
        id,
        title,
        status,
        priority,
        created_at,
        due_at,
        lead_id
      `,
      `
        id,
        title,
        status,
        priority,
        created_at,
        due_date,
        lead_id
      `,
      `
        id,
        title,
        status,
        priority,
        created_at,
        lead_id
      `,
    ]

    for (const selectClause of attempts) {
      const { data, error } = await supabase
        .from('tasks')
        .select(selectClause)
        .order('created_at', { ascending: false })

      if (!error) {
        return ((data ?? []) as unknown[]).map((row) => ({
          id: String((row as any).id),
          title: ((row as any).title ?? null) as string | null,
          status: ((row as any).status ?? null) as string | null,
          priority: ((row as any).priority ?? null) as string | null,
          created_at: ((row as any).created_at ?? null) as string | null,
          due_at: ((row as any).due_at ?? null) as string | null,
          due_date: ((row as any).due_date ?? null) as string | null,
          lead_id: ((row as any).lead_id ?? null) as string | null,
        }))
      }
    }

    return []
  }

  async function loadDeals() {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        id,
        status,
        assignment_fee,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as DealRow[]
  }

  async function loadDashboard() {
    setLoading(true)

    try {
      const [leadData, taskData, dealData] = await Promise.all([
        loadLeads(),
        loadTasks(),
        loadDeals(),
      ])

      setLeads(leadData)
      setTasks(taskData)
      setDeals(dealData)
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const normalizedLeads = useMemo(() => leads.map(normalizeLead), [leads])

  const totalLeads = normalizedLeads.length
  const inboxCount = normalizedLeads.filter((lead) => lead.status === 'lead_inbox').length
  const activeCount = normalizedLeads.filter(
    (lead) => !['lead_inbox', 'closed'].includes(lead.status || '')
  ).length
  const underContractCount = normalizedLeads.filter(
    (lead) => lead.status === 'under_contract'
  ).length
  const highRiskCount = normalizedLeads.filter((lead) => getLeadStrength(lead) <= 20).length
  const avgStrength =
    normalizedLeads.length > 0
      ? Math.round(
          normalizedLeads.reduce((sum, lead) => sum + getLeadStrength(lead), 0) /
            normalizedLeads.length
        )
      : 0

  const projectedSpread = normalizedLeads.reduce((sum, lead) => sum + (lead.projected_spread || 0), 0)
  const visibleEquity = normalizedLeads.reduce((sum, lead) => sum + (lead.resolved_equity || 0), 0)
  const visibleValue = normalizedLeads.reduce((sum, lead) => sum + (lead.resolved_value || 0), 0)
  const assignmentFeeTotal = deals.reduce((sum, deal) => sum + (deal.assignment_fee || 0), 0)

  const stageSeries = useMemo(
    () =>
      STAGES.map((stage) => {
        const count = normalizedLeads.filter((lead) => lead.status === stage).length
        return {
          stage,
          label: getStageLabel(stage),
          count,
          hex: getStageHex(stage),
        }
      }),
    [normalizedLeads]
  )

  const maxStageCount = Math.max(...stageSeries.map((item) => item.count), 1)

  const leadTypeSeries = useMemo(() => {
    const buckets = ['standard', 'foreclosure', 'tax_lien', 'foreclosure_tax_lien'] as const
    return buckets.map((key) => {
      const style = LEAD_TYPE_STYLES[key]
      return {
        key,
        label: style.label,
        count: normalizedLeads.filter((lead) => normalizeLeadType(lead.lead_type) === key).length,
        bg: style.bg,
        border: style.border,
        text: style.text,
      }
    })
  }, [normalizedLeads])

  const strongestLeads = [...normalizedLeads]
    .sort((a, b) => getLeadStrength(b) - getLeadStrength(a))
    .slice(0, 6)

  const openTasks = tasks.filter((task) => (task.status || 'open') !== 'completed')
  const urgentTasks = openTasks.filter((task) =>
    ['urgent', 'high'].includes((task.priority || '').toLowerCase())
  )
  const overdueTasks = openTasks.filter((task) => isOverdue(getTaskDueValue(task)))

  const suggestedActions = useMemo(() => {
    const items: string[] = []

    if (inboxCount > 0) {
      items.push(`${inboxCount} leads are sitting in Lead Inbox and need first promotion.`)
    }

    if (urgentTasks.length > 0) {
      items.push(`${urgentTasks.length} tasks are marked high priority and should be handled first.`)
    }

    const noActionCount = normalizedLeads.filter(
      (lead) => lead.status !== 'closed' && !lead.next_action
    ).length

    if (noActionCount > 0) {
      items.push(`${noActionCount} active leads do not have a next action set.`)
    }

    const weakLeads = normalizedLeads.filter(
      (lead) =>
        !['lead_inbox', 'closed'].includes(lead.status || '') &&
        getLeadStrength(lead) <= 40
    ).length

    if (weakLeads > 0) {
      items.push(`${weakLeads} active leads are weakly filled and need more data.`)
    }

    if (items.length === 0) {
      items.push('No major blockers right now. Keep advancing active stages.')
    }

    return items.slice(0, 5)
  }, [inboxCount, normalizedLeads, urgentTasks.length])

  return (
    <PageShell
      title="Dashboard"
      subtitle="High-level operating picture across leads, tasks, and deal flow."
      actions={
        <>
          <ActionButton onClick={() => void loadDashboard()}>Refresh</ActionButton>
          <Link href="/leads">
            <ActionButton>Open Leads</ActionButton>
          </Link>
        </>
      }
    >
      <div style={statsGridStyle}>
        <StatPill label="Total Leads" value={totalLeads} />
        <StatPill label="Inbox" value={inboxCount} />
        <StatPill label="Active" value={activeCount} />
        <StatPill label="Under Contract" value={underContractCount} />
        <StatPill label="Avg Strength" value={avgStrength} />
        <StatPill label="High Risk" value={highRiskCount} />
      </div>

      <div style={topGridStyle}>
        <SectionCard title="Pipeline Distribution" subtitle="Using live CRM lead rows, not placeholder data.">
          <div style={barListStyle}>
            {stageSeries.map((item) => (
              <div key={item.stage} style={barRowStyle}>
                <div style={barLabelStyle}>{item.label}</div>
                <div style={barTrackStyle}>
                  <div
                    style={{
                      ...barFillStyle,
                      width: `${(item.count / maxStageCount) * 100}%`,
                      background: item.hex,
                    }}
                  />
                </div>
                <div style={barCountStyle}>{item.count}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Value Snapshot" subtitle="Totals from normalized CRM values.">
          <div style={valueGridStyle}>
            <MiniMetric label="Visible Value" value={compactMoney(visibleValue)} />
            <MiniMetric label="Visible Equity" value={compactMoney(visibleEquity)} />
            <MiniMetric label="Projected Spread" value={compactMoney(projectedSpread)} />
            <MiniMetric label="Assignment Fees" value={compactMoney(assignmentFeeTotal)} />
          </div>
        </SectionCard>
      </div>

      <div style={topGridStyle}>
        <SectionCard title="Lead Types" subtitle="Current CRM lead composition by type.">
          <div style={typeGridStyle}>
            {leadTypeSeries.map((item) => (
              <div
                key={item.key}
                style={{
                  ...typeCardStyle,
                  background: item.bg,
                  borderColor: item.border,
                  color: item.text,
                }}
              >
                <div style={typeLabelStyle}>{item.label}</div>
                <div style={typeCountStyle}>{item.count}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Task Pressure" subtitle="What needs attention today.">
          <div style={valueGridStyle}>
            <MiniMetric label="Open Tasks" value={openTasks.length} />
            <MiniMetric label="Urgent" value={urgentTasks.length} />
            <MiniMetric label="Overdue" value={overdueTasks.length} />
            <MiniMetric label="Deals" value={deals.length} />
          </div>
        </SectionCard>
      </div>

      <div style={bottomGridStyle}>
        <SectionCard title="Strongest Leads" subtitle="Highest completeness and readiness right now.">
          <div style={leadListStyle}>
            {loading ? (
              <div className="crm-muted">Loading dashboard...</div>
            ) : strongestLeads.length === 0 ? (
              <div className="crm-muted">No leads yet.</div>
            ) : (
              strongestLeads.map((lead) => (
                <div key={lead.id} style={leadCardStyle}>
                  <div style={leadTopStyle}>
                    <div>
                      <div style={leadTitleStyle}>{lead.property_address_1 || 'Unknown property'}</div>
                      <div style={leadSubStyle}>
                        {[lead.city, lead.state].filter(Boolean).join(', ') || 'Location pending'}
                      </div>
                    </div>
                    <span className="crm-badge soft">{getLeadReadiness(lead)}</span>
                  </div>

                  <div style={leadMetricRowStyle}>
                    <span>Owner: {lead.owner_name || '—'}</span>
                    <span>Value: {formatMoney(lead.resolved_value)}</span>
                    <span>Beds/Baths: {lead.bedrooms ?? '—'} / {lead.bathrooms ?? '—'}</span>
                    <span>Strength: {getLeadStrength(lead)}</span>
                    <span>Ownership: {lead.ownership_length ? `${lead.ownership_length} yrs` : '—'}</span>
                  </div>

                  <div style={leadActionRowStyle}>
                    <span className="crm-muted">{lead.next_action || 'No next action set.'}</span>
                    <Link href={`/leads/${lead.id}`}>
                      <ActionButton>Open Workspace</ActionButton>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Suggested Actions" subtitle="System-level cleanup items.">
          <div style={actionListStyle}>
            {suggestedActions.map((item, index) => (
              <div key={`${item}-${index}`} style={actionItemStyle}>
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  )
}

function MiniMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div style={miniMetricStyle}>
      <div style={miniMetricLabelStyle}>{label}</div>
      <div style={miniMetricValueStyle}>{value}</div>
    </div>
  )
}

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
}

const topGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
  gap: 18,
  width: '100%',
  alignItems: 'stretch',
}

const bottomGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
  gap: 18,
  width: '100%',
  alignItems: 'stretch',
}

const barListStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const barRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '140px minmax(0, 1fr) 36px',
  gap: 10,
  alignItems: 'center',
}

const barLabelStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--text-soft)',
}

const barTrackStyle: CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  overflow: 'hidden',
}

const barFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
}

const barCountStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--text)',
  fontWeight: 700,
  textAlign: 'right',
}

const valueGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
}

const miniMetricStyle: CSSProperties = {
  borderRadius: 16,
  border: '1px solid var(--line)',
  background: 'rgba(255,255,255,0.02)',
  padding: 12,
  display: 'grid',
  gap: 6,
}

const miniMetricLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-faint)',
}

const miniMetricValueStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--text)',
}

const typeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
}

const typeCardStyle: CSSProperties = {
  borderRadius: 16,
  border: '1px solid',
  padding: 14,
  display: 'grid',
  gap: 8,
}

const typeLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
}

const typeCountStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1,
}

const leadListStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  width: '100%',
}

const leadCardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid var(--line)',
  background: 'rgba(255,255,255,0.02)',
  padding: 14,
  display: 'grid',
  gap: 10,
}

const leadTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const leadTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text)',
}

const leadSubStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'var(--text-soft)',
}

const leadMetricRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  fontSize: 12,
  color: 'var(--text-soft)',
}

const leadActionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const actionListStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  width: '100%',
}

const actionItemStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid var(--line)',
  background: 'rgba(255,255,255,0.02)',
  padding: 12,
  fontSize: 13,
  color: 'var(--text-soft)',
}