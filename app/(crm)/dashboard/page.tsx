'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import StatPill from '@/components/ui/stat-pill'
import { getStageHex, getStageLabel } from '@/lib/ui/stage-colors'

type LeadRow = {
  id: string
  property_address_1: string | null
  city: string | null
  state: string | null
  owner_name: string | null
  owner_phone_primary: string | null
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
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  priority: string | null
  created_at: string | null
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
  return status || 'lead_inbox'
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

function getLeadStrength(lead: LeadRow) {
  let score = 0
  if (lead.owner_name) score += 20
  if (lead.owner_phone_primary) score += 20
  if (lead.asking_price != null) score += 20
  if (lead.mao != null) score += 20
  if (lead.arv != null || lead.projected_spread != null) score += 20
  return score
}

function getLeadReadiness(lead: LeadRow) {
  const strength = getLeadStrength(lead)
  if (strength >= 80) return 'Ready'
  if (strength >= 50) return 'Building'
  return 'Early'
}

function daysSince(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const diff = Date.now() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function isOverdue(value: string | null | undefined) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() < Date.now()
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

  async function loadDashboard() {
    setLoading(true)

    const [
      { data: leadData, error: leadError },
      { data: taskData, error: taskError },
      { data: dealData, error: dealError },
    ] = await Promise.all([
      supabase
        .from('leads')
        .select(`
          id,
          property_address_1,
          city,
          state,
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
          mortgage_balance
        `)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          due_date,
          lead_id
        `)
        .order('created_at', { ascending: false })
        .limit(80),
      supabase
        .from('deals')
        .select(`
          id,
          status,
          assignment_fee,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    setLoading(false)

    if (leadError) {
      alert(leadError.message)
      return
    }

    if (taskError) {
      alert(taskError.message)
      return
    }

    if (dealError) {
      alert(dealError.message)
      return
    }

    setLeads((leadData || []) as LeadRow[])
    setTasks((taskData || []) as TaskRow[])
    setDeals((dealData || []) as DealRow[])
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const totalLeads = leads.length
  const inboxCount = leads.filter((lead) => normalizeStatus(lead.status) === 'lead_inbox').length
  const activeCount = leads.filter(
    (lead) => !['lead_inbox', 'closed'].includes(normalizeStatus(lead.status))
  ).length
  const underContractCount = leads.filter(
    (lead) => normalizeStatus(lead.status) === 'under_contract'
  ).length
  const highRiskCount = leads.filter((lead) => getLeadStrength(lead) <= 20).length
  const avgStrength =
    leads.length > 0
      ? Math.round(leads.reduce((sum, lead) => sum + getLeadStrength(lead), 0) / leads.length)
      : 0
  const projectedSpread = leads.reduce((sum, lead) => sum + (lead.projected_spread || 0), 0)
  const visibleEquity = leads.reduce((sum, lead) => sum + (lead.equity_amount || 0), 0)
  const visibleValue = leads.reduce(
    (sum, lead) =>
      sum + (lead.house_value ?? lead.estimated_value ?? lead.market_value ?? lead.arv ?? 0),
    0
  )
  const assignmentFeeTotal = deals.reduce((sum, deal) => sum + (deal.assignment_fee || 0), 0)

  const stageSeries = STAGES.map((stage) => {
    const count = leads.filter((lead) => normalizeStatus(lead.status) === stage).length
    return {
      stage,
      label: getStageLabel(stage),
      count,
      hex: getStageHex(stage),
    }
  })

  const maxStageCount = Math.max(...stageSeries.map((item) => item.count), 1)

  const leadTypeSeries = useMemo(() => {
    const buckets = ['standard', 'foreclosure', 'tax_lien', 'foreclosure_tax_lien'] as const
    return buckets.map((key) => {
      const style = LEAD_TYPE_STYLES[key]
      return {
        key,
        label: style.label,
        count: leads.filter((lead) => normalizeLeadType(lead.lead_type) === key).length,
        bg: style.bg,
        border: style.border,
        text: style.text,
      }
    })
  }, [leads])

  const strongestLeads = [...leads]
    .sort((a, b) => getLeadStrength(b) - getLeadStrength(a))
    .slice(0, 4)

  const openTasks = tasks.filter((task) => (task.status || 'open') !== 'completed')
  const urgentTasks = openTasks.filter((task) =>
    ['urgent', 'high'].includes((task.priority || '').toLowerCase())
  )
  const overdueTasks = openTasks.filter((task) => isOverdue(task.due_date))

  const suggestedActions = useMemo(() => {
    const items: string[] = []

    if (inboxCount > 0) {
      items.push(`${inboxCount} leads are sitting in Lead Inbox and need first promotion.`)
    }

    if (urgentTasks.length > 0) {
      items.push(`${urgentTasks.length} tasks are marked high priority and should be handled first.`)
    }

    const noActionCount = leads.filter(
      (lead) => normalizeStatus(lead.status) !== 'closed' && !lead.next_action
    ).length

    if (noActionCount > 0) {
      items.push(`${noActionCount} active leads do not have a next action set.`)
    }

    const noAskingCount = leads.filter(
      (lead) =>
        !['lead_inbox', 'closed'].includes(normalizeStatus(lead.status)) &&
        lead.asking_price == null
    ).length

    if (noAskingCount > 0) {
      items.push(`${noAskingCount} active leads are missing asking price.`)
    }

    const weakLeads = leads.filter(
      (lead) =>
        !['lead_inbox', 'closed'].includes(normalizeStatus(lead.status)) &&
        getLeadStrength(lead) <= 40
    ).length

    if (weakLeads > 0) {
      items.push(`${weakLeads} active leads are weakly filled and need more data.`)
    }

    if (items.length === 0) {
      items.push('No major blockers right now. Keep advancing active stages.')
    }

    return items.slice(0, 5)
  }, [inboxCount, urgentTasks.length, leads])

  const urgentQueue = useMemo(() => {
    return [...leads]
      .filter((lead) =>
        ['researching', 'contacted', 'follow_up', 'negotiation'].includes(
          normalizeStatus(lead.status)
        )
      )
      .sort((a, b) => (b.equity_amount || 0) - (a.equity_amount || 0))
      .slice(0, 5)
  }, [leads])

  const staleLeads = useMemo(() => {
    return leads
      .map((lead) => ({
        ...lead,
        staleDays: daysSince(lead.updated_at || lead.created_at),
      }))
      .filter((lead) => (lead.staleDays || 0) >= 7)
      .sort((a, b) => (b.staleDays || 0) - (a.staleDays || 0))
      .slice(0, 5)
  }, [leads])

  return (
    <PageShell
      title="Dashboard"
      subtitle="Premium operating view for live lead flow, execution pressure, and next priorities."
      actions={
        <>
          <StatPill label="Active Leads" value={activeCount} />
          <StatPill
            label="Offer Ready"
            value={stageSeries.find((s) => s.stage === 'offer_sent')?.count || 0}
          />
          <StatPill label="Under Contract" value={underContractCount} />
          <StatPill label="High Risk" value={highRiskCount} />
        </>
      }
    >
      <SectionCard
        title="Lead Volume"
        subtitle="Current operating snapshot across the CRM."
        actions={<ActionButton onClick={loadDashboard}>Refresh</ActionButton>}
      >
        <div style={snapshotRowStyle}>
          <MetricCard label="Total Leads" value={String(totalLeads)} />
          <MetricCard label="Lead Inbox" value={String(inboxCount)} />
          <MetricCard label="Projected Spread" value={formatMoney(projectedSpread)} />
          <MetricCard label="Avg Strength" value={`${avgStrength}%`} />
          <MetricCard label="Open Tasks" value={String(openTasks.length)} />
          <MetricCard label="Urgent Tasks" value={String(urgentTasks.length)} />
        </div>

        <div style={commandGridStyle}>
          <QuickActionCard
            title="Open Pipeline"
            copy="Move deals through the board."
            href="/pipeline"
            tone="ice"
          />
          <QuickActionCard
            title="New Lead"
            copy="Jump into lead review and qualification."
            href="/leads"
            tone="gold"
          />
          <QuickActionCard
            title="Imports"
            copy="Push fresh source data into the CRM."
            href="/imports"
            tone="green"
          />
          <QuickActionCard
            title="Tasks"
            copy="Handle pressure and follow-up fast."
            href="/tasks"
            tone="gold"
          />
        </div>

        <div style={summaryStripStyle}>
          <SummaryTile label="Visible Value" value={formatMoney(visibleValue)} tone="ice" />
          <SummaryTile label="Visible Equity" value={formatMoney(visibleEquity)} tone="green" />
          <SummaryTile label="Assignment Fees" value={formatMoney(assignmentFeeTotal)} tone="gold" />
          <SummaryTile label="Overdue Tasks" value={String(overdueTasks.length)} tone="ice" />
        </div>
      </SectionCard>

      <div style={dashboardGridStyle}>
        <SectionCard
          title="Deal Intelligence"
          subtitle="Live stage distribution from real lead statuses."
        >
          {loading ? (
            <div className="crm-muted">Loading chart...</div>
          ) : (
            <div style={chartWrapStyle}>
              <div style={chartBarsStyle}>
                {stageSeries.map((item) => (
                  <div key={item.stage} style={chartColStyle}>
                    <div style={chartValueStyle}>{item.count}</div>
                    <div style={chartTrackStyle}>
                      <div
                        style={{
                          ...chartBarStyle,
                          height: `${Math.max(
                            (item.count / maxStageCount) * 180,
                            item.count > 0 ? 16 : 6
                          )}px`,
                          background: `linear-gradient(180deg, ${item.hex}, rgba(214,166,75,0.88))`,
                          boxShadow: `0 0 18px ${item.hex}33`,
                        }}
                      />
                    </div>
                    <div style={chartLabelStyle}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Pipeline Distribution"
          subtitle="Quick read on where the board is stacked."
        >
          {loading ? (
            <div className="crm-muted">Loading distribution...</div>
          ) : (
            <div style={distributionStackStyle}>
              {stageSeries.map((item) => {
                const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0

                return (
                  <div key={item.stage} style={distributionRowStyle}>
                    <div style={distributionRowTopStyle}>
                      <span style={distributionNameStyle}>{item.label}</span>
                      <span style={distributionPctStyle}>{pct}%</span>
                    </div>
                    <div style={distributionTrackStyle}>
                      <div
                        style={{
                          ...distributionFillStyle,
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${item.hex}, #d6a64b)`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={dashboardGridStyle}>
        <SectionCard
          title="Lead Type Mix"
          subtitle="Distress composition across the current lead pool."
        >
          {loading ? (
            <div className="crm-muted">Loading lead types...</div>
          ) : (
            <div style={typeMixStackStyle}>
              {leadTypeSeries.map((item) => {
                const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0

                return (
                  <div key={item.key} style={typeMixRowStyle}>
                    <div style={distributionRowTopStyle}>
                      <span style={distributionNameStyle}>{item.label}</span>
                      <span style={{ ...distributionPctStyle, color: item.text }}>{pct}%</span>
                    </div>
                    <div style={distributionTrackStyle}>
                      <div
                        style={{
                          ...distributionFillStyle,
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${item.text}, #d6a64b)`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Task Pressure"
          subtitle="Open follow-ups and reminders still needing execution."
        >
          {loading ? (
            <div className="crm-muted">Loading tasks...</div>
          ) : openTasks.length === 0 ? (
            <div style={emptyStateStyle}>No open tasks.</div>
          ) : (
            <div style={stackStyle}>
              {openTasks.slice(0, 5).map((task) => (
                <div key={task.id} style={taskStripStyle}>
                  <div>
                    <div style={taskStripTitleStyle}>{task.title || 'Untitled Task'}</div>
                    <div style={taskStripSubStyle}>
                      {task.created_at
                        ? `Created ${new Date(task.created_at).toLocaleDateString()}`
                        : 'No date'}
                    </div>
                  </div>
                  <span style={taskStripBadgeStyle}>{task.priority || 'normal'}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={dashboardGridStyle}>
        <SectionCard
          title="Suggested Actions"
          subtitle="System-prioritized operating moves based on real CRM state."
        >
          {loading ? (
            <div className="crm-muted">Loading actions...</div>
          ) : (
            <div style={stackStyle}>
              {suggestedActions.map((item, index) => (
                <div key={`${item}-${index}`} style={suggestedActionStyle}>
                  <span style={suggestedDotStyle} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Urgent Queue"
          subtitle="High-opportunity active leads worth attention now."
        >
          {loading ? (
            <div className="crm-muted">Loading urgent queue...</div>
          ) : urgentQueue.length === 0 ? (
            <div style={emptyStateStyle}>No urgent queue right now.</div>
          ) : (
            <div style={stackStyle}>
              {urgentQueue.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                  <div style={queueCardStyle}>
                    <div style={queueTopStyle}>
                      <div>
                        <div style={strongTitleStyle}>{lead.property_address_1 || 'Untitled Lead'}</div>
                        <div style={strongSubStyle}>
                          {[lead.city, lead.state].filter(Boolean).join(', ') || '—'}
                        </div>
                      </div>
                      <span style={strongScoreStyle}>{compactMoney(lead.equity_amount)}</span>
                    </div>

                    <div style={strongMetaRowStyle}>
                      <span>{lead.next_action || 'Continue qualification'}</span>
                      <span>{compactMoney(lead.house_value ?? lead.estimated_value ?? lead.market_value ?? lead.arv)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={dashboardGridStyle}>
        <SectionCard
          title="Strongest Leads"
          subtitle="Highest-strength opportunities currently in the system."
        >
          {loading ? (
            <div className="crm-muted">Loading strongest leads...</div>
          ) : strongestLeads.length === 0 ? (
            <div style={emptyStateStyle}>No leads yet.</div>
          ) : (
            <div style={strongGridStyle}>
              {strongestLeads.map((lead) => (
                <div key={lead.id} style={strongCardStyle}>
                  <div style={strongTopStyle}>
                    <div>
                      <div style={strongTitleStyle}>
                        {lead.property_address_1 || 'Untitled Lead'}
                      </div>
                      <div style={strongSubStyle}>
                        {[lead.city, lead.state].filter(Boolean).join(', ') || '—'}
                      </div>
                    </div>
                    <span style={strongScoreStyle}>{getLeadStrength(lead)}%</span>
                  </div>

                  <div style={strongMetaRowStyle}>
                    <span>{lead.next_action || 'Continue qualification'}</span>
                    <span>{formatMoney(lead.projected_spread)}</span>
                  </div>

                  <div style={strongActionRowStyle}>
                    <Link href={`/leads/${lead.id}`}>
                      <ActionButton compact>Open</ActionButton>
                    </Link>
                    <Link href="/pipeline">
                      <ActionButton compact>Pipeline</ActionButton>
                    </Link>
                    {lead.owner_phone_primary ? (
                      <a href={`tel:${lead.owner_phone_primary}`}>
                        <ActionButton compact>Call</ActionButton>
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Stale Lead Pressure"
          subtitle="Leads not touched recently so they do not disappear."
        >
          {loading ? (
            <div className="crm-muted">Loading stale leads...</div>
          ) : staleLeads.length === 0 ? (
            <div style={emptyStateStyle}>No stale leads right now.</div>
          ) : (
            <div style={stackStyle}>
              {staleLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                  <div style={staleCardStyle}>
                    <div style={queueTopStyle}>
                      <div>
                        <div style={strongTitleStyle}>
                          {lead.property_address_1 || 'Untitled Lead'}
                        </div>
                        <div style={strongSubStyle}>
                          {[lead.city, lead.state].filter(Boolean).join(', ') || '—'}
                        </div>
                      </div>
                      <span style={staleBadgeStyle}>{lead.staleDays}d stale</span>
                    </div>

                    <div style={taskStripSubStyle}>
                      {lead.owner_name || 'No owner name'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
    </div>
  )
}

function QuickActionCard({
  title,
  copy,
  href,
  tone,
}: {
  title: string
  copy: string
  href: string
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? {
          border: 'rgba(214,166,75,0.26)',
          bg: 'rgba(214,166,75,0.10)',
          text: '#f3d899',
        }
      : tone === 'ice'
        ? {
            border: 'rgba(147,197,253,0.26)',
            bg: 'rgba(147,197,253,0.10)',
            text: '#dcebff',
          }
        : {
            border: 'rgba(74,222,128,0.26)',
            bg: 'rgba(74,222,128,0.10)',
            text: '#d8ffe6',
          }

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          ...quickActionCardStyle,
          borderColor: palette.border,
          background: palette.bg,
        }}
      >
        <div style={quickActionTitleStyle}>{title}</div>
        <div style={quickActionCopyStyle}>{copy}</div>
        <div style={{ ...quickActionLinkStyle, color: palette.text }}>Open</div>
      </div>
    </Link>
  )
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? { border: 'rgba(214,166,75,0.20)', bg: 'rgba(214,166,75,0.08)', text: '#f3d899' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.20)', bg: 'rgba(147,197,253,0.08)', text: '#dcebff' }
        : { border: 'rgba(74,222,128,0.20)', bg: 'rgba(74,222,128,0.08)', text: '#d8ffe6' }

  return (
    <div style={{ ...summaryTileStyle, borderColor: palette.border, background: palette.bg }}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...summaryTileValueStyle, color: palette.text }}>{value}</div>
    </div>
  )
}

const snapshotRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 12,
}

const metricCardStyle: CSSProperties = {
  minHeight: 104,
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  padding: '14px 16px',
  display: 'grid',
  gap: 10,
  alignContent: 'start',
}

const metricLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--white-faint)',
}

const metricValueStyle: CSSProperties = {
  fontSize: 26,
  fontWeight: 760,
  letterSpacing: '-0.04em',
  color: 'var(--white-hi)',
}

const commandGridStyle: CSSProperties = {
  marginTop: 14,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
}

const quickActionCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'grid',
  gap: 8,
}

const quickActionTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 760,
  color: 'var(--white-hi)',
}

const quickActionCopyStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--white-soft)',
}

const quickActionLinkStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const summaryStripStyle: CSSProperties = {
  marginTop: 14,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
}

const summaryTileStyle: CSSProperties = {
  padding: 12,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
}

const summaryTileValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
}

const dashboardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 0.75fr',
  gap: 16,
}

const chartWrapStyle: CSSProperties = {
  minHeight: 320,
  display: 'grid',
  alignItems: 'end',
}

const chartBarsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
  gap: 14,
  alignItems: 'end',
}

const chartColStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  justifyItems: 'center',
}

const chartValueStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--white-soft)',
}

const chartTrackStyle: CSSProperties = {
  height: 190,
  width: '100%',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
}

const chartBarStyle: CSSProperties = {
  width: '100%',
  maxWidth: 42,
  borderRadius: '18px 18px 10px 10px',
}

const chartLabelStyle: CSSProperties = {
  fontSize: 10,
  lineHeight: 1.2,
  textAlign: 'center',
  color: 'var(--white-faint)',
}

const distributionStackStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const distributionRowStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
}

const distributionRowTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  fontSize: 12,
}

const distributionNameStyle: CSSProperties = {
  color: 'var(--white-soft)',
  fontWeight: 600,
}

const distributionPctStyle: CSSProperties = {
  color: 'var(--white-hi)',
  fontWeight: 700,
}

const distributionTrackStyle: CSSProperties = {
  height: 9,
  borderRadius: 999,
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.04)',
}

const distributionFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
}

const typeMixStackStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const typeMixRowStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
}

const stackStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const suggestedActionStyle: CSSProperties = {
  minHeight: 56,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.05)',
  background: 'rgba(255,255,255,0.02)',
  padding: '12px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: 'var(--white-soft)',
  fontSize: 13,
  lineHeight: 1.45,
}

const suggestedDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: 'var(--gold)',
  boxShadow: '0 0 12px rgba(214,166,75,0.35)',
  flexShrink: 0,
}

const taskStripStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  padding: '14px 16px',
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
}

const taskStripTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--white-hi)',
}

const taskStripSubStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'var(--white-soft)',
}

const taskStripBadgeStyle: CSSProperties = {
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  color: 'var(--white-soft)',
  fontSize: 11,
  fontWeight: 700,
}

const queueCardStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 14,
  borderRadius: 20,
  border: '1px solid rgba(214,166,75,0.10)',
  background:
    'radial-gradient(circle at top left, rgba(214,166,75,0.08), transparent 45%), rgba(255,255,255,0.02)',
}

const queueTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'flex-start',
}

const strongGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}

const strongCardStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 14,
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
}

const strongTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'flex-start',
}

const strongTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 760,
  letterSpacing: '-0.02em',
  color: 'var(--white-hi)',
}

const strongSubStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'var(--white-soft)',
}

const strongScoreStyle: CSSProperties = {
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(214,166,75,0.12)',
  border: '1px solid rgba(214,166,75,0.26)',
  color: 'var(--gold-2)',
  fontSize: 11,
  fontWeight: 700,
}

const strongMetaRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 12,
  color: 'var(--white-soft)',
}

const strongActionRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const staleCardStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(248,113,113,0.12)',
  background:
    'radial-gradient(circle at top left, rgba(248,113,113,0.08), transparent 45%), rgba(255,255,255,0.02)',
}

const staleBadgeStyle: CSSProperties = {
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(248,113,113,0.12)',
  border: '1px solid rgba(248,113,113,0.24)',
  color: '#ffd9d9',
  fontSize: 11,
  fontWeight: 700,
}

const emptyStateStyle: CSSProperties = {
  minHeight: 120,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 18,
  border: '1px dashed rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.015)',
  color: 'var(--white-faint)',
  fontSize: 13,
}