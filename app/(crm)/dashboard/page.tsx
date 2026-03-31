'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import StatPill from '@/components/ui/stat-pill'
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

type GraphMode = 'stage_distribution' | 'lead_types' | 'lead_strength'

type GraphSeriesItem = {
  key: string
  label: string
  count: number
  color: string
  soft: string
  glow: string
}

const STAGES = [
  'lead_inbox',
  'new_lead',
  'skip_trace',
  'contact_attempted',
  'contacted',
  'follow_up',
  'appointment_set',
  'offer_sent',
  'negotiation',
  'verbal_yes',
  'under_contract',
  'title_opened',
  'buyer_marketing',
  'assigned',
  'double_close',
  'closed',
  'dead',
] as const

const STAGE_META: Record<string, { label: string; color: string; soft: string; glow: string }> = {
  lead_inbox: { label: 'Lead Inbox', color: '#67e8f9', soft: 'rgba(103,232,249,0.10)', glow: 'rgba(103,232,249,0.35)' },
  new_lead: { label: 'New Lead', color: '#22d3ee', soft: 'rgba(34,211,238,0.10)', glow: 'rgba(34,211,238,0.34)' },
  skip_trace: { label: 'Skip Trace', color: '#38bdf8', soft: 'rgba(56,189,248,0.10)', glow: 'rgba(56,189,248,0.34)' },
  contact_attempted: { label: 'Contact Attempted', color: '#f59e0b', soft: 'rgba(245,158,11,0.10)', glow: 'rgba(245,158,11,0.30)' },
  contacted: { label: 'Contacted', color: '#2dd4bf', soft: 'rgba(45,212,191,0.10)', glow: 'rgba(45,212,191,0.32)' },
  follow_up: { label: 'Follow Up', color: '#818cf8', soft: 'rgba(129,140,248,0.10)', glow: 'rgba(129,140,248,0.30)' },
  appointment_set: { label: 'Appointment Set', color: '#06b6d4', soft: 'rgba(6,182,212,0.10)', glow: 'rgba(6,182,212,0.30)' },
  offer_sent: { label: 'Offer Sent', color: '#fbbf24', soft: 'rgba(251,191,36,0.10)', glow: 'rgba(251,191,36,0.30)' },
  negotiation: { label: 'Negotiation', color: '#c084fc', soft: 'rgba(192,132,252,0.10)', glow: 'rgba(192,132,252,0.30)' },
  verbal_yes: { label: 'Verbal Yes', color: '#a3e635', soft: 'rgba(163,230,53,0.10)', glow: 'rgba(163,230,53,0.28)' },
  under_contract: { label: 'Under Contract', color: '#10b981', soft: 'rgba(16,185,129,0.10)', glow: 'rgba(16,185,129,0.28)' },
  title_opened: { label: 'Title Opened', color: '#60a5fa', soft: 'rgba(96,165,250,0.10)', glow: 'rgba(96,165,250,0.30)' },
  buyer_marketing: { label: 'Buyer Marketing', color: '#8b5cf6', soft: 'rgba(139,92,246,0.10)', glow: 'rgba(139,92,246,0.30)' },
  assigned: { label: 'Assigned', color: '#14b8a6', soft: 'rgba(20,184,166,0.10)', glow: 'rgba(20,184,166,0.28)' },
  double_close: { label: 'Double Close', color: '#fb7185', soft: 'rgba(251,113,133,0.10)', glow: 'rgba(251,113,133,0.28)' },
  closed: { label: 'Closed', color: '#22c55e', soft: 'rgba(34,197,94,0.10)', glow: 'rgba(34,197,94,0.28)' },
  dead: { label: 'Dead', color: '#94a3b8', soft: 'rgba(148,163,184,0.08)', glow: 'rgba(148,163,184,0.18)' },
}

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
    status: normalizeStatus(lead.status),
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

