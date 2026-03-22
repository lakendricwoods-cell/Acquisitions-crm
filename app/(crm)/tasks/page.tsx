'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'

type TaskRecord = {
  id: string
  title: string | null
  description: string | null
  status: string | null
  priority: string | null
  due_date: string | null
  lead_id: string | null
  assigned_to_user_id: string | null
  created_at: string | null
  updated_at: string | null
  lead?: {
    id: string
    property_address_1: string | null
    city: string | null
    state: string | null
    owner_name: string | null
    status: string | null
    lead_type: string | null
  } | null
}

type LaneConfig = {
  key: string
  label: string
  description: string
  border: string
  glow: string
  chipBg: string
  chipText: string
  panelBg: string
}

const TASK_LANES: LaneConfig[] = [
  {
    key: 'follow_up',
    label: 'Follow Up',
    description: 'Seller callbacks, unanswered contacts, and next outreach attempts.',
    border: 'rgba(147,197,253,0.36)',
    glow: 'rgba(147,197,253,0.16)',
    chipBg: 'rgba(147,197,253,0.12)',
    chipText: '#dcebff',
    panelBg:
      'radial-gradient(circle at top left, rgba(147,197,253,0.16), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'underwriting',
    label: 'Underwriting',
    description: 'Run value, equity, repairs, and overall deal quality.',
    border: 'rgba(214,166,75,0.36)',
    glow: 'rgba(214,166,75,0.16)',
    chipBg: 'rgba(214,166,75,0.12)',
    chipText: '#f3d899',
    panelBg:
      'radial-gradient(circle at top left, rgba(214,166,75,0.16), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'closing',
    label: 'Closing',
    description: 'Contract, title, buyer coordination, and close-side movement.',
    border: 'rgba(74,222,128,0.34)',
    glow: 'rgba(74,222,128,0.16)',
    chipBg: 'rgba(74,222,128,0.12)',
    chipText: '#d8ffe6',
    panelBg:
      'radial-gradient(circle at top left, rgba(74,222,128,0.15), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'buyer',
    label: 'Buyer Side',
    description: 'Buyer matching, blast prep, and investor follow-through.',
    border: 'rgba(196,181,253,0.36)',
    glow: 'rgba(196,181,253,0.16)',
    chipBg: 'rgba(196,181,253,0.12)',
    chipText: '#ede7ff',
    panelBg:
      'radial-gradient(circle at top left, rgba(196,181,253,0.16), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'CRM cleanup, enrichment, imports, and operational housekeeping.',
    border: 'rgba(94,234,212,0.34)',
    glow: 'rgba(94,234,212,0.14)',
    chipBg: 'rgba(94,234,212,0.12)',
    chipText: '#d8fffb',
    panelBg:
      'radial-gradient(circle at top left, rgba(94,234,212,0.15), transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008)), rgba(0,0,0,0.22)',
  },
]

function normalizeTaskLane(task: TaskRecord) {
  const title = (task.title || '').toLowerCase()
  const description = (task.description || '').toLowerCase()

  if (
    title.includes('follow') ||
    title.includes('call') ||
    title.includes('text') ||
    description.includes('follow up') ||
    description.includes('callback')
  ) {
    return 'follow_up'
  }

  if (
    title.includes('arv') ||
    title.includes('underwrit') ||
    title.includes('repair') ||
    title.includes('comp') ||
    description.includes('underwrit') ||
    description.includes('comp')
  ) {
    return 'underwriting'
  }

  if (
    title.includes('title') ||
    title.includes('contract') ||
    title.includes('closing') ||
    description.includes('title') ||
    description.includes('closing')
  ) {
    return 'closing'
  }

  if (
    title.includes('buyer') ||
    title.includes('blast') ||
    title.includes('investor') ||
    description.includes('buyer') ||
    description.includes('investor')
  ) {
    return 'buyer'
  }

  return 'admin'
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString()
}

function isOverdue(value: string | null | undefined) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  return date.getTime() < now.getTime()
}

