'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import { supabase } from '@/lib/supabase'

type Lead = {
  id: string
  status?: string | null
  lead_source?: string | null
  projected_spread?: number | null
  arv?: number | null
  created_at?: string | null
}

type Task = {
  id: string
  status?: string | null
  priority?: string | null
}

type ImportRow = {
  id: string
  source_label?: string | null
  created_at?: string | null
}

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [imports, setImports] = useState<ImportRow[]>([])

  const loadData = async () => {
    const [leadsRes, tasksRes, importsRes] = await Promise.all([
      supabase.from('leads').select('id, status, lead_source, projected_spread, arv, created_at'),
      supabase.from('tasks').select('id, status, priority'),
      supabase.from('imports').select('id, source_label, created_at'),
    ])

    if (!leadsRes.error && leadsRes.data) setLeads(leadsRes.data as Lead[])
    if (!tasksRes.error && tasksRes.data) setTasks(tasksRes.data as Task[])
    if (!importsRes.error && importsRes.data) setImports(importsRes.data as ImportRow[])
  }

  useEffect(() => {
    void loadData()
  }, [])

  const metrics = useMemo(() => {
    const totalLeads = leads.length
    const openTasks = tasks.filter((t) => (t.status || '').toLowerCase() !== 'completed').length
    const urgentTasks = tasks.filter((t) => (t.priority || '').toLowerCase() === 'urgent').length
    const pipelineValue = leads.reduce((sum, lead) => sum + Number(lead.projected_spread || 0), 0)
    const avgArv =
      totalLeads > 0
        ? Math.round(leads.reduce((sum, lead) => sum + Number(lead.arv || 0), 0) / totalLeads)
        : 0

    const stageCounts = {
      newLead: leads.filter((l) => (l.status || '').toLowerCase() === 'new_lead').length,
      researching: leads.filter((l) => (l.status || '').toLowerCase() === 'researching').length,
      qualified: leads.filter((l) => (l.status || '').toLowerCase() === 'qualified').length,
      negotiating: leads.filter((l) => (l.status || '').toLowerCase() === 'negotiating').length,
      contract: leads.filter((l) => (l.status || '').toLowerCase() === 'contract').length,
    }

    const sourceMap = new Map<string, number>()
    leads.forEach((lead) => {
      const key = lead.lead_source || 'Unknown'
      sourceMap.set(key, (sourceMap.get(key) || 0) + 1)
    })

    const topSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    return {
      totalLeads,
      openTasks,
      urgentTasks,
      pipelineValue,
      avgArv,
      stageCounts,
      topSources,
    }
  }, [leads, tasks])

  const stageBars = [
    { label: 'New', value: metrics.stageCounts.newLead, tone: '#8ab4ff' },
    { label: 'Researching', value: metrics.stageCounts.researching, tone: '#c084fc' },
    { label: 'Qualified', value: metrics.stageCounts.qualified, tone: '#f4ddaa' },
    { label: 'Negotiating', value: metrics.stageCounts.negotiating, tone: '#f5a524' },
    { label: 'Contract', value: metrics.stageCounts.contract, tone: '#4ade80' },
  ]

  const maxStage = Math.max(1, ...stageBars.map((item) => item.value))

  return (
    <PageShell
      title="Reports"
      subtitle="Performance storyboard for acquisition flow, task pressure, and source momentum."
      actions={
        <>
          <StatPill label="Leads" value={metrics.totalLeads} />
          <StatPill label="Open Tasks" value={metrics.openTasks} />
          <StatPill label="Urgent" value={metrics.urgentTasks} />
          <StatPill label="Pipeline Value" value={money(metrics.pipelineValue)} />
        </>
      }
    >
      <div style={reportsGridStyle}>
        <SectionCard
          title="Performance Overview"
          subtitle="A cinematic, quick-read snapshot of what the CRM is producing."
        >
          <div style={heroMetricsStyle}>
            <HeroMetric title="Total Leads" value={String(metrics.totalLeads)} tone="gold" />
            <HeroMetric title="Open Tasks" value={String(metrics.openTasks)} tone="ice" />
            <HeroMetric title="Avg ARV" value={money(metrics.avgArv)} tone="green" />
            <HeroMetric title="Pipeline Value" value={money(metrics.pipelineValue)} tone="gold" />
          </div>
        </SectionCard>

        <div style={twoColStyle}>
          <SectionCard
            title="Pipeline Motion"
            subtitle="Stage progression should feel visual, fluid, and readable at a glance."
          >
            <div style={{ display: 'grid', gap: 14 }}>
              {stageBars.map((item) => (
                <div key={item.label} style={{ display: 'grid', gap: 6 }}>
                  <div style={barMetaStyle}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div style={barTrackStyle}>
                    <div
                      style={{
                        ...barFillStyle,
                        width: `${(item.value / maxStage) * 100}%`,
                        background: `linear-gradient(90deg, ${item.tone} 0%, rgba(255,255,255,0.96) 100%)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Source Momentum"
            subtitle="The strongest input channels should be obvious."
          >
            <div style={{ display: 'grid', gap: 12 }}>
              {metrics.topSources.length === 0 ? (
                <div style={emptyStyle}>No lead source data yet.</div>
              ) : (
                metrics.topSources.map((item) => (
                  <div key={item.source} style={sourceRowStyle}>
                    <div>
                      <div style={sourceNameStyle}>{item.source}</div>
                      <div style={sourceSubStyle}>Lead source volume</div>
                    </div>
                    <div style={sourceCountStyle}>{item.count}</div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Import Rhythm"
          subtitle="Recent source intake activity."
        >
          <div style={timelineWrapStyle}>
            {imports.length === 0 ? (
              <div style={emptyStyle}>No imports yet.</div>
            ) : (
              imports.slice(0, 8).map((item, index) => (
                <div key={item.id} style={timelineItemStyle}>
                  <div style={timelineDotStyle}>{index + 1}</div>
                  <div>
                    <div style={timelineTitleStyle}>{item.source_label || 'Import'}</div>
                    <div style={timelineSubStyle}>
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown time'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  )
}

function HeroMetric({
  title,
  value,
  tone,
}: {
  title: string
  value: string
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? { border: 'rgba(201,163,78,0.24)', bg: 'rgba(201,163,78,0.08)', text: '#f4ddaa' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.24)', bg: 'rgba(147,197,253,0.08)', text: '#dcecff' }
        : { border: 'rgba(74,222,128,0.24)', bg: 'rgba(74,222,128,0.08)', text: '#cef8da' }

  return (
    <div
      style={{
        ...heroMetricStyle,
        borderColor: palette.border,
        background: palette.bg,
      }}
    >
      <div style={heroMetricLabelStyle}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: palette.text }}>{value}</div>
    </div>
  )
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const reportsGridStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
}

const heroMetricsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
}

const heroMetricStyle: CSSProperties = {
  padding: 16,
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.08)',
}

const heroMetricLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: 'rgba(255,255,255,0.42)',
}

const twoColStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.15fr) minmax(340px, 0.85fr)',
  gap: 18,
}

const barMetaStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 13,
  color: 'rgba(255,255,255,0.68)',
}

const barTrackStyle: CSSProperties = {
  height: 12,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  overflow: 'hidden',
}

const barFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
}

const sourceRowStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
}

const sourceNameStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.92)',
}

const sourceSubStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'rgba(255,255,255,0.46)',
}

const sourceCountStyle: CSSProperties = {
  minWidth: 54,
  height: 54,
  borderRadius: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(201,163,78,0.10)',
  border: '1px solid rgba(201,163,78,0.20)',
  color: '#f4ddaa',
  fontWeight: 800,
  fontSize: 22,
}

const timelineWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const timelineItemStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  padding: 14,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const timelineDotStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(201,163,78,0.12)',
  border: '1px solid rgba(201,163,78,0.20)',
  color: '#f4ddaa',
  fontWeight: 800,
  flexShrink: 0,
}

const timelineTitleStyle: CSSProperties = {
  fontWeight: 700,
  color: 'rgba(255,255,255,0.9)',
}

const timelineSubStyle: CSSProperties = {
  marginTop: 4,
  color: 'rgba(255,255,255,0.48)',
  fontSize: 12,
}

const emptyStyle: CSSProperties = {
  padding: 24,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.03)',
  color: 'rgba(255,255,255,0.46)',
  textAlign: 'center',
}