'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import PipelineBoard from '@/components/pipeline/pipeline-board'
import type { PipelineLead } from '@/components/pipeline/pipeline-card'
import type { CrmStage } from '@/lib/crm-stage'
import { resolveCrmStage } from '@/lib/crm-stage'

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([])
  const [loading, setLoading] = useState(true)

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
        deal_status,
        lead_status,
        pipeline_stage,
        stage,
        lead_type,
        house_value,
        estimated_value,
        market_value,
        equity_amount,
        mortgage_balance
      `)
      .order('updated_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error(error)
      setLeads([])
    } else {
      const rows = ((data || []) as PipelineLead[]).map((lead) => {
        const resolved = resolveCrmStage(lead)
        return {
          ...lead,
          status: resolved,
          deal_status: resolved,
          lead_status: resolved,
          pipeline_stage: resolved,
          stage: resolved,
        }
      })

      setLeads(rows)
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadLeads()
  }, [])

  async function moveLeadToStage(lead: PipelineLead, nextStage: CrmStage) {
    const payload = {
      status: nextStage,
      deal_status: nextStage,
      lead_status: nextStage,
      pipeline_stage: nextStage,
      stage: nextStage,
    }

    const { error } = await supabase.from('leads').update(payload).eq('id', lead.id)

    if (error) {
      console.error(error)
      alert(error.message || 'Failed to move lead.')
      return
    }

    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id
          ? {
              ...item,
              ...payload,
            }
          : item
      )
    )
  }

  const totalValue = useMemo(() => {
    return leads.reduce((sum, lead) => {
      return sum + (lead.house_value ?? lead.estimated_value ?? lead.market_value ?? 0)
    }, 0)
  }, [leads])

  const contractCount = useMemo(() => {
    return leads.filter((lead) => resolveCrmStage(lead) === 'under_contract').length
  }, [leads])

  return (
    <PageShell
      title="Pipeline"
      actions={
        <div style={actionsContainerStyle}>
          <StatPill label="Leads" value={leads.length} />
          <StatPill label="Contracts" value={contractCount} />
          <StatPill label="Visible Value" value={money(totalValue)} />
          <ActionButton tone="ghost" compact onClick={loadLeads} disabled={loading}>
            {loading ? 'Refreshing...' : '↻ Sync'}
          </ActionButton>
        </div>
      }
    >
      <div style={boardContainerStyle}>
        {loading ? (
          <div style={loadingStateStyle}>
            <div style={spinnerStyle} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500 }}>
              Loading pipeline data...
            </span>
          </div>
        ) : (
          <PipelineBoard leads={leads} onMoveLead={moveLeadToStage} />
        )}
      </div>
    </PageShell>
  )
}

const actionsContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const boardContainerStyle: CSSProperties = {
  width: '100%',
  marginTop: 8,
}

const loadingStateStyle: CSSProperties = {
  minHeight: 400,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(12,10,6,0.85), rgba(0,0,0,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}

const spinnerStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: '2px solid rgba(214, 166, 75, 0.2)',
  borderTopColor: '#d6a64b',
  animation: 'spin 0.8s linear infinite',
}