function priorityTone(priority: string | null | undefined) {
  const value = (priority || '').toLowerCase()
  if (value === 'high' || value === 'urgent') {
    return {
      bg: 'rgba(248,113,113,0.12)',
      border: 'rgba(248,113,113,0.22)',
      text: '#ffd9d9',
    }
  }
  if (value === 'medium') {
    return {
      bg: 'rgba(214,166,75,0.12)',
      border: 'rgba(214,166,75,0.22)',
      text: '#f3d899',
    }
  }
  return {
    bg: 'rgba(147,197,253,0.12)',
    border: 'rgba(147,197,253,0.22)',
    text: '#dcebff',
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      setLoading(true)

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          lead_id,
          assigned_to_user_id,
          created_at,
          updated_at,
          lead:leads (
            id,
            property_address_1,
            city,
            state,
            owner_name,
            status,
            lead_type
          )
        `)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (!error && data) {
        setTasks(data as unknown as TaskRecord[])
      } else {
        setTasks([])
      }

      setLoading(false)
    }

    void loadTasks()
  }, [])

  const grouped = useMemo(() => {
    return TASK_LANES.map((lane) => {
      const items = tasks.filter((task) => normalizeTaskLane(task) === lane.key)
      return {
        ...lane,
        items,
        count: items.length,
      }
    })
  }, [tasks])

  const totals = useMemo(() => {
    const totalTasks = tasks.length
    const overdue = tasks.filter((task) => isOverdue(task.due_date)).length
    const highPriority = tasks.filter((task) => {
      const value = (task.priority || '').toLowerCase()
      return value === 'high' || value === 'urgent'
    }).length
    const linkedLeads = tasks.filter((task) => !!task.lead_id).length

    return {
      totalTasks,
      overdue,
      highPriority,
      linkedLeads,
    }
  }, [tasks])

  return (
    <PageShell
      title="Tasks"
      subtitle="Horizontal work lanes for follow-up, underwriting, buyer-side work, closing, and operations."
      actions={
        <>
          <StatPill label="Tasks" value={totals.totalTasks} />
          <StatPill label="Overdue" value={totals.overdue} />
          <StatPill label="High Priority" value={totals.highPriority} />
          <StatPill label="Linked Leads" value={totals.linkedLeads} />
        </>
      }
    >
      <div style={pageStackStyle}>
        <SectionCard
          title="Task Flow"
          subtitle="Tasks are grouped by operating function so the page feels distinct from Pipeline while staying equally visual."
        >
          <div style={overviewGridStyle}>
            {grouped.map((lane) => (
              <div
                key={lane.key}
                style={{
                  ...overviewCardStyle,
                  borderColor: lane.border,
                  background: lane.panelBg,
                  boxShadow: `0 0 0 1px ${lane.glow} inset, 0 18px 38px rgba(0,0,0,0.28)`,
                }}
              >
                <div style={overviewTopStyle}>
                  <div>
                    <div style={overviewLabelStyle}>{lane.label}</div>
                    <div style={overviewSubStyle}>{lane.description}</div>
                  </div>
                  <span
                    className="crm-badge"
                    style={{
                      background: lane.chipBg,
                      borderColor: lane.border,
                      color: lane.chipText,
                    }}
                  >
                    {lane.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div style={lanesWrapStyle}>
          {grouped.map((lane) => (
            <section
              key={lane.key}
              style={{
                ...laneColumnStyle,
                borderColor: lane.border,
                background: lane.panelBg,
                boxShadow: `0 0 0 1px ${lane.glow} inset, 0 24px 48px rgba(0,0,0,0.34)`,
              }}
            >
              <div style={laneHeaderStyle}>
                <div style={laneTopRowStyle}>
                  <div>
                    <div style={laneTitleStyle}>{lane.label}</div>
                    <div style={laneSubtitleStyle}>{lane.description}</div>
                  </div>
                  <span
                    className="crm-badge"
                    style={{
                      background: lane.chipBg,
                      borderColor: lane.border,
                      color: lane.chipText,
                    }}
                  >
                    {lane.count}
                  </span>
                </div>
              </div>

              <div style={laneScrollStyle}>
                {loading ? (
                  <div style={emptyStyle}>Loading tasks...</div>
                ) : lane.items.length === 0 ? (
                  <div style={emptyStyle}>No tasks in this lane.</div>
                ) : (
                  lane.items.map((task) => {
                    const priority = priorityTone(task.priority)
                    const overdue = isOverdue(task.due_date)

                    return (
                      <article
                        key={task.id}
                        style={{
                          ...taskCardStyle,
                          borderColor: lane.border,
                        }}
                      >
                        <div style={taskTopStyle}>
                          <div style={taskTitleStyle}>{task.title || 'Untitled task'}</div>
                          <span
                            className="crm-badge"
                            style={{
                              background: priority.bg,
                              borderColor: priority.border,
                              color: priority.text,
                            }}
                          >
                            {task.priority || 'low'}
                          </span>
                        </div>

                        <div style={taskDescStyle}>
                          {task.description || 'No description provided.'}
                        </div>

                        <div style={taskMetaGridStyle}>
                          <MetaItem label="Due" value={formatDate(task.due_date)} />
                          <MetaItem label="Status" value={task.status || 'open'} />
                          <MetaItem
                            label="Lead"
                            value={
                              task.lead?.property_address_1 ||
                              task.lead?.owner_name ||
                              'No linked lead'
                            }
                          />
                        </div>

                        {task.lead ? (
                          <div style={taskLeadStripStyle}>
                            <span className="crm-badge soft">
                              {task.lead.lead_type || 'standard'}
                            </span>
                            <span style={taskLeadLocationStyle}>
                              {[task.lead.city, task.lead.state].filter(Boolean).join(', ') || 'No city/state'}
                            </span>
                          </div>
                        ) : null}

                        <div style={taskFooterStyle}>
                          {task.lead_id ? (
                            <Link href={`/leads/${task.lead_id}`}>
                              <ActionButton variant="gold">Open Lead</ActionButton>
                            </Link>
                          ) : (
                            <ActionButton>Unlinked</ActionButton>
                          )}

                          {overdue ? (
                            <span
                              className="crm-badge"
                              style={{
                                background: 'rgba(248,113,113,0.12)',
                                borderColor: 'rgba(248,113,113,0.22)',
                                color: '#ffd9d9',
                              }}
                            >
                              Overdue
                            </span>
                          ) : null}
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  )
}

function MetaItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={metaItemStyle}>
      <div style={metaLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  )
}

const pageStackStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const overviewGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 12,
}

const overviewCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
}

const overviewTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'flex-start',
}

const overviewLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--white-hi)',
}

const overviewSubStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 11,
  lineHeight: 1.45,
  color: 'var(--white-faint)',
}

const lanesWrapStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(300px, 1fr))',
  gap: 14,
  overflowX: 'auto',
  alignItems: 'start',
  minHeight: 'calc(100vh - 170px)',
  paddingBottom: 4,
}

const laneColumnStyle: CSSProperties = {
  minWidth: 300,
  height: 'calc(100vh - 170px)',
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  overflow: 'hidden',
}

const laneHeaderStyle: CSSProperties = {
  padding: 14,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

const laneTopRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
}

const laneTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 760,
  color: 'var(--white-hi)',
}

const laneSubtitleStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  lineHeight: 1.45,
  color: 'var(--white-faint)',
}

const laneScrollStyle: CSSProperties = {
  overflowY: 'auto',
  padding: 14,
  display: 'grid',
  alignContent: 'start',
  gap: 12,
}

const taskCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008)), rgba(0,0,0,0.18)',
  display: 'grid',
  gap: 10,
}

const taskTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'flex-start',
}

const taskTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 740,
  lineHeight: 1.4,
  color: 'var(--white-hi)',
}

const taskDescStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--white-soft)',
}

const taskMetaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
}

const metaItemStyle: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.05)',
}

const metaLabelStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--white-faint)',
}

const metaValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--white-hi)',
  lineHeight: 1.4,
}

const taskLeadStripStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const taskLeadLocationStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--white-faint)',
}

const taskFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
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