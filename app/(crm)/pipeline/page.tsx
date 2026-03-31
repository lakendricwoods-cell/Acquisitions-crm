'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import StatPill from '@/components/ui/stat-pill'
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
      setLeads((data || []) as PipelineLead[])
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
      subtitle="Smooth kanban board for moving leads through every stage."
      actions={
        <>
          <StatPill label="Leads" value={leads.length} />
          <StatPill label="Contracts" value={contractCount} />
          <StatPill label="Visible Value" value={money(totalValue)} />
        </>
      }
    >
      {loading ? (
        <div className="crm-muted">Loading pipeline...</div>
      ) : (
        <PipelineBoard leads={leads} onMoveLead={moveLeadToStage} />
      )}
    </PageShell>
  )
}