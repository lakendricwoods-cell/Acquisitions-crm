'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'

import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import PipelineBoard from '@/components/pipeline/pipeline-board'
import PipelineToolbar from '@/components/pipeline/pipeline-toolbar'
import PipelineMetrics from '@/components/pipeline/pipeline-metrics'

import type { PipelineLead } from '@/components/pipeline/pipeline-card'
import type { CrmStage } from '@/lib/crm-stage'
import {
  CRM_STAGES,
  resolveCrmStage,
} from '@/lib/crm-stage'

type StepFilter =
  | 'all'
  | 'current'
  | 'next'

function money(
  value: number | null | undefined
): string {
  if (
    value == null ||
    Number.isNaN(value)
  ) {
    return '—'
  }

  return `$${Math.round(value).toLocaleString()}`
}

function searchValue(
  value: string | null | undefined
): string {
  return String(value ?? '').toLowerCase()
}

export default function PipelinePage() {
  const [leads, setLeads] =
    useState<PipelineLead[]>([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [search, setSearch] =
    useState('')

  const [stepFilter, setStepFilter] =
    useState<StepFilter>('all')

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const loadLeads = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setErrorMessage(null)

      const { data, error } =
        await supabase
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
            mortgage_balance,
            updated_at
          `)
          .order('updated_at', {
            ascending: false,
            nullsFirst: false,
          })

      if (error) {
        console.error(
          'Pipeline load error:',
          error
        )

        setErrorMessage(
          error.message ||
            'Failed to load pipeline.'
        )
        setLeads([])
      } else {
        const normalized =
          ((data || []) as PipelineLead[]).map(
            (lead) => {
              const resolved =
                resolveCrmStage(lead)

              return {
                ...lead,
                pipeline_stage: resolved,
                stage: resolved,
              }
            }
          )

        setLeads(normalized)
      }

      setLoading(false)
      setRefreshing(false)
    },
    []
  )

  useEffect(() => {
    void loadLeads()
  }, [loadLeads])

  async function moveLeadToStage(
    lead: PipelineLead,
    nextStage: CrmStage
  ): Promise<void> {
    const currentStage =
      resolveCrmStage(lead)

    if (currentStage === nextStage) {
      return
    }

    const previousLead: PipelineLead = {
      ...lead,
    }

    /*
     * Optimistic update.
     *
     * pipeline_stage and stage are the canonical values used
     * by this page. The other legacy fields are also updated
     * to keep existing parts of the CRM synchronized.
     */
    const optimisticLead: PipelineLead = {
      ...lead,
      pipeline_stage: nextStage,
      stage: nextStage,
      status: nextStage,
      lead_status: nextStage,
      deal_status: nextStage,
    }

    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id
          ? optimisticLead
          : item
      )
    )

    const payload = {
      pipeline_stage: nextStage,
      stage: nextStage,
      status: nextStage,
      lead_status: nextStage,
      deal_status: nextStage,
    }

    const { error } =
      await supabase
        .from('leads')
        .update(payload)
        .eq('id', lead.id)

    if (error) {
      console.error(
        'Pipeline stage update error:',
        error
      )

      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id
            ? previousLead
            : item
        )
      )

      setErrorMessage(
        error.message ||
          'Failed to update lead stage.'
      )

      return
    }

    /*
     * Re-read the updated record.
     *
     * This prevents the UI from becoming correct visually
     * while another stage column/page still has stale data.
     */
    const { data: updatedLead, error: reloadError } =
      await supabase
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
          mortgage_balance,
          updated_at
        `)
        .eq('id', lead.id)
        .maybeSingle()

    if (reloadError) {
      console.error(
        'Pipeline updated-record reload error:',
        reloadError
      )

      return
    }

    if (updatedLead) {
      const normalized =
        updatedLead as PipelineLead

      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id
            ? {
                ...item,
                ...normalized,
                pipeline_stage:
                  nextStage,
                stage: nextStage,
              }
            : item
        )
      )
    }
  }

  const filteredLeads =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase()

      return leads.filter((lead) => {
        if (normalizedSearch) {
          const haystack = [
            lead.property_address_1,
            lead.city,
            lead.state,
            lead.zip,
            lead.owner_name,
            lead.lead_type,
          ]
            .map(searchValue)
            .join(' ')

          if (
            !haystack.includes(
              normalizedSearch
            )
          ) {
            return false
          }
        }

        const stage =
          resolveCrmStage(lead)

        if (stepFilter === 'current') {
          return (
            stage !== 'closed' &&
            stage !== 'dead'
          )
        }

        if (stepFilter === 'next') {
          return (
            stage === 'contacted' ||
            stage === 'follow_up' ||
            stage === 'appointment' ||
            stage === 'offers' ||
            stage === 'negotiation' ||
            stage === 'verbals'
          )
        }

        return true
      })
    }, [leads, search, stepFilter])

  const totalValue =
    useMemo(() => {
      return filteredLeads.reduce(
        (sum, lead) =>
          sum +
          (lead.house_value ??
            lead.estimated_value ??
            lead.market_value ??
            0),
        0
      )
    }, [filteredLeads])

  const activeCount =
    useMemo(() => {
      return filteredLeads.filter(
        (lead) => {
          const stage =
            resolveCrmStage(lead)

          return (
            stage !== 'closed' &&
            stage !== 'dead'
          )
        }
      ).length
    }, [filteredLeads])

  const contractCount =
    useMemo(() => {
      return filteredLeads.filter(
        (lead) =>
          resolveCrmStage(lead) ===
          'under_contract'
      ).length
    }, [filteredLeads])

  const avgStrength =
    useMemo(() => {
      if (!filteredLeads.length) {
        return 0
      }

      const values =
        filteredLeads.map((lead) => {
          const value =
            lead.equity_amount ??
            0

          if (value <= 0) {
            return 0
          }

          return Math.min(
            100,
            Math.round(
              (value /
                Math.max(
                  lead.house_value ??
                    lead.estimated_value ??
                    lead.market_value ??
                    1,
                  1
                )) *
                100
            )
          )
        })

      return Math.round(
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / values.length
      )
    }, [filteredLeads])

  const projectedSpread =
    useMemo(() => {
      return filteredLeads.reduce(
        (sum, lead) => {
          const value =
            lead.house_value ??
            lead.estimated_value ??
            lead.market_value ??
            0

          const mortgage =
            lead.mortgage_balance ?? 0

          return (
            sum +
            Math.max(
              0,
              value - mortgage
            )
          )
        },
        0
      )
    }, [filteredLeads])

  return (
    <PageShell
      title="Pipeline"
      subtitle="Manage lead progression, follow-up, offers, contracts, and dispositions."
      actions={
        <div style={actionsContainerStyle}>
          <StatPill
            label="Leads"
            value={filteredLeads.length}
          />

          <StatPill
            label="Contracts"
            value={contractCount}
          />

          <StatPill
            label="Visible Value"
            value={money(totalValue)}
          />

          <ActionButton
            tone="ghost"
            compact
            onClick={() =>
              void loadLeads(true)
            }
            disabled={loading || refreshing}
          >
            {refreshing
              ? 'Refreshing...'
              : '↻ Sync'}
          </ActionButton>
        </div>
      }
    >
      <div style={pageContainerStyle}>
        <PipelineToolbar
          search={search}
          onSearchChange={setSearch}
          stepFilter={stepFilter}
          onStepFilterChange={
            setStepFilter
          }
          onRefresh={() =>
            void loadLeads(true)
          }
        />

        <PipelineMetrics
          metrics={{
            total:
              filteredLeads.length,
            active: activeCount,
            projectedSpread,
            avgStrength,
          }}
        />

        {errorMessage ? (
          <div style={errorStyle}>
            <div>
              <strong>
                Pipeline update issue
              </strong>

              <div style={errorTextStyle}>
                {errorMessage}
              </div>
            </div>

            <ActionButton
              compact
              tone="ghost"
              onClick={() => {
                setErrorMessage(null)
                void loadLeads(true)
              }}
            >
              Retry
            </ActionButton>
          </div>
        ) : null}

        <div style={boardContainerStyle}>
          {loading ? (
            <div style={loadingStateStyle}>
              <div
                style={spinnerStyle}
              />

              <span
                style={
                  loadingTextStyle
                }
              >
                Loading pipeline data...
              </span>
            </div>
          ) : (
            <PipelineBoard
              leads={filteredLeads}
              onMoveLead={
                moveLeadToStage
              }
            />
          )}
        </div>
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

const pageContainerStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  minWidth: 0,
}

const boardContainerStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
}

const errorStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '11px 14px',
  borderRadius: 12,
  border:
    '1px solid rgba(239,68,68,0.25)',
  background:
    'rgba(239,68,68,0.08)',
  color: '#fca5a5',
  fontSize: 12,
}

const errorTextStyle: CSSProperties = {
  marginTop: 3,
  color: 'rgba(255,255,255,0.55)',
}

const loadingStateStyle: CSSProperties = {
  minHeight: 400,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  borderRadius: 22,
  border:
    '1px solid rgba(255,255,255,0.06)',
  background:
    'linear-gradient(180deg, rgba(12,10,6,0.85), rgba(0,0,0,0.95))',
}

const spinnerStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  border:
    '2px solid rgba(214,166,75,0.2)',
  borderTopColor: '#d6a64b',
  animation:
    'spin 0.8s linear infinite',
}

const loadingTextStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: 13,
  fontWeight: 500,
}