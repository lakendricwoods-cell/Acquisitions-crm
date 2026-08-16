'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import { supabase } from '@/lib/supabase'

/* =========================================================
   TYPES
========================================================= */

type LeadRow = {
  id: string

  property_address_1?: string | null
  property_address?: string | null

  owner_name?: string | null

  owner_phone_primary?: string | null
  phone1?: string | null
  owner_phone?: string | null
  phone?: string | null

  owner_email?: string | null
  email1?: string | null
  owner_email_primary?: string | null
  email?: string | null

  city?: string | null
  property_city?: string | null

  state?: string | null
  property_state?: string | null

  zip?: string | null
  property_zip?: string | null

  county?: string | null

  status?: string | null

  asking_price?: number | null
  listing_price?: number | null

  market_value?: number | null
  estimated_value?: number | null

  arv?: number | null

  equity_amount?: number | null
  equity_percent?: number | null
  mortgage_balance?: number | null

  square_feet?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  year_built?: number | null

  property_type?: string | null
  property_use?: string | null

  owner_occupied?: boolean | null
  vacant?: boolean | null

  last_sale_amount?: number | null
  last_sale_date?: string | null

  default_amount?: number | null
  auction_date?: string | null

  lead_type?: string | null

  created_at?: string | null
}

/* =========================================================
   STATUS
========================================================= */

const STAGE_OPTIONS = [
  {
    value: 'new_lead',
    label: 'New Lead',
    description: 'Newly added',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    description: 'Seller contacted',
  },
  {
    value: 'appointment_set',
    label: 'Appointment Set',
    description: 'Appointment scheduled',
  },
  {
    value: 'offer_sent',
    label: 'Offer Sent',
    description: 'Offer delivered',
  },
  {
    value: 'negotiation',
    label: 'Negotiation',
    description: 'Terms being negotiated',
  },
  {
    value: 'under_contract',
    label: 'Under Contract',
    description: 'Contract executed',
  },
  {
    value: 'closed',
    label: 'Closed',
    description: 'Deal closed',
  },
  {
    value: 'dead_lead',
    label: 'Dead / Archive',
    description: 'No longer active',
  },
]

type FilterKey =
  | 'all'
  | 'high'
  | 'workable'
  | 'missing-contact'
  | 'missing-market'

/* =========================================================
   HELPERS
========================================================= */

function firstNonEmpty(
  ...values: Array<string | null | undefined>
) {
  return values.find(
    (value) =>
      typeof value === 'string' &&
      value.trim().length > 0
  )
}

function formatMoney(
  value: number | null | undefined
) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return '—'
  }

  return `$${Math.round(value).toLocaleString()}`
}

function titleCase(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) =>
      match.toUpperCase()
    )
}

function getLeadStage(lead: LeadRow) {
  return (
    firstNonEmpty(
      lead.status,
      'new_lead'
    ) || 'new_lead'
  )
}

function getStageMeta(stage: string) {
  const normalized = stage.toLowerCase()

  if (normalized === 'contacted') {
    return {
      color: '#f59e0b',
      background: 'rgba(245,158,11,0.10)',
      border: 'rgba(245,158,11,0.28)',
    }
  }

  if (normalized === 'appointment_set') {
    return {
      color: '#38bdf8',
      background: 'rgba(56,189,248,0.10)',
      border: 'rgba(56,189,248,0.28)',
    }
  }

  if (normalized === 'offer_sent') {
    return {
      color: '#fbbf24',
      background: 'rgba(251,191,36,0.10)',
      border: 'rgba(251,191,36,0.28)',
    }
  }

  if (normalized === 'negotiation') {
    return {
      color: '#c084fc',
      background: 'rgba(192,132,252,0.10)',
      border: 'rgba(192,132,252,0.28)',
    }
  }

  if (normalized === 'under_contract') {
    return {
      color: '#4ade80',
      background: 'rgba(74,222,128,0.10)',
      border: 'rgba(74,222,128,0.28)',
    }
  }

  if (normalized === 'closed') {
    return {
      color: '#22c55e',
      background: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.32)',
    }
  }

  if (
    normalized === 'dead_lead' ||
    normalized === 'archive'
  ) {
    return {
      color: '#ef4444',
      background: 'rgba(239,68,68,0.10)',
      border: 'rgba(239,68,68,0.25)',
    }
  }

  return {
    color: '#e0b84f',
    background: 'rgba(214,166,75,0.10)',
    border: 'rgba(214,166,75,0.28)',
  }
}

function getMarketValue(lead: LeadRow) {
  return (
    lead.market_value ??
    lead.estimated_value ??
    null
  )
}

function getArvValue(lead: LeadRow) {
  return lead.arv ?? null
}

function getPhone(lead: LeadRow) {
  return (
    firstNonEmpty(
      lead.owner_phone_primary,
      lead.phone1,
      lead.owner_phone,
      lead.phone
    ) || null
  )
}

function getEmail(lead: LeadRow) {
  return (
    firstNonEmpty(
      lead.owner_email,
      lead.email1,
      lead.owner_email_primary,
      lead.email
    ) || null
  )
}

/* =========================================================
   EVIDENCE-BASED LEAD ANALYSIS

   Important:
   These scores do NOT invent motivation or market data.

   They only evaluate information actually present on
   the lead record.

   A missing field contributes ZERO evidence.
========================================================= */

type LeadAnalysis = {
  strength: number
  contact: number
  market: number
  property: number
  readiness: number
  evidence: string[]
  warnings: string[]
  label: string
}