function getStrengthBucket(score: number) {
  if (score >= 80) return '80-100'
  if (score >= 60) return '60-79'
  if (score >= 40) return '40-59'
  if (score >= 20) return '20-39'
  return '0-19'
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [deals, setDeals] = useState<DealRow[]>([])
  const [loading, setLoading] = useState(true)
  const [graphMode, setGraphMode] = useState<GraphMode>('stage_distribution')

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
    (lead) => !['lead_inbox', 'closed', 'dead'].includes(lead.status || '')
  ).length
  const underContractCount = normalizedLeads.filter((lead) => lead.status === 'under_contract').length
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

  const stageSeries: GraphSeriesItem[] = useMemo(
    () =>
      STAGES.map((stage) => ({
        key: stage,
        label: STAGE_META[stage].label,
        count: normalizedLeads.filter((lead) => lead.status === stage).length,
        color: STAGE_META[stage].color,
        soft: STAGE_META[stage].soft,
        glow: STAGE_META[stage].glow,
      })),
    [normalizedLeads]
  )

  const leadTypeSeries: GraphSeriesItem[] = useMemo(() => {
    const items = [
      { key: 'standard', label: 'Standard', color: '#38bdf8', soft: 'rgba(56,189,248,0.10)', glow: 'rgba(56,189,248,0.32)' },
      { key: 'foreclosure', label: 'Foreclosure', color: '#fb7185', soft: 'rgba(251,113,133,0.10)', glow: 'rgba(251,113,133,0.28)' },
      { key: 'tax_lien', label: 'Tax Lien', color: '#f59e0b', soft: 'rgba(245,158,11,0.10)', glow: 'rgba(245,158,11,0.28)' },
      { key: 'foreclosure_tax_lien', label: 'Foreclosure + Tax', color: '#8b5cf6', soft: 'rgba(139,92,246,0.10)', glow: 'rgba(139,92,246,0.28)' },
    ]
    return items.map((item) => ({
      ...item,
      count: normalizedLeads.filter((lead) => normalizeLeadType(lead.lead_type) === item.key).length,
    }))
  }, [normalizedLeads])

  const strengthSeries: GraphSeriesItem[] = useMemo(() => {
    const items = [
      { key: '0-19', label: '0-19', color: '#fb7185', soft: 'rgba(251,113,133,0.10)', glow: 'rgba(251,113,133,0.28)' },
      { key: '20-39', label: '20-39', color: '#f97316', soft: 'rgba(249,115,22,0.10)', glow: 'rgba(249,115,22,0.28)' },
      { key: '40-59', label: '40-59', color: '#f59e0b', soft: 'rgba(245,158,11,0.10)', glow: 'rgba(245,158,11,0.28)' },
      { key: '60-79', label: '60-79', color: '#22d3ee', soft: 'rgba(34,211,238,0.10)', glow: 'rgba(34,211,238,0.28)' },
      { key: '80-100', label: '80-100', color: '#38bdf8', soft: 'rgba(56,189,248,0.10)', glow: 'rgba(56,189,248,0.32)' },
    ]
    return items.map((item) => ({
      ...item,
      count: normalizedLeads.filter((lead) => getStrengthBucket(getLeadStrength(lead)) === item.key).length,
    }))
  }, [normalizedLeads])

  const graphSeries =
    graphMode === 'stage_distribution'
      ? stageSeries
      : graphMode === 'lead_types'
        ? leadTypeSeries
        : strengthSeries

  const maxGraphValue = Math.max(...graphSeries.map((item) => item.count), 1)

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

    if (inboxCount > 0) items.push(`${inboxCount} leads are sitting in Lead Inbox and need first promotion.`)
    if (urgentTasks.length > 0) items.push(`${urgentTasks.length} tasks are marked high priority and should be handled first.`)

    const noActionCount = normalizedLeads.filter(
      (lead) => lead.status !== 'closed' && lead.status !== 'dead' && !lead.next_action
    ).length
    if (noActionCount > 0) items.push(`${noActionCount} active leads do not have a next action set.`)

    const weakLeads = normalizedLeads.filter(
      (lead) =>
        !['lead_inbox', 'closed', 'dead'].includes(lead.status || '') &&
        getLeadStrength(lead) <= 40
    ).length
    if (weakLeads > 0) items.push(`${weakLeads} active leads are weakly filled and need more data.`)

    if (items.length === 0) items.push('No major blockers right now. Keep advancing active stages.')

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
      <div style={heroStripStyle}>
        <HeroMetric title="Visible Pipeline Value" value={compactMoney(visibleValue)} tone="cyan" />
        <HeroMetric title="Visible Equity" value={compactMoney(visibleEquity)} tone="teal" />
        <HeroMetric title="Projected Spread" value={compactMoney(projectedSpread)} tone="amber" />
        <HeroMetric title="Assignment Fees" value={compactMoney(assignmentFeeTotal)} tone="violet" />
      </div>

      <div style={statsGridStyle}>
        <StatPill label="Total Leads" value={totalLeads} />
        <StatPill label="Inbox" value={inboxCount} />
        <StatPill label="Active" value={activeCount} />
        <StatPill label="Under Contract" value={underContractCount} />
        <StatPill label="Avg Strength" value={avgStrength} />
        <StatPill label="High Risk" value={highRiskCount} />
      </div>

      <div style={topGridStyle}>
        <SectionCard
          title="Performance Graphs"
          subtitle="Switch between live stage distribution, lead types, and strength bands."
          actions={
            <div style={toggleRowStyle}>
              <GraphToggle active={graphMode === 'stage_distribution'} onClick={() => setGraphMode('stage_distribution')}>
                Stages
              </GraphToggle>
              <GraphToggle active={graphMode === 'lead_types'} onClick={() => setGraphMode('lead_types')}>
                Lead Types
              </GraphToggle>
              <GraphToggle active={graphMode === 'lead_strength'} onClick={() => setGraphMode('lead_strength')}>
                Strength
              </GraphToggle>
            </div>
          }
        >
          <div style={verticalChartStyle}>
            {graphSeries.map((item) => (
              <div key={item.key} style={chartColumnWrapStyle}>
                <div style={chartValueStyle}>{item.count}</div>
                <div style={chartTrackStyle}>
                  <div
                    style={{
                      ...chartBarStyle,
                      height: `${Math.max((item.count / maxGraphValue) * 100, item.count > 0 ? 10 : 0)}%`,
                      background: `linear-gradient(180deg, ${item.color}, ${item.color}cc 55%, ${item.color}88)`,
                      boxShadow: `0 0 12px ${item.glow}, 0 0 26px ${item.glow}`,
                    }}
                  />
                </div>
                <div style={chartLabelStyle}>{item.label}</div>
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

      <div style={topGridStyle}>
        <SectionCard title="Lead Types" subtitle="Current CRM lead composition by type.">
          <div style={typeGridStyle}>
            {leadTypeSeries.map((item) => (
              <div
                key={item.key}
                style={{
                  ...typeCardStyle,
                  borderColor: `${item.color}55`,
                  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
                  boxShadow: `inset 0 0 14px ${item.glow}`,
                }}
              >
                <div style={typeLabelStyle}>{item.label}</div>
                <div style={{ ...typeCountStyle, color: item.color, textShadow: `0 0 14px ${item.glow}` }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Stage Health" subtitle="Where leads are currently sitting.">
          <div style={stageHealthStyle}>
            {stageSeries.map((item) => (
              <div
                key={item.key}
                style={{
                  ...stageHealthRowStyle,
                  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
                  boxShadow: `inset 0 0 10px ${item.glow}`,
                  borderColor: `${item.color}26`,
                }}
              >
                <div style={stageHealthLeftStyle}>
                  <span style={{ ...stageDotStyle, background: item.color, boxShadow: `0 0 12px ${item.glow}` }} />
                  <span style={stageHealthLabelStyle}>{item.label}</span>
                </div>
                <span style={{ ...stageHealthValueStyle, color: item.color }}>{item.count}</span>
              </div>
            ))}
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
                <div style={leadCardStyle} key={lead.id}>
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

function GraphToggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        border: `1px solid ${active ? 'rgba(34,211,238,0.42)' : 'rgba(255,255,255,0.08)'}`,
        background: active
          ? 'linear-gradient(180deg, rgba(34,211,238,0.14), rgba(34,211,238,0.05))'
          : 'linear-gradient(180deg, rgba(4,6,12,0.98), rgba(0,0,0,1))',
        color: active ? '#8ff6ff' : 'var(--white-soft)',
        padding: '7px 12px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: active ? '0 0 14px rgba(34,211,238,0.18)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function HeroMetric({
  title,
  value,
  tone,
}: {
  title: string
  value: string
  tone: 'cyan' | 'teal' | 'amber' | 'violet'
}) {
  const tones: Record<string, CSSProperties> = {
    cyan: {
      borderColor: 'rgba(56,189,248,0.28)',
      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
      boxShadow: 'inset 0 0 16px rgba(56,189,248,0.10), 0 0 18px rgba(56,189,248,0.08)',
    },
    teal: {
      borderColor: 'rgba(34,211,238,0.28)',
      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
      boxShadow: 'inset 0 0 16px rgba(34,211,238,0.10), 0 0 18px rgba(34,211,238,0.08)',
    },
    amber: {
      borderColor: 'rgba(245,158,11,0.28)',
      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
      boxShadow: 'inset 0 0 16px rgba(245,158,11,0.10), 0 0 18px rgba(245,158,11,0.08)',
    },
    violet: {
      borderColor: 'rgba(139,92,246,0.28)',
      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
      boxShadow: 'inset 0 0 16px rgba(139,92,246,0.10), 0 0 18px rgba(139,92,246,0.08)',
    },
  }

  return (
    <div style={{ ...heroCardStyle, ...tones[tone] }}>
      <div style={heroLabelStyle}>{title}</div>
      <div style={heroValueStyle}>{value}</div>
    </div>
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

const heroStripStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
}

const heroCardStyle: CSSProperties = {
  borderRadius: 18,
  padding: 16,
  border: '1px solid transparent',
  display: 'grid',
  gap: 8,
}

const heroLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--white-faint)',
}

const heroValueStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  color: '#f6fbff',
  lineHeight: 1,
}

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
}

const topGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.18fr) minmax(360px, 0.82fr)',
  gap: 18,
  width: '100%',
  alignItems: 'stretch',
}

const bottomGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.18fr) minmax(360px, 0.82fr)',
  gap: 18,
  width: '100%',
  alignItems: 'stretch',
}

const toggleRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const verticalChartStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(58px, 1fr))',
  gap: 14,
  alignItems: 'end',
  minHeight: 300,
  paddingTop: 10,
}

const chartColumnWrapStyle: CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'auto 220px auto',
  gap: 8,
  alignItems: 'end',
}

const chartValueStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--white-soft)',
  textAlign: 'center',
}

const chartTrackStyle: CSSProperties = {
  height: 220,
  borderRadius: 14,
  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
  border: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '8px 8px 10px',
  boxShadow: 'inset 0 0 16px rgba(255,255,255,0.02)',
}

const chartBarStyle: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  minHeight: 0,
}

const chartLabelStyle: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.35,
  color: 'var(--white-soft)',
  textAlign: 'center',
}

const valueGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
}

const miniMetricStyle: CSSProperties = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.05)',
  background: 'linear-gradient(180deg, rgba(4,6,12,0.98), rgba(0,0,0,1))',
  padding: 12,
  display: 'grid',
  gap: 6,
  boxShadow: 'inset 0 0 12px rgba(255,255,255,0.02)',
}

const miniMetricLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--white-faint)',
}

const miniMetricValueStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: '#f8fcff',
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
  color: 'var(--white-soft)',
}

const typeCountStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1,
}

const stageHealthStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  maxHeight: 390,
  overflowY: 'auto',
  paddingRight: 4,
}

const stageHealthRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.05)',
}

const stageHealthLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
}

const stageDotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  flexShrink: 0,
}

const stageHealthLabelStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--white-soft)',
}

const stageHealthValueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
}

const leadListStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  width: '100%',
}

const leadCardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.05)',
  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
  padding: 14,
  display: 'grid',
  gap: 10,
  boxShadow: 'inset 0 0 10px rgba(255,255,255,0.02)',
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
  color: '#f6fbff',
}

const leadSubStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'var(--white-soft)',
}

const leadMetricRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  fontSize: 12,
  color: 'var(--white-soft)',
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
  border: '1px solid rgba(255,255,255,0.05)',
  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98), rgba(0,0,0,1))',
  padding: 12,
  fontSize: 13,
  color: 'var(--white-soft)',
  boxShadow: 'inset 0 0 10px rgba(255,255,255,0.02)',
}