function analyzeLead(
  lead: LeadRow
): LeadAnalysis {
  let contactPoints = 0
  let marketPoints = 0
  let propertyPoints = 0
  let readinessPoints = 0

  const evidence: string[] = []
  const warnings: string[] = []

  const phone = getPhone(lead)
  const email = getEmail(lead)
  const address = firstNonEmpty(
    lead.property_address_1,
    lead.property_address
  )

  const location = firstNonEmpty(
    lead.city,
    lead.property_city
  )

  /* ---------------- CONTACT ---------------- */

  if (lead.owner_name) {
    contactPoints += 20
    evidence.push('Owner name available')
  } else {
    warnings.push('Owner name missing')
  }

  if (phone) {
    contactPoints += 50
    evidence.push('Phone number available')
  } else {
    warnings.push('Phone number missing')
  }

  if (email) {
    contactPoints += 30
    evidence.push('Email available')
  }

  /* ---------------- MARKET ---------------- */

  if (getMarketValue(lead) !== null) {
    marketPoints += 45
    evidence.push('Property value available')
  } else {
    warnings.push('No verified market value')
  }

  if (getArvValue(lead) !== null) {
    marketPoints += 35
    evidence.push('ARV available')
  } else {
    warnings.push('ARV has not been calculated')
  }

  if (
    lead.asking_price !== null &&
    lead.asking_price !== undefined
  ) {
    marketPoints += 20
    evidence.push('Asking price available')
  }

  /* ---------------- PROPERTY ---------------- */

  if (address) {
    propertyPoints += 25
    evidence.push('Property address available')
  } else {
    warnings.push('Property address missing')
  }

  if (location) {
    propertyPoints += 15
  }

  if (
    lead.bedrooms !== null &&
    lead.bedrooms !== undefined
  ) {
    propertyPoints += 15
  }

  if (
    lead.bathrooms !== null &&
    lead.bathrooms !== undefined
  ) {
    propertyPoints += 15
  }

  if (
    lead.square_feet !== null &&
    lead.square_feet !== undefined
  ) {
    propertyPoints += 15
  }

  if (
    lead.year_built !== null &&
    lead.year_built !== undefined
  ) {
    propertyPoints += 15
  }

  if (
    propertyPoints < 60
  ) {
    warnings.push(
      'Property details are incomplete'
    )
  }

  /* ---------------- READINESS ---------------- */

  if (address) {
    readinessPoints += 40
  }

  if (
    getMarketValue(lead) !== null
  ) {
    readinessPoints += 30
  }

  if (phone) {
    readinessPoints += 30
  }

  /*
   * The overall strength is based on actual
   * completeness and usable evidence.
   */

  const strength = Math.round(
    contactPoints * 0.30 +
      marketPoints * 0.30 +
      propertyPoints * 0.20 +
      readinessPoints * 0.20
  )

  let label = 'Insufficient Data'

  if (strength >= 85) {
    label = 'High Confidence'
  } else if (strength >= 70) {
    label = 'Strong'
  } else if (strength >= 50) {
    label = 'Workable'
  } else if (strength >= 30) {
    label = 'Needs Research'
  }

  return {
    strength: Math.min(
      100,
      Math.max(0, strength)
    ),
    contact: Math.min(
      100,
      contactPoints
    ),
    market: Math.min(
      100,
      marketPoints
    ),
    property: Math.min(
      100,
      propertyPoints
    ),
    readiness: Math.min(
      100,
      readinessPoints
    ),
    evidence,
    warnings,
    label,
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [filter, setFilter] =
    useState<FilterKey>('all')

  const [isMobile, setIsMobile] =
    useState(false)

  const [selectedLeadIds, setSelectedLeadIds] =
    useState<string[]>([])

  const [bulkStage, setBulkStage] =
    useState('new_lead')

  const [savingLeadId, setSavingLeadId] =
    useState<string | null>(null)

  const [savingBulk, setSavingBulk] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  useEffect(() => {
    const sync = () => {
      setIsMobile(
        window.innerWidth <= 900
      )
    }

    sync()

    window.addEventListener(
      'resize',
      sync
    )

    return () =>
      window.removeEventListener(
        'resize',
        sync
      )
  }, [])

  /* =======================================================
     LOAD
  ======================================================= */

  async function loadLeads() {
    setLoading(true)
    setErrorMessage(null)

    const {
      data,
      error,
    } = await supabase
      .from('leads')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      )

    if (error) {
      console.error(
        'Failed to load leads:',
        error
      )

      setErrorMessage(
        `Unable to load leads: ${error.message}`
      )

      setLeads([])
    } else {
      setLeads(
        (data as LeadRow[]) || []
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadLeads()
  }, [])

  /* =======================================================
     ROW MODEL
  ======================================================= */

  const rows = useMemo(() => {
    return leads.map((lead) => {
      const stage =
        getLeadStage(lead)

      const analysis =
        analyzeLead(lead)

      const address =
        firstNonEmpty(
          lead.property_address_1,
          lead.property_address
        ) ||
        'Unknown Property'

      const location = [
        firstNonEmpty(
          lead.city,
          lead.property_city
        ),
        firstNonEmpty(
          lead.state,
          lead.property_state
        ),
        firstNonEmpty(
          lead.zip,
          lead.property_zip
        ),
      ]
        .filter(Boolean)
        .join(', ')

      const stageMeta =
        getStageMeta(stage)

      return {
        lead,
        address,
        location:
          location || 'Location pending',
        owner:
          lead.owner_name ||
          'Unknown owner',
        phone:
          getPhone(lead) ||
          null,
        email:
          getEmail(lead) ||
          null,
        stage,
        stageLabel:
          titleCase(stage),
        stageMeta,

        priceText:
          formatMoney(
            getMarketValue(lead)
          ),

        arvText:
          formatMoney(
            getArvValue(lead)
          ),

        analysis,
      }
    })
  }, [leads])

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRows =
    useMemo(() => {
      const q =
        query
          .trim()
          .toLowerCase()

      return rows.filter(
        (row) => {
          const haystack = [
            row.address,
            row.location,
            row.owner,
            row.phone,
            row.email,
            row.stageLabel,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          if (
            q &&
            !haystack.includes(q)
          ) {
            return false
          }

          if (
            filter === 'high'
          ) {
            return (
              row.analysis.strength >=
              80
            )
          }

          if (
            filter === 'workable'
          ) {
            return (
              row.analysis.strength >=
              50
            )
          }

          if (
            filter ===
            'missing-contact'
          ) {
            return (
              row.analysis.contact <
              70
            )
          }

          if (
            filter ===
            'missing-market'
          ) {
            return (
              row.analysis.market <
              60
            )
          }

          return true
        }
      )
    }, [
      rows,
      query,
      filter,
    ])

  /* =======================================================
     STATS
  ======================================================= */

  const stats =
    useMemo(() => {
      return {
        total: rows.length,

        highPriority:
          rows.filter(
            (row) =>
              row.analysis
                .strength >= 80
          ).length,

        workable:
          rows.filter(
            (row) =>
              row.analysis
                .strength >= 50
          ).length,

        weakContact:
          rows.filter(
            (row) =>
              row.analysis
                .contact < 70
          ).length,
      }
    }, [rows])

  /* =======================================================
     STATUS UPDATE
     
     IMPORTANT:
     `status` is now the single source of truth.

     We intentionally DO NOT update:
       stage
       lead_status
       deal_status
       pipeline_stage

     because attempting to write all of those fields is
     what can cause schema/constraint failures.
  ======================================================= */

  async function handleUpdateStage(
    leadId: string,
    nextStage: string
  ) {
    if (
      savingLeadId === leadId
    ) {
      return
    }

    const previousLead =
      leads.find(
        (lead) =>
          lead.id === leadId
      )

    const previousStage =
      previousLead?.status ??
      'new_lead'

    setSavingLeadId(leadId)
    setErrorMessage(null)

    /*
     * Optimistic UI.
     */
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: nextStage,
            }
          : lead
      )
    )

    /*
     * ONLY update the canonical status.
     */
    const {
      error,
    } = await supabase
      .from('leads')
      .update({
        status: nextStage,
      })
      .eq(
        'id',
        leadId
      )

    if (error) {
      console.error(
        'Failed to update lead status:',
        error
      )

      /*
       * Roll back optimistic UI.
       */
      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                status:
                  previousStage,
              }
            : lead
        )
      )

      setErrorMessage(
        `Could not change lead status: ${error.message}`
      )
    }

    setSavingLeadId(null)
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleDeleteLead(
    leadId: string
  ) {
    if (
      !confirm(
        'Are you sure you want to permanently delete this lead?'
      )
    ) {
      return
    }

    setErrorMessage(null)

    const {
      error,
    } = await supabase
      .from('leads')
      .delete()
      .eq(
        'id',
        leadId
      )

    if (error) {
      console.error(
        'Failed to delete lead:',
        error
      )

      setErrorMessage(
        `Failed to delete lead: ${error.message}`
      )

      return
    }

    setLeads((current) =>
      current.filter(
        (lead) =>
          lead.id !== leadId
      )
    )

    setSelectedLeadIds(
      (current) =>
        current.filter(
          (id) =>
            id !== leadId
        )
    )
  }

  /* =======================================================
     BULK STATUS
  ======================================================= */

  async function handleBulkStageChange() {
    if (
      selectedLeadIds.length === 0 ||
      savingBulk
    ) {
      return
    }

    setSavingBulk(true)
    setErrorMessage(null)

    const {
      error,
    } = await supabase
      .from('leads')
      .update({
        status: bulkStage,
      })
      .in(
        'id',
        selectedLeadIds
      )

    if (error) {
      console.error(
        'Failed to update bulk leads:',
        error
      )

      setErrorMessage(
        `Failed to update selected leads: ${error.message}`
      )

      setSavingBulk(false)
      return
    }

    setLeads((current) =>
      current.map((lead) =>
        selectedLeadIds.includes(
          lead.id
        )
          ? {
              ...lead,
              status:
                bulkStage,
            }
          : lead
      )
    )

    setSelectedLeadIds([])
    setSavingBulk(false)
  }

  /* =======================================================
     BULK DELETE
  ======================================================= */

  async function handleBulkDelete() {
    if (
      selectedLeadIds.length === 0
    ) {
      return
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedLeadIds.length} selected leads?`
      )
    ) {
      return
    }

    setErrorMessage(null)

    const {
      error,
    } = await supabase
      .from('leads')
      .delete()
      .in(
        'id',
        selectedLeadIds
      )

    if (error) {
      console.error(
        'Failed to delete selected leads:',
        error
      )

      setErrorMessage(
        `Failed to delete selected leads: ${error.message}`
      )

      return
    }

    setLeads((current) =>
      current.filter(
        (lead) =>
          !selectedLeadIds.includes(
            lead.id
          )
      )
    )

    setSelectedLeadIds([])
  }

  /* =======================================================
     SELECTION
  ======================================================= */

  function toggleSelectAll() {
    if (
      selectedLeadIds.length ===
      filteredRows.length
    ) {
      setSelectedLeadIds([])
      return
    }

    setSelectedLeadIds(
      filteredRows.map(
        (row) =>
          row.lead.id
      )
    )
  }

  function toggleSelectLead(
    id: string
  ) {
    setSelectedLeadIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <PageShell
      title="Leads"
      subtitle={
        isMobile
          ? 'Review, qualify, and move leads from your phone.'
          : 'Your property acquisition control center.'
      }
      actions={
        <>
          <StatPill
            label="Total"
            value={stats.total}
          />

          <StatPill
            label="High Priority"
            value={
              stats.highPriority
            }
          />

          <StatPill
            label="Workable"
            value={
              stats.workable
            }
          />

          <StatPill
            label="Needs Contact"
            value={
              stats.weakContact
            }
          />

          {!isMobile && (
            <Link href="/imports">
              <ActionButton
                compact
                tone="gold"
              >
                Import
              </ActionButton>
            </Link>
          )}
        </>
      }
    >
      <SectionCard
        title="Lead Control Center"
        subtitle="Find opportunities, review the available evidence, and move leads through your acquisition pipeline."
      >
        <div
          style={
            toolbarStyle
          }
        >
          <div
            style={
              searchWrapStyle
            }
          >
            <span
              style={
                searchIconStyle
              }
            >
              ⌕
            </span>

            <input
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value
                )
              }
              className="crm-input"
              placeholder="Search property, owner, phone, email, city..."
              style={
                searchStyle
              }
            />

            {query && (
              <button
                type="button"
                onClick={() =>
                  setQuery('')
                }
                style={
                  clearSearchStyle
                }
              >
                ×
              </button>
            )}
          </div>

          <div
            style={
              filterRowStyle
            }
          >
            <FilterChip
              active={
                filter === 'all'
              }
              onClick={() =>
                setFilter('all')
              }
            >
              All
            </FilterChip>

            <FilterChip
              active={
                filter === 'high'
              }
              onClick={() =>
                setFilter('high')
              }
            >
              High Priority
            </FilterChip>

            <FilterChip
              active={
                filter ===
                'workable'
              }
              onClick={() =>
                setFilter(
                  'workable'
                )
              }
            >
              Workable
            </FilterChip>

            <FilterChip
              active={
                filter ===
                'missing-contact'
              }
              onClick={() =>
                setFilter(
                  'missing-contact'
                )
              }
            >
              Missing Contact
            </FilterChip>

            <FilterChip
              active={
                filter ===
                'missing-market'
              }
              onClick={() =>
                setFilter(
                  'missing-market'
                )
              }
            >
              Missing Market Data
            </FilterChip>
          </div>

          {errorMessage && (
            <div
              style={
                errorBannerStyle
              }
            >
              <span>
                {errorMessage}
              </span>

              <button
                type="button"
                onClick={() =>
                  setErrorMessage(
                    null
                  )
                }
                style={
                  errorDismissStyle
                }
              >
                ×
              </button>
            </div>
          )}

          {selectedLeadIds.length >
            0 && (
            <div
              style={
                bulkBarContainerStyle
              }
            >
              <div>
                <div
                  style={
                    bulkCountStyle
                  }
                >
                  {
                    selectedLeadIds.length
                  }{' '}
                  selected
                </div>

                <div
                  style={
                    bulkHintStyle
                  }
                >
                  Apply one status to all
                  selected leads.
                </div>
              </div>

              <div
                style={
                  bulkActionGroupStyle
                }
              >
                <select
                  value={
                    bulkStage
                  }
                  onChange={(e) =>
                    setBulkStage(
                      e.target.value
                    )
                  }
                  style={
                    selectStyle
                  }
                  disabled={
                    savingBulk
                  }
                >
                  {STAGE_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                        style={
                          optionStyle
                        }
                      >
                        Move to:{' '}
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>

                <ActionButton
                  compact
                  tone="gold"
                  onClick={
                    handleBulkStageChange
                  }
                >
                  {savingBulk
                    ? 'Saving...'
                    : 'Apply Stage'}
                </ActionButton>

                <ActionButton
                  compact
                  tone="danger"
                  onClick={
                    handleBulkDelete
                  }
                >
                  Delete Selected
                </ActionButton>
              </div>
            </div>
          )}
        </div>

        <div
          style={
            resultBarStyle
          }
        >
          <span>
            Showing{' '}
            <strong>
              {
                filteredRows.length
              }
            </strong>{' '}
            of {rows.length} leads
          </span>

          {filteredRows.length >
            0 && (
            <button
              type="button"
              onClick={
                toggleSelectAll
              }
              style={
                selectAllButtonStyle
              }
            >
              {selectedLeadIds.length ===
                filteredRows.length
                ? 'Clear selection'
                : 'Select visible'}
            </button>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredRows.length ===
          0 ? (
          <EmptyState
            query={query}
            filter={filter}
            onClear={() => {
              setQuery('')
              setFilter('all')
            }}
          />
        ) : isMobile ? (
          <div
            style={
              mobileListStyle
            }
          >
            {filteredRows.map(
              (row) => (
                <LeadCard
                  key={
                    row.lead.id
                  }
                  row={row}
                  selected={selectedLeadIds.includes(
                    row.lead.id
                  )}
                  saving={
                    savingLeadId ===
                    row.lead.id
                  }
                  onSelect={() =>
                    toggleSelectLead(
                      row.lead.id
                    )
                  }
                  onStageChange={(
                    stage
                  ) =>
                    handleUpdateStage(
                      row.lead.id,
                      stage
                    )
                  }
                  onDelete={() =>
                    handleDeleteLead(
                      row.lead.id
                    )
                  }
                />
              )
            )}
          </div>
        ) : (
          <DesktopLeadTable
            rows={
              filteredRows
            }
            selectedLeadIds={
              selectedLeadIds
            }
            savingLeadId={
              savingLeadId
            }
            onSelect={
              toggleSelectLead
            }
            onStageChange={
              handleUpdateStage
            }
            onDelete={
              handleDeleteLead
            }
          />
        )}
      </SectionCard>
    </PageShell>
  )
}

/* =========================================================
   FILTER CHIP
========================================================= */

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active
          ? activeChipStyle
          : chipStyle
      }
    >
      {children}
    </button>
  )
}

/* =========================================================
   MOBILE CARD
========================================================= */

function LeadCard({
  row,
  selected,
  saving,
  onSelect,
  onStageChange,
  onDelete,
}: {
  row: any
  selected: boolean
  saving: boolean
  onSelect: () => void
  onStageChange: (
    stage: string
  ) => void
  onDelete: () => void
}) {
  const {
    lead,
    address,
    location,
    owner,
    phone,
    email,
    stage,
    stageLabel,
    stageMeta,
    priceText,
    arvText,
    analysis,
  } = row

  return (
    <article
      style={{
        ...mobileCardStyle,
        ...(selected
          ? selectedCardStyle
          : {}),
      }}
    >
      <div
        style={
          cardHeaderStyle
        }
      >
        <div
          style={
            cardHeaderMainStyle
          }
        >
          <input
            type="checkbox"
            checked={
              selected
            }
            onChange={
              onSelect
            }
            style={
              checkboxStyle
            }
          />

          <div
            style={
              propertyTitleWrapStyle
            }
          >
            <Link
              href={`/leads/${lead.id}`}
              style={
                cardLinkStyle
              }
            >
              <div
                style={
                  mobileAddressStyle
                }
              >
                {address}
              </div>

              <div
                style={
                  mobileSubStyle
                }
              >
                {location}
              </div>
            </Link>
          </div>
        </div>

        <div
          style={{
            ...strengthBadgeStyle,
            color:
              getStrengthColor(
                analysis.strength
              ),
            borderColor:
              `${getStrengthColor(
                analysis.strength
              )}40`,
            background:
              `${getStrengthColor(
                analysis.strength
              )}10`,
          }}
        >
          <span>
            {analysis.strength}
          </span>

          <small>
            Strength
          </small>
        </div>
      </div>

      <div
        style={
          stageSectionStyle
        }
      >
        <div
          style={
            sectionLabelStyle
          }
        >
          Pipeline Stage
        </div>

        <div
          style={
            stageControlWrapStyle
          }
        >
          <select
            value={stage}
            onChange={(e) =>
              onStageChange(
                e.target.value
              )
            }
            disabled={saving}
            style={{
              ...stageSelectStyle,
              color:
                stageMeta.color,
              borderColor:
                stageMeta.border,
              background:
                stageMeta.background,
            }}
          >
            {STAGE_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                  style={
                    optionStyle
                  }
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          {saving && (
            <span
              style={
                savingTextStyle
              }
            >
              Saving…
            </span>
          )}
        </div>
      </div>

      <div
        style={
          ownerPanelStyle
        }
      >
        <div>
          <div
            style={
              sectionLabelStyle
            }
          >
            Owner
          </div>

          <div
            style={
              ownerNameStyle
            }
          >
            {owner}
          </div>
        </div>

        <div
          style={
            contactAvailabilityStyle
          }
        >
          <ContactDot
            available={
              Boolean(phone)
            }
            label="Phone"
          />

          <ContactDot
            available={
              Boolean(email)
            }
            label="Email"
          />
        </div>
      </div>

      <div
        style={
          metricGridStyle
        }
      >
        <MetricCard
          label="Value"
          value={
            priceText
          }
          tone="gold"
        />

        <MetricCard
          label="ARV"
          value={
            arvText
          }
          tone="green"
          missing={
            !lead.arv
          }
        />

        <MetricCard
          label="Contact"
          value={`${analysis.contact}`}
          tone="blue"
        />

        <MetricCard
          label="Property"
          value={`${analysis.property}`}
          tone="ice"
        />
      </div>

      <div
        style={
          analysisPanelStyle
        }
      >
        <div
          style={
            analysisHeaderStyle
          }
        >
          <div>
            <div
              style={
                sectionLabelStyle
              }
            >
              Lead Analysis
            </div>

            <div
              style={
                analysisLabelStyle
              }
            >
              {analysis.label}
            </div>
          </div>

          <span
            style={
              analysisCountStyle
            }
          >
            {analysis.evidence.length}{' '}
            evidence signals
          </span>
        </div>

        {analysis.evidence.length >
          0 && (
          <div
            style={
              evidenceListStyle
            }
          >
            {analysis.evidence
              .slice(0, 3)
              .map(
                (
                  item: string
                ) => (
                  <span
                    key={
                      item
                    }
                    style={
                      evidenceTagStyle
                    }
                  >
                    ✓ {item}
                  </span>
                )
              )}
          </div>
        )}

        {analysis.evidence.length ===
          0 && (
          <div
            style={
              noEvidenceStyle
            }
          >
            Not enough property
            information to make a
            meaningful assessment.
          </div>
        )}
      </div>

      <div
        style={
          cardActionsStyle
        }
      >
        <Link
          href={`/leads/${lead.id}`}
          style={
            workspaceButtonStyle
          }
        >
          Open Workspace
          <span>
            →
          </span>
        </Link>

        <button
          type="button"
          onClick={onDelete}
          style={
            deleteButtonStyle
          }
        >
          Delete
        </button>
      </div>
    </article>
  )
}

/* =========================================================
   DESKTOP TABLE
========================================================= */

function DesktopLeadTable({
  rows,
  selectedLeadIds,
  savingLeadId,
  onSelect,
  onStageChange,
  onDelete,
}: {
  rows: any[]
  selectedLeadIds: string[]
  savingLeadId: string | null
  onSelect: (
    id: string
  ) => void
  onStageChange: (
    id: string,
    stage: string
  ) => void
  onDelete: (
    id: string
  ) => void
}) {
  return (
    <div
      className="crm-table-wrap"
      style={
        desktopTableWrapStyle
      }
    >
      <table className="crm-table">
        <thead>
          <tr>
            <th
              style={{
                width: 40,
              }}
            />

            <th>
              Property
            </th>

            <th>
              Owner
            </th>

            <th>
              Stage
            </th>

            <th>
              Value
            </th>

            <th>
              ARV
            </th>

            <th>
              Analysis
            </th>

            <th>
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row) => {
              const {
                lead,
                address,
                location,
                owner,
                phone,
                email,
                stage,
                stageLabel,
                stageMeta,
                priceText,
                arvText,
                analysis,
              } = row

              return (
                <tr
                  key={
                    lead.id
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(
                        lead.id
                      )}
                      onChange={() =>
                        onSelect(
                          lead.id
                        )
                      }
                      style={
                        checkboxStyle
                      }
                    />
                  </td>

                  <td>
                    <Link
                      href={`/leads/${lead.id}`}
                      style={
                        cardLinkStyle
                      }
                    >
                      <div
                        style={
                          desktopLeadTitleStyle
                        }
                      >
                        {address}
                      </div>

                      <div
                        style={
                          desktopSubStyle
                        }
                      >
                        {location}
                      </div>
                    </Link>
                  </td>

                  <td>
                    <div
                      style={
                        desktopOwnerStyle
                      }
                    >
                      {owner}
                    </div>

                    <div
                      style={
                        desktopContactStyle
                      }
                    >
                      {phone ||
                        email ||
                        'No contact data'}
                    </div>
                  </td>

                  <td>
                    <div
                      style={
                        desktopStageWrapStyle
                      }
                    >
                      <select
                        value={
                          stage
                        }
                        disabled={
                          savingLeadId ===
                          lead.id
                        }
                        onChange={(e) =>
                          onStageChange(
                            lead.id,
                            e.target.value
                          )
                        }
                        style={{
                          ...desktopStageSelectStyle,
                          color:
                            stageMeta.color,
                          borderColor:
                            stageMeta.border,
                          background:
                            stageMeta.background,
                        }}
                      >
                        {STAGE_OPTIONS.map(
                          (
                            option
                          ) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                              style={
                                optionStyle
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          )
                        )}
                      </select>

                      {savingLeadId ===
                        lead.id && (
                        <span
                          style={
                            savingTextStyle
                          }
                        >
                          Saving…
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div
                      style={
                        desktopMoneyStyle
                      }
                    >
                      {priceText}
                    </div>
                  </td>

                  <td>
                    <div
                      style={
                        desktopMoneyStyle
                      }
                    >
                      {arvText}
                    </div>

                    {!lead.arv && (
                      <div
                        style={
                          missingDataStyle
                        }
                      >
                        Not calculated
                      </div>
                    )}
                  </td>

                  <td>
                    <div
                      style={
                        analysisDesktopStyle
                      }
                    >
                      <div
                        style={{
                          ...desktopStrengthScoreStyle,
                          color:
                            getStrengthColor(
                              analysis.strength
                            ),
                        }}
                      >
                        {analysis.strength}
                      </div>

                      <div>
                        <div
                          style={
                            desktopAnalysisLabelStyle
                          }
                        >
                          {
                            analysis.label
                          }
                        </div>

                        <div
                          style={
                            desktopAnalysisMetaStyle
                          }
                        >
                          {
                            analysis
                              .evidence
                              .length
                          }{' '}
                          evidence signals
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div
                      style={
                        desktopActionsStyle
                      }
                    >
                      <Link
                        href={`/leads/${lead.id}`}
                        style={
                          desktopWorkspaceButtonStyle
                        }
                      >
                        Workspace
                        <span>
                          →
                        </span>
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          onDelete(
                            lead.id
                          )
                        }
                        style={
                          iconDeleteButtonStyle
                        }
                        title="Delete lead"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              )
            }
          )}
        </tbody>
      </table>
    </div>
  )
}

/* =========================================================
   SUPPORT COMPONENTS
========================================================= */

function ContactDot({
  available,
  label,
}: {
  available: boolean
  label: string
}) {
  return (
    <span
      style={
        contactDotWrapStyle
      }
    >
      <span
        style={{
          ...contactDotStyle,
          background: available
            ? '#4ade80'
            : 'rgba(255,255,255,0.18)',
        }}
      />

      {label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  tone,
  missing,
}: {
  label: string
  value: string
  tone:
    | 'gold'
    | 'green'
    | 'blue'
    | 'ice'
  missing?: boolean
}) {
  const palette = {
    gold: {
      border:
        'rgba(214,166,75,0.18)',
      background:
        'rgba(214,166,75,0.05)',
      value:
        '#e8c574',
    },

    green: {
      border:
        'rgba(74,222,128,0.18)',
      background:
        'rgba(74,222,128,0.05)',
      value:
        '#86efac',
    },

    blue: {
      border:
        'rgba(96,165,250,0.18)',
      background:
        'rgba(96,165,250,0.05)',
      value:
        '#93c5fd',
    },

    ice: {
      border:
        'rgba(147,197,253,0.18)',
      background:
        'rgba(147,197,253,0.05)',
      value:
        '#dbeafe',
    },
  }[tone]

  return (
    <div
      style={{
        ...metricCardStyle,
        borderColor:
          palette.border,
        background:
          palette.background,
      }}
    >
      <div
        style={
          metricLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          ...metricValueStyle,
          color:
            missing
              ? 'rgba(255,255,255,0.35)'
              : palette.value,
        }}
      >
        {value}
      </div>

      {missing && (
        <div
          style={
            metricMissingStyle
          }
        >
          Awaiting data
        </div>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div
      style={
        loadingStateStyle
      }
    >
      <div
        style={
          loadingSpinnerStyle
        }
      />

      <div>
        Loading your leads…
      </div>
    </div>
  )
}

function EmptyState({
  query,
  filter,
  onClear,
}: {
  query: string
  filter: FilterKey
  onClear: () => void
}) {
  const filtered =
    Boolean(query) ||
    filter !== 'all'

  return (
    <div
      style={
        emptyStateStyle
      }
    >
      <div
        style={
          emptyIconStyle
        }
      >
        {filtered
          ? '⌕'
          : '＋'}
      </div>

      <div
        style={
          emptyTitleStyle
        }
      >
        {filtered
          ? 'No matching leads'
          : 'No leads yet'}
      </div>

      <div
        style={
          emptyDescriptionStyle
        }
      >
        {filtered
          ? 'Try changing your search or filters.'
          : 'Import a lead list to start building your acquisition pipeline.'}
      </div>

      {filtered && (
        <button
          type="button"
          onClick={
            onClear
          }
          style={
            emptyActionStyle
          }
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

/* =========================================================
   VISUAL HELPERS
========================================================= */

function getStrengthColor(
  score: number
) {
  if (score >= 85)
    return '#4ade80'

  if (score >= 70)
    return '#d6a64b'

  if (score >= 50)
    return '#f59e0b'

  return '#93c5fd'
}

/* =========================================================
   STYLES
========================================================= */

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const searchWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: 14,
  zIndex: 2,
  fontSize: 20,
  color: 'rgba(255,255,255,0.35)',
  pointerEvents: 'none',
}

const searchStyle: CSSProperties = {
  width: '100%',
  minHeight: 46,
  paddingLeft: 42,
  paddingRight: 42,
}

const clearSearchStyle: CSSProperties = {
  position: 'absolute',
  right: 10,
  width: 28,
  height: 28,
  borderRadius: 8,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.05)',
  color:
    'rgba(255,255,255,0.65)',
  cursor: 'pointer',
  fontSize: 18,
}

const filterRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 2,
}

const chipStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 13px',
  borderRadius: 999,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.025)',
  color:
    'rgba(255,255,255,0.65)',
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const activeChipStyle: CSSProperties = {
  ...chipStyle,
  border:
    '1px solid rgba(214,166,75,0.32)',
  background:
    'linear-gradient(180deg, rgba(214,166,75,0.15), rgba(214,166,75,0.07))',
  color: '#f5d58d',
}

const resultBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 14,
  marginBottom: 10,
  padding: '0 2px',
  color:
    'rgba(255,255,255,0.38)',
  fontSize: 11,
}

const selectAllButtonStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  color: '#d6a64b',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
}

const errorBannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 13px',
  borderRadius: 11,
  border:
    '1px solid rgba(239,68,68,0.25)',
  background:
    'rgba(239,68,68,0.08)',
  color: '#fca5a5',
  fontSize: 12,
}

const errorDismissStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  color: '#fca5a5',
  cursor: 'pointer',
  fontSize: 18,
}

const bulkBarContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  padding: '12px 14px',
  borderRadius: 14,
  border:
    '1px solid rgba(214,166,75,0.24)',
  background:
    'linear-gradient(135deg, rgba(30,24,14,0.92), rgba(10,9,6,0.98))',
  flexWrap: 'wrap',
}

const bulkCountStyle: CSSProperties = {
  color: '#e7c36c',
  fontSize: 13,
  fontWeight: 800,
}

const bulkHintStyle: CSSProperties = {
  marginTop: 2,
  color:
    'rgba(255,255,255,0.40)',
  fontSize: 10,
}

const bulkActionGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const selectStyle: CSSProperties = {
  minHeight: 34,
  padding: '0 10px',
  borderRadius: 9,
  border:
    '1px solid rgba(255,255,255,0.12)',
  background:
    'rgba(12,12,12,0.95)',
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 700,
  outline: 'none',
  cursor: 'pointer',
}

const optionStyle: CSSProperties = {
  background: '#121212',
  color: '#ffffff',
}

const checkboxStyle: CSSProperties = {
  accentColor: '#d6a64b',
  width: 16,
  height: 16,
  cursor: 'pointer',
  flexShrink: 0,
}

const mobileListStyle: CSSProperties = {
  display: 'grid',
  gap: 13,
}

const mobileCardStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 16,
  borderRadius: 20,
  border:
    '1px solid rgba(255,255,255,0.075)',
  background:
    'linear-gradient(145deg, rgba(16,16,16,0.98), rgba(5,5,5,1))',
  boxShadow:
    '0 10px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.025)',
}

const selectedCardStyle: CSSProperties = {
  border:
    '1px solid rgba(214,166,75,0.35)',
  boxShadow:
    '0 10px 35px rgba(0,0,0,0.30), 0 0 0 1px rgba(214,166,75,0.06)',
}

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const cardHeaderMainStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 11,
  minWidth: 0,
  flex: 1,
}

const propertyTitleWrapStyle: CSSProperties = {
  minWidth: 0,
}

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const mobileAddressStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.15,
  fontWeight: 850,
  letterSpacing: '-0.025em',
  color: '#ffffff',
  overflowWrap: 'anywhere',
}

const mobileSubStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 10,
  lineHeight: 1.4,
  fontWeight: 600,
  color:
    'rgba(255,255,255,0.40)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const strengthBadgeStyle: CSSProperties = {
  minWidth: 55,
  padding: '7px 8px',
  borderRadius: 11,
  border: '1px solid',
  display: 'grid',
  justifyItems: 'center',
  gap: 1,
  flexShrink: 0,
}

const strengthBadgeNumberStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
}

const stageSectionStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
  paddingTop: 2,
}

const sectionLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color:
    'rgba(255,255,255,0.36)',
}

const stageControlWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const stageSelectStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid',
  outline: 'none',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
}

const savingTextStyle: CSSProperties = {
  flexShrink: 0,
  color:
    'rgba(255,255,255,0.35)',
  fontSize: 10,
  fontWeight: 700,
}

const ownerPanelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 13px',
  borderRadius: 13,
  border:
    '1px solid rgba(255,255,255,0.055)',
  background:
    'rgba(255,255,255,0.018)',
}

const ownerNameStyle: CSSProperties = {
  marginTop: 4,
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 750,
  overflowWrap: 'anywhere',
}

const contactAvailabilityStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const contactDotWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  color:
    'rgba(255,255,255,0.45)',
  fontSize: 9,
  fontWeight: 700,
}

const contactDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
}

const metricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 9,
}

const metricCardStyle: CSSProperties = {
  minWidth: 0,
  padding: '11px 12px',
  borderRadius: 13,
  border: '1px solid',
  display: 'grid',
  gap: 5,
}

const metricLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  color:
    'rgba(255,255,255,0.37)',
}

const metricValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 850,
  overflowWrap: 'anywhere',
}

const metricMissingStyle: CSSProperties = {
  fontSize: 8,
  color:
    'rgba(255,255,255,0.25)',
}

const analysisPanelStyle: CSSProperties = {
  padding: 13,
  borderRadius: 14,
  border:
    '1px solid rgba(255,255,255,0.055)',
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
}

const analysisHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}

const analysisLabelStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 13,
  fontWeight: 800,
  color: '#ffffff',
}

const analysisCountStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.30)',
  fontSize: 9,
  whiteSpace: 'nowrap',
}

const evidenceListStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 9,
}

const evidenceTagStyle: CSSProperties = {
  padding: '5px 7px',
  borderRadius: 7,
  border:
    '1px solid rgba(74,222,128,0.14)',
  background:
    'rgba(74,222,128,0.045)',
  color:
    'rgba(187,247,208,0.75)',
  fontSize: 9,
  fontWeight: 650,
}

const noEvidenceStyle: CSSProperties = {
  marginTop: 8,
  color:
    'rgba(255,255,255,0.35)',
  fontSize: 10,
  lineHeight: 1.45,
}

const cardActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  paddingTop: 2,
}

const workspaceButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  flex: 1,
  minHeight: 40,
  padding: '0 13px',
  borderRadius: 10,
  border:
    '1px solid rgba(214,166,75,0.25)',
  background:
    'rgba(214,166,75,0.08)',
  color: '#e4bd69',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 800,
}

const deleteButtonStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  color:
    'rgba(239,68,68,0.75)',
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 700,
  padding: '8px 2px',
}

const desktopTableWrapStyle: CSSProperties = {
  marginTop: 4,
  borderRadius: 14,
  overflow: 'hidden',
  border:
    '1px solid rgba(255,255,255,0.055)',
}

const desktopLeadTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: '#ffffff',
  lineHeight: 1.25,
}

const desktopSubStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 10,
  color:
    'rgba(255,255,255,0.40)',
  lineHeight: 1.35,
}

const desktopOwnerStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#ffffff',
}

const desktopContactStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 10,
  color:
    'rgba(255,255,255,0.36)',
}

const desktopStageWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
}

const desktopStageSelectStyle: CSSProperties = {
  minHeight: 32,
  maxWidth: 150,
  padding: '0 9px',
  borderRadius: 8,
  border: '1px solid',
  outline: 'none',
  fontSize: 10,
  fontWeight: 800,
  cursor: 'pointer',
}

const desktopMoneyStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#ffffff',
}

const missingDataStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 8,
  color:
    'rgba(255,255,255,0.25)',
}

const analysisDesktopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
}

const desktopStrengthScoreStyle: CSSProperties = {
  minWidth: 32,
  fontSize: 18,
  fontWeight: 900,
}

const desktopAnalysisLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 750,
  color: '#ffffff',
}

const desktopAnalysisMetaStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 8,
  color:
    'rgba(255,255,255,0.32)',
}

const desktopActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
}

const desktopWorkspaceButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '7px 10px',
  borderRadius: 8,
  border:
    '1px solid rgba(214,166,75,0.22)',
  background:
    'rgba(214,166,75,0.07)',
  color: '#d9b45e',
  textDecoration: 'none',
  fontSize: 10,
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

const iconDeleteButtonStyle: CSSProperties = {
  width: 29,
  height: 29,
  borderRadius: 8,
  border:
    '1px solid rgba(239,68,68,0.20)',
  background:
    'rgba(239,68,68,0.07)',
  color:
    'rgba(239,68,68,0.75)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 16,
}

const loadingStateStyle: CSSProperties = {
  minHeight: 240,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  color:
    'rgba(255,255,255,0.40)',
  fontSize: 12,
}

const loadingSpinnerStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  border:
    '2px solid rgba(214,166,75,0.15)',
  borderTopColor: '#d6a64b',
  animation:
    'spin 0.8s linear infinite',
}

const emptyStateStyle: CSSProperties = {
  minHeight: 300,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: 30,
}

const emptyIconStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 15,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'rgba(214,166,75,0.08)',
  border:
    '1px solid rgba(214,166,75,0.15)',
  color: '#d6a64b',
  fontSize: 24,
}

const emptyTitleStyle: CSSProperties = {
  marginTop: 13,
  fontSize: 16,
  fontWeight: 800,
  color: '#ffffff',
}

const emptyDescriptionStyle: CSSProperties = {
  marginTop: 5,
  maxWidth: 390,
  fontSize: 11,
  lineHeight: 1.5,
  color:
    'rgba(255,255,255,0.38)',
}

const emptyActionStyle: CSSProperties = {
  marginTop: 14,
  border:
    '1px solid rgba(214,166,75,0.22)',
  background:
    'rgba(214,166,75,0.08)',
  color: '#d6a64b',
  borderRadius: 9,
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 800,
  cursor: 'pointer',
}