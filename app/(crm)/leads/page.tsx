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

  owner_email?: string | null
  email1?: string | null

  city?: string | null
  property_city?: string | null

  state?: string | null
  property_state?: string | null

  zip?: string | null
  property_zip?: string | null

  /*
   * STATUS IS THE CANONICAL PIPELINE STAGE USED BY THIS PAGE.
   *
   * The other fields are retained for reading old/imported data,
   * but we do NOT write to all of them when changing a stage.
   */
  status?: string | null

  /*
   * Legacy / existing fields that may exist in imported records.
   */
  stage?: string | null
  lead_status?: string | null
  deal_status?: string | null
  pipeline_stage?: string | null

  asking_price?: number | null
  listing_price?: number | null

  market_value?: number | null
  estimated_value?: number | null

  arv?: number | null
  mao?: number | null

  /*
   * Optional property details.
   * These are used only when they actually exist.
   */
  bedrooms?: number | null
  bathrooms?: number | null
  sqft?: number | null
  living_area_sqft?: number | null
  year_built?: number | null

  property_type?: string | null
  condition?: string | null

  lot_size?: number | null
  garage_spaces?: number | null

  created_at?: string | null
  updated_at?: string | null
}

type FilterKey =
  | 'all'
  | 'high'
  | 'workable'
  | 'missing-contact'
  | 'missing-market'

type EvidenceLevel =
  | 'strong'
  | 'moderate'
  | 'limited'
  | 'insufficient'

type AnalysisResult = {
  strength: number | null
  evidenceLevel: EvidenceLevel
  reasons: string[]
  missing: string[]
}

/* =========================================================
   PIPELINE STAGES
========================================================= */

const STAGE_OPTIONS = [
  {
    value: 'new_lead',
    label: 'New Lead',
    description: 'Newly added lead',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    description: 'Initial contact attempted or completed',
  },
  {
    value: 'appointment_set',
    label: 'Appointment Set',
    description: 'Appointment scheduled',
  },
  {
    value: 'offer_sent',
    label: 'Offer Sent',
    description: 'Offer delivered to seller',
  },
  {
    value: 'negotiation',
    label: 'Negotiation',
    description: 'Negotiating terms',
  },
  {
    value: 'under_contract',
    label: 'Under Contract',
    description: 'Contract executed',
  },
  {
    value: 'closed',
    label: 'Closed',
    description: 'Deal completed',
  },
  {
    value: 'dead_lead',
    label: 'Dead / Archive',
    description: 'No longer active',
  },
] as const

type StageValue = (typeof STAGE_OPTIONS)[number]['value']

/* =========================================================
   HELPERS
========================================================= */

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

function toNumber(
  value: number | string | null | undefined
): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return null
  }

  return numeric
}

function formatMoney(
  value: number | string | null | undefined
): string {
  const numeric = toNumber(value)

  if (numeric === null) {
    return '—'
  }

  return `$${Math.round(numeric).toLocaleString()}`
}

function formatNumber(
  value: number | string | null | undefined
): string {
  const numeric = toNumber(value)

  if (numeric === null) {
    return '—'
  }

  return Math.round(numeric).toLocaleString()
}

function titleCase(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function normalizeStage(value: string | null | undefined): StageValue {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  const exists = STAGE_OPTIONS.some(
    (option) => option.value === normalized
  )

  if (exists) {
    return normalized as StageValue
  }

  /*
   * Handle common legacy values.
   */
  if (normalized === 'new') {
    return 'new_lead'
  }

  if (normalized === 'appointment') {
    return 'appointment_set'
  }

  if (normalized === 'offer') {
    return 'offer_sent'
  }

  if (normalized === 'contract') {
    return 'under_contract'
  }

  if (
    normalized === 'dead' ||
    normalized === 'archived' ||
    normalized === 'archive'
  ) {
    return 'dead_lead'
  }

  return 'new_lead'
}

function getLeadStage(lead: LeadRow): StageValue {
  /*
   * STATUS is intentionally first.
   *
   * Older records can still fall back to legacy fields.
   */
  return normalizeStage(
    firstNonEmpty(
      lead.status,
      lead.stage,
      lead.lead_status,
      lead.pipeline_stage,
      lead.deal_status
    )
  )
}

function getStageMeta(stage: string) {
  const normalized = normalizeStage(stage)

  switch (normalized) {
    case 'contacted':
      return {
        color: '#f59e0b',
        background: 'rgba(245,158,11,0.10)',
        border: 'rgba(245,158,11,0.28)',
      }

    case 'appointment_set':
      return {
        color: '#38bdf8',
        background: 'rgba(56,189,248,0.10)',
        border: 'rgba(56,189,248,0.28)',
      }

    case 'offer_sent':
      return {
        color: '#fbbf24',
        background: 'rgba(251,191,36,0.10)',
        border: 'rgba(251,191,36,0.28)',
      }

    case 'negotiation':
      return {
        color: '#a78bfa',
        background: 'rgba(167,139,250,0.10)',
        border: 'rgba(167,139,250,0.28)',
      }

    case 'under_contract':
      return {
        color: '#4ade80',
        background: 'rgba(74,222,128,0.10)',
        border: 'rgba(74,222,128,0.28)',
      }

    case 'closed':
      return {
        color: '#22c55e',
        background: 'rgba(34,197,94,0.12)',
        border: 'rgba(34,197,94,0.30)',
      }

    case 'dead_lead':
      return {
        color: '#ef4444',
        background: 'rgba(239,68,68,0.10)',
        border: 'rgba(239,68,68,0.28)',
      }

    case 'new_lead':
    default:
      return {
        color: '#d6a64b',
        background: 'rgba(214,166,75,0.10)',
        border: 'rgba(214,166,75,0.28)',
      }
  }
}

function getAddress(lead: LeadRow): string {
  return (
    firstNonEmpty(
      lead.property_address_1,
      lead.property_address
    ) || 'Unknown property'
  )
}

function getLocation(lead: LeadRow): string {
  const city = firstNonEmpty(
    lead.city,
    lead.property_city
  )

  const state = firstNonEmpty(
    lead.state,
    lead.property_state
  )

  const zip = firstNonEmpty(
    lead.zip,
    lead.property_zip
  )

  return [city, state, zip]
    .filter(Boolean)
    .join(', ') || 'Location pending'
}

function getPhone(lead: LeadRow): string | null {
  return firstNonEmpty(
    lead.owner_phone_primary,
    lead.phone1
  )
}

function getEmail(lead: LeadRow): string | null {
  return firstNonEmpty(
    lead.owner_email,
    lead.email1
  )
}

function getOwner(lead: LeadRow): string {
  return (
    firstNonEmpty(lead.owner_name) ||
    'Owner information unavailable'
  )
}

function getAskingPrice(lead: LeadRow): number | null {
  return (
    toNumber(lead.asking_price) ??
    toNumber(lead.listing_price)
  )
}

function getMarketValue(lead: LeadRow): number | null {
  return (
    toNumber(lead.market_value) ??
    toNumber(lead.estimated_value)
  )
}

function getArv(lead: LeadRow): number | null {
  return toNumber(lead.arv)
}

function getMao(lead: LeadRow): number | null {
  return toNumber(lead.mao)
}

/* =========================================================
   REAL EVIDENCE ANALYSIS
========================================================= */

/*
 * IMPORTANT:
 *
 * This is NOT a fake "lead strength" score.
 *
 * It starts with ZERO evidence and only adds evidence that
 * actually exists on the lead.
 *
 * If the available property information is insufficient,
 * strength remains null.
 *
 * No arbitrary 55/100 starting score.
 */

function analyzeLead(lead: LeadRow): AnalysisResult {
  const reasons: string[] = []
  const missing: string[] = []

  let evidence = 0

  const address = getAddress(lead)
  const askingPrice = getAskingPrice(lead)
  const marketValue = getMarketValue(lead)
  const arv = getArv(lead)

  const phone = getPhone(lead)
  const email = getEmail(lead)

  const bedrooms = toNumber(lead.bedrooms)
  const bathrooms = toNumber(lead.bathrooms)

  const sqft =
    toNumber(lead.sqft) ??
    toNumber(lead.living_area_sqft)

  const yearBuilt = toNumber(lead.year_built)

  /*
   * Property identity.
   */
  if (address !== 'Unknown property') {
    evidence += 10
    reasons.push('Property address is available.')
  } else {
    missing.push('Property address')
  }

  /*
   * Seller contact.
   */
  if (phone) {
    evidence += 15
    reasons.push('Seller phone number is available.')
  } else {
    missing.push('Seller phone')
  }

  if (email) {
    evidence += 5
    reasons.push('Seller email is available.')
  }

  /*
   * Asking price.
   */
  if (askingPrice !== null) {
    evidence += 15
    reasons.push(
      `Asking/listing price is available at ${formatMoney(askingPrice)}.`
    )
  } else {
    missing.push('Asking/listing price')
  }

  /*
   * Market value.
   *
   * This is evidence only. It is NOT treated as ARV.
   */
  if (marketValue !== null) {
    evidence += 15
    reasons.push(
      `A market-value estimate is available at ${formatMoney(
        marketValue
      )}.`
    )
  } else {
    missing.push('Verified market-value estimate')
  }

  /*
   * ARV.
   *
   * This is only considered evidence if it already exists as
   * actual property analysis data.
   */
  if (arv !== null) {
    evidence += 15
    reasons.push(
      `ARV data is available at ${formatMoney(arv)}.`
    )
  } else {
    missing.push('Verified ARV from comparable sales')
  }

  /*
   * Property characteristics.
   */
  if (bedrooms !== null) {
    evidence += 5
    reasons.push(`${bedrooms} bedroom count is available.`)
  } else {
    missing.push('Bedroom count')
  }

  if (bathrooms !== null) {
    evidence += 5
    reasons.push(`${bathrooms} bathroom count is available.`)
  } else {
    missing.push('Bathroom count')
  }

  if (sqft !== null) {
    evidence += 5
    reasons.push(
      `${formatNumber(sqft)} square feet is available.`
    )
  } else {
    missing.push('Living area')
  }

  if (yearBuilt !== null) {
    evidence += 5
    reasons.push(`Year built (${yearBuilt}) is available.`)
  }

  /*
   * We require meaningful property evidence before producing
   * a numerical strength score.
   *
   * Contact information by itself is NOT enough.
   */
  const propertyEvidence =
    address !== 'Unknown property' ||
    askingPrice !== null ||
    marketValue !== null ||
    arv !== null ||
    bedrooms !== null ||
    bathrooms !== null ||
    sqft !== null

  if (!propertyEvidence) {
    return {
      strength: null,
      evidenceLevel: 'insufficient',
      reasons: [],
      missing: Array.from(
        new Set([
          'Property information',
          ...missing,
        ])
      ),
    }
  }

  /*
   * Evidence thresholds.
   *
   * These represent confidence in the available analysis,
   * not "motivation magically equals X".
   */
  let strength: number | null = evidence

  if (strength < 30) {
    strength = null
  } else {
    strength = Math.min(100, strength)
  }

  if (strength === null) {
    return {
      strength: null,
      evidenceLevel: 'insufficient',
      reasons,
      missing: Array.from(new Set(missing)),
    }
  }

  let evidenceLevel: EvidenceLevel

  if (strength >= 80) {
    evidenceLevel = 'strong'
  } else if (strength >= 60) {
    evidenceLevel = 'moderate'
  } else if (strength >= 30) {
    evidenceLevel = 'limited'
  } else {
    evidenceLevel = 'insufficient'
  }

  return {
    strength,
    evidenceLevel,
    reasons,
    missing: Array.from(new Set(missing)),
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<string[]>([])

  const [query, setQuery] = useState('')
  const [filter, setFilter] =
    useState<FilterKey>('all')

  const [isMobile, setIsMobile] =
    useState(false)

  const [selectedLeadIds, setSelectedLeadIds] =
    useState<string[]>([])

  const [bulkStage, setBulkStage] =
    useState<StageValue>('new_lead')

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null)

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  useEffect(() => {
    function syncViewport() {
      setIsMobile(window.innerWidth <= 900)
    }

    syncViewport()

    window.addEventListener(
      'resize',
      syncViewport
    )

    return () => {
      window.removeEventListener(
        'resize',
        syncViewport
      )
    }
  }, [])

  /* =======================================================
     LOAD LEADS
  ======================================================= */

  async function loadLeads() {
    setLoading(true)
    setErrorMessage(null)

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

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
        Array.isArray(data)
          ? (data as LeadRow[])
          : []
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
      const stage = getLeadStage(lead)
      const stageMeta = getStageMeta(stage)

      const analysis = analyzeLead(lead)

      return {
        lead,

        address: getAddress(lead),
        location: getLocation(lead),

        owner: getOwner(lead),
        phone: getPhone(lead),
        email: getEmail(lead),

        stage,
        stageLabel: titleCase(stage),

        stageColor: stageMeta.color,
        stageBackground:
          stageMeta.background,
        stageBorder:
          stageMeta.border,

        askingPrice:
          getAskingPrice(lead),

        marketValue:
          getMarketValue(lead),

        arv:
          getArv(lead),

        mao:
          getMao(lead),

        analysis,
      }
    })
  }, [leads])

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRows = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()

    return rows.filter((row) => {
      const haystack = [
        row.address,
        row.location,
        row.owner,
        row.phone || '',
        row.email || '',
        row.stageLabel,
      ]
        .join(' ')
        .toLowerCase()

      if (
        q.length > 0 &&
        !haystack.includes(q)
      ) {
        return false
      }

      if (filter === 'high') {
        return (
          row.analysis.strength !== null &&
          row.analysis.strength >= 80
        )
      }

      if (filter === 'workable') {
        return (
          row.analysis.strength !== null &&
          row.analysis.strength >= 60
        )
      }

      if (filter === 'missing-contact') {
        return (
          !row.phone &&
          !row.email
        )
      }

      if (filter === 'missing-market') {
        return (
          row.marketValue === null &&
          row.arv === null
        )
      }

      return true
    })
  }, [
    rows,
    query,
    filter,
  ])

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const analyzed = rows.filter(
      (row) =>
        row.analysis.strength !== null
    )

    return {
      total: rows.length,

      highPriority:
        analyzed.filter(
          (row) =>
            row.analysis.strength !== null &&
            row.analysis.strength >= 80
        ).length,

      workable:
        analyzed.filter(
          (row) =>
            row.analysis.strength !== null &&
            row.analysis.strength >= 60
        ).length,

      insufficient:
        rows.filter(
          (row) =>
            row.analysis.strength === null
        ).length,

      missingContact:
        rows.filter(
          (row) =>
            !row.phone &&
            !row.email
        ).length,
    }
  }, [rows])

  /* =======================================================
     STATUS UPDATE
  ======================================================= */

  async function handleUpdateStage(
    leadId: string,
    nextStage: string
  ) {
    const normalizedStage =
      normalizeStage(nextStage)

    setErrorMessage(null)
    setSuccessMessage(null)

    /*
     * Prevent duplicate requests.
     */
    if (savingIds.includes(leadId)) {
      return
    }

    const previousLead =
      leads.find(
        (lead) => lead.id === leadId
      )

    if (!previousLead) {
      return
    }

    const previousStatus =
      previousLead.status ?? null

    /*
     * Optimistic UI.
     *
     * We update only `status`.
     * Pipeline should read this same canonical field.
     */
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: normalizedStage,
            }
          : lead
      )
    )

    setSavingIds((current) => [
      ...current,
      leadId,
    ])

    /*
     * Supabase update.
     *
     * IMPORTANT:
     * Only update the known canonical `status`
     * column instead of guessing that every possible
     * legacy column exists.
     */
    const { error } = await supabase
      .from('leads')
      .update({
        status: normalizedStage,
      })
      .eq('id', leadId)

    setSavingIds((current) =>
      current.filter(
        (id) => id !== leadId
      )
    )

    if (error) {
      console.error(
        'Failed to update lead status:',
        error
      )

      /*
       * Roll back optimistic change.
       */
      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                status: previousStatus,
              }
            : lead
        )
      )

      setErrorMessage(
        `Could not update status: ${error.message}`
      )

      return
    }

    setSuccessMessage(
      `Lead moved to ${titleCase(
        normalizedStage
      )}.`
    )

    /*
     * Clear success notification automatically.
     */
    window.setTimeout(() => {
      setSuccessMessage(null)
    }, 2500)
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleDeleteLead(
    leadId: string
  ) {
    const confirmed = window.confirm(
      'Delete this lead permanently? This cannot be undone.'
    )

    if (!confirmed) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      console.error(
        'Failed to delete lead:',
        error
      )

      setErrorMessage(
        `Could not delete lead: ${error.message}`
      )

      return
    }

    setLeads((current) =>
      current.filter(
        (lead) => lead.id !== leadId
      )
    )

    setSelectedLeadIds((current) =>
      current.filter(
        (id) => id !== leadId
      )
    )

    setSuccessMessage(
      'Lead deleted.'
    )

    window.setTimeout(() => {
      setSuccessMessage(null)
    }, 2500)
  }

  /* =======================================================
     BULK STATUS
  ======================================================= */

  async function handleBulkStageChange() {
    if (
      selectedLeadIds.length === 0
    ) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    const selectedIds =
      [...selectedLeadIds]

    /*
     * Optimistic update.
     */
    setLeads((current) =>
      current.map((lead) =>
        selectedIds.includes(lead.id)
          ? {
              ...lead,
              status: bulkStage,
            }
          : lead
      )
    )

    /*
     * One filtered Supabase update.
     *
     * This uses the same canonical status field
     * as the individual status control.
     */
    const { error } = await supabase
      .from('leads')
      .update({
        status: bulkStage,
      })
      .in('id', selectedIds)

    if (error) {
      console.error(
        'Failed to bulk update leads:',
        error
      )

      /*
       * Reload to restore the database state.
       */
      await loadLeads()

      setErrorMessage(
        `Could not update selected leads: ${error.message}`
      )

      return
    }

    setSelectedLeadIds([])

    setSuccessMessage(
      `${selectedIds.length} lead${
        selectedIds.length === 1
          ? ''
          : 's'
      } moved to ${titleCase(
        bulkStage
      )}.`
    )

    window.setTimeout(() => {
      setSuccessMessage(null)
    }, 2500)
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

    const confirmed =
      window.confirm(
        `Delete ${selectedLeadIds.length} selected lead${
          selectedLeadIds.length === 1
            ? ''
            : 's'
        } permanently?`
      )

    if (!confirmed) {
      return
    }

    setErrorMessage(null)

    const selectedIds =
      [...selectedLeadIds]

    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', selectedIds)

    if (error) {
      console.error(
        'Failed to delete selected leads:',
        error
      )

      setErrorMessage(
        `Could not delete selected leads: ${error.message}`
      )

      return
    }

    setLeads((current) =>
      current.filter(
        (lead) =>
          !selectedIds.includes(
            lead.id
          )
      )
    )

    setSelectedLeadIds([])

    setSuccessMessage(
      `${selectedIds.length} lead${
        selectedIds.length === 1
          ? ''
          : 's'
      } deleted.`
    )

    window.setTimeout(() => {
      setSuccessMessage(null)
    }, 2500)
  }

  /* =======================================================
     SELECTION
  ======================================================= */

  function toggleSelectLead(
    id: string
  ) {
    setSelectedLeadIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) => item !== id
            )
          : [...current, id]
    )
  }

  function toggleSelectAll() {
    const visibleIds =
      filteredRows.map(
        (row) => row.lead.id
      )

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        selectedLeadIds.includes(id)
      )

    if (allSelected) {
      setSelectedLeadIds(
        (current) =>
          current.filter(
            (id) =>
              !visibleIds.includes(id)
          )
      )
    } else {
      setSelectedLeadIds(
        (current) =>
          Array.from(
            new Set([
              ...current,
              ...visibleIds,
            ])
          )
      )
    }
  }

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every(
      (row) =>
        selectedLeadIds.includes(
          row.lead.id
        )
    )

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <PageShell
      title="Leads"
      subtitle={
        isMobile
          ? 'Prioritize opportunities, update stages, and open the property workspace.'
          : 'Your central lead control center — property intelligence, contact information, pipeline stage, and workspace access.'
      }
      actions={
        <>
          <StatPill
            label="Total"
            value={stats.total}
          />

          <StatPill
            label="High Priority"
            value={stats.highPriority}
          />

          <StatPill
            label="Workable"
            value={stats.workable}
          />

          <StatPill
            label="Needs Data"
            value={stats.insufficient}
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
        subtitle="Find opportunities quickly, keep pipeline stages synchronized, and open the full property workspace."
      >
        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        {(errorMessage ||
          successMessage) && (
          <div
            style={{
              ...notificationStyle,
              ...(errorMessage
                ? errorNotificationStyle
                : successNotificationStyle),
            }}
          >
            <span>
              {errorMessage ||
                successMessage}
            </span>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
              style={
                notificationCloseStyle
              }
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div style={toolbarStyle}>
          <div
            style={
              searchAndImportStyle
            }
          >
            <div
              style={
                searchWrapperStyle
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
                onChange={(event) =>
                  setQuery(
                    event.target.value
                  )
                }
                className="crm-input"
                placeholder="Search address, owner, phone, email..."
                style={
                  searchInputStyle
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
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <Link
              href="/imports"
              style={
                importLinkStyle
              }
            >
              <ActionButton
                compact
                tone="gold"
              >
                Import Leads
              </ActionButton>
            </Link>
          </div>

          <div
            style={
              filterScrollStyle
            }
          >
            <FilterButton
              label="All"
              active={
                filter === 'all'
              }
              onClick={() =>
                setFilter('all')
              }
            />

            <FilterButton
              label="High Priority"
              active={
                filter === 'high'
              }
              onClick={() =>
                setFilter('high')
              }
            />

            <FilterButton
              label="Workable"
              active={
                filter === 'workable'
              }
              onClick={() =>
                setFilter('workable')
              }
            />

            <FilterButton
              label="Missing Contact"
              active={
                filter ===
                'missing-contact'
              }
              onClick={() =>
                setFilter(
                  'missing-contact'
                )
              }
            />

            <FilterButton
              label="Missing Market Data"
              active={
                filter ===
                'missing-market'
              }
              onClick={() =>
                setFilter(
                  'missing-market'
                )
              }
            />
          </div>

          {selectedLeadIds.length >
            0 && (
            <div
              style={
                bulkBarStyle
              }
            >
              <div
                style={
                  bulkSelectionTextStyle
                }
              >
                <strong>
                  {
                    selectedLeadIds.length
                  }
                </strong>{' '}
                selected
              </div>

              <div
                style={
                  bulkActionsStyle
                }
              >
                <select
                  value={
                    bulkStage
                  }
                  onChange={(event) =>
                    setBulkStage(
                      normalizeStage(
                        event.target
                          .value
                      )
                    )
                  }
                  style={
                    bulkSelectStyle
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
                      >
                        {option.label}
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
                  Move Stage
                </ActionButton>

                <ActionButton
                  compact
                  tone="danger"
                  onClick={
                    handleBulkDelete
                  }
                >
                  Delete
                </ActionButton>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

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
                <MobileLeadCard
                  key={
                    row.lead.id
                  }
                  row={row}
                  selected={selectedLeadIds.includes(
                    row.lead.id
                  )}
                  saving={savingIds.includes(
                    row.lead.id
                  )}
                  onSelect={() =>
                    toggleSelectLead(
                      row.lead.id
                    )
                  }
                  onStageChange={(
                    stage
                  ) =>
                    void handleUpdateStage(
                      row.lead.id,
                      stage
                    )
                  }
                  onDelete={() =>
                    void handleDeleteLead(
                      row.lead.id
                    )
                  }
                />
              )
            )}
          </div>
        ) : (
          <DesktopLeadTable
            rows={filteredRows}
            selectedLeadIds={
              selectedLeadIds
            }
            allVisibleSelected={
              allVisibleSelected
            }
            savingIds={savingIds}
            onToggleAll={
              toggleSelectAll
            }
            onToggleLead={
              toggleSelectLead
            }
            onStageChange={(
              id,
              stage
            ) =>
              void handleUpdateStage(
                id,
                stage
              )
            }
            onDelete={(id) =>
              void handleDeleteLead(
                id
              )
            }
          />
        )}
      </SectionCard>
    </PageShell>
  )
}

/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active
          ? activeFilterStyle
          : filterButtonStyle
      }
    >
      {label}
    </button>
  )
}

/* =========================================================
   MOBILE CARD
========================================================= */

type LeadViewRow = {
  lead: LeadRow
  address: string
  location: string
  owner: string
  phone: string | null
  email: string | null

  stage: StageValue
  stageLabel: string
  stageColor: string
  stageBackground: string
  stageBorder: string

  askingPrice: number | null
  marketValue: number | null
  arv: number | null
  mao: number | null

  analysis: AnalysisResult
}

function MobileLeadCard({
  row,
  selected,
  saving,
  onSelect,
  onStageChange,
  onDelete,
}: {
  row: LeadViewRow
  selected: boolean
  saving: boolean
  onSelect: () => void
  onStageChange: (
    stage: string
  ) => void
  onDelete: () => void
}) {
  const strength =
    row.analysis.strength

  return (
    <article
      style={
        mobileLeadCardStyle
      }
    >
      {/* Header */}
      <div
        style={
          mobileCardHeaderStyle
        }
      >
        <div
          style={
            mobileHeaderLeftStyle
          }
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            style={checkboxStyle}
            aria-label="Select lead"
          />

          <div
            style={
              propertyIdentityStyle
            }
          >
            <Link
              href={`/leads/${row.lead.id}`}
              style={
                propertyAddressLinkStyle
              }
            >
              {row.address}
            </Link>

            <div
              style={
                propertyLocationStyle
              }
            >
              {row.location}
            </div>
          </div>
        </div>

        {strength !== null ? (
          <StrengthBadge
            score={strength}
          />
        ) : (
          <span
            style={
              noDataBadgeStyle
            }
          >
            Needs Data
          </span>
        )}
      </div>

      {/* Stage */}
      <div
        style={
          stageCardStyle
        }
      >
        <div
          style={
            stageLabelRowStyle
          }
        >
          <span
            style={
              fieldLabelStyle
            }
          >
            PIPELINE STAGE
          </span>

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

        <select
          value={row.stage}
          disabled={saving}
          onChange={(event) =>
            onStageChange(
              event.target.value
            )
          }
          style={{
            ...mobileStageSelectStyle,
            color: row.stageColor,
            borderColor:
              row.stageBorder,
            background:
              row.stageBackground,
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
              >
                {option.label}
              </option>
            )
          )}
        </select>
      </div>

      {/* Seller */}
      <div
        style={
          sellerBlockStyle
        }
      >
        <div>
          <div
            style={
              fieldLabelStyle
            }
          >
            OWNER
          </div>

          <div
            style={
              ownerNameStyle
            }
          >
            {row.owner}
          </div>
        </div>

        <div
          style={
            contactActionsStyle
          }
        >
          {row.phone ? (
            <a
              href={`tel:${row.phone}`}
              style={
                contactActionStyle
              }
            >
              Call
            </a>
          ) : null}

          {row.email ? (
            <a
              href={`mailto:${row.email}`}
              style={
                contactActionStyle
              }
            >
              Email
            </a>
          ) : null}
        </div>
      </div>

      {/* Numbers */}
      <div
        style={
          financialGridStyle
        }
      >
        <FinancialCard
          label="Asking"
          value={formatMoney(
            row.askingPrice
          )}
        />

        <FinancialCard
          label="Market"
          value={formatMoney(
            row.marketValue
          )}
        />

        <FinancialCard
          label="ARV"
          value={formatMoney(
            row.arv
          )}
          muted={
            row.arv === null
          }
        />

        <FinancialCard
          label="MAO"
          value={formatMoney(
            row.mao
          )}
          muted={
            row.mao === null
          }
        />
      </div>

      {/* Analysis */}
      <div
        style={
          analysisCardStyle
        }
      >
        <div
          style={
            analysisHeaderStyle
          }
        >
          <span
            style={
              fieldLabelStyle
            }
          >
            PROPERTY ANALYSIS
          </span>

          <span
            style={
              evidenceLevelStyle(
                row.analysis
                  .evidenceLevel
              )
            }
          >
            {formatEvidenceLevel(
              row.analysis
                .evidenceLevel
            )}
          </span>
        </div>

        {row.analysis
          .reasons.length >
        0 ? (
          <div
            style={
              analysisReasonListStyle
            }
          >
            {row.analysis.reasons
              .slice(0, 2)
              .map(
                (
                  reason
                ) => (
                  <div
                    key={
                      reason
                    }
                    style={
                      analysisReasonStyle
                    }
                  >
                    <span>
                      •
                    </span>
                    <span>
                      {
                        reason
                      }
                    </span>
                  </div>
                )
              )}
          </div>
        ) : (
          <div
            style={
              insufficientDataStyle
            }
          >
            Not enough verified property
            information to calculate a
            meaningful lead strength.
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={
          mobileCardFooterStyle
        }
      >
        <button
          type="button"
          onClick={onDelete}
          style={
            mobileDeleteStyle
          }
        >
          Delete
        </button>

        <Link
          href={`/leads/${row.lead.id}`}
          style={
            workspaceButtonStyle
          }
        >
          Open Workspace
          <span>→</span>
        </Link>
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
  allVisibleSelected,
  savingIds,
  onToggleAll,
  onToggleLead,
  onStageChange,
  onDelete,
}: {
  rows: LeadViewRow[]
  selectedLeadIds: string[]
  allVisibleSelected: boolean
  savingIds: string[]
  onToggleAll: () => void
  onToggleLead: (
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
        desktopTableWrapperStyle
      }
    >
      <table
        className="crm-table"
        style={
          desktopTableStyle
        }
      >
        <thead>
          <tr>
            <th
              style={
                checkboxColumnStyle
              }
            >
              <input
                type="checkbox"
                checked={
                  allVisibleSelected
                }
                onChange={
                  onToggleAll
                }
                style={
                  checkboxStyle
                }
                aria-label="Select all visible leads"
              />
            </th>

            <th>Property</th>
            <th>Owner</th>
            <th>Contact</th>
            <th>Pipeline</th>
            <th>Asking</th>
            <th>ARV</th>
            <th>Analysis</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row) => {
              const saving =
                savingIds.includes(
                  row.lead.id
                )

              return (
                <tr
                  key={
                    row.lead.id
                  }
                  style={
                    tableRowStyle
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(
                        row.lead.id
                      )}
                      onChange={() =>
                        onToggleLead(
                          row.lead.id
                        )
                      }
                      style={
                        checkboxStyle
                      }
                    />
                  </td>

                  <td
                    style={
                      propertyCellStyle
                    }
                  >
                    <Link
                      href={`/leads/${row.lead.id}`}
                      style={
                        desktopPropertyLinkStyle
                      }
                    >
                      {row.address}
                    </Link>

                    <div
                      style={
                        desktopLocationStyle
                      }
                    >
                      {row.location}
                    </div>
                  </td>

                  <td>
                    <div
                      style={
                        desktopOwnerStyle
                      }
                    >
                      {row.owner}
                    </div>
                  </td>

                  <td>
                    <div
                      style={
                        desktopPhoneStyle
                      }
                    >
                      {row.phone ||
                        'No phone'}
                    </div>

                    <div
                      style={
                        desktopEmailStyle
                      }
                    >
                      {row.email ||
                        'No email'}
                    </div>
                  </td>

                  <td>
                    <select
                      value={
                        row.stage
                      }
                      disabled={
                        saving
                      }
                      onChange={(
                        event
                      ) =>
                        onStageChange(
                          row.lead
                            .id,
                          event
                            .target
                            .value
                        )
                      }
                      style={{
                        ...desktopStageSelectStyle,
                        color:
                          row.stageColor,
                        borderColor:
                          row.stageBorder,
                        background:
                          row.stageBackground,
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
                          >
                            {
                              option.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </td>

                  <td>
                    <MoneyValue
                      value={
                        row.askingPrice
                      }
                    />
                  </td>

                  <td>
                    <MoneyValue
                      value={
                        row.arv
                      }
                      muted={
                        row.arv ===
                        null
                      }
                    />
                  </td>

                  <td>
                    <div
                      style={
                        analysisDesktopStyle
                      }
                    >
                      {row.analysis
                        .strength !==
                      null ? (
                        <StrengthBadge
                          score={
                            row.analysis
                              .strength
                          }
                        />
                      ) : (
                        <span
                          style={
                            noDataBadgeStyle
                          }
                        >
                          Needs Data
                        </span>
                      )}

                      <span
                        style={
                          evidenceLevelStyle(
                            row.analysis
                              .evidenceLevel
                          )
                        }
                      >
                        {formatEvidenceLevel(
                          row.analysis
                            .evidenceLevel
                        )}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div
                      style={
                        desktopActionsStyle
                      }
                    >
                      <Link
                        href={`/leads/${row.lead.id}`}
                        style={
                          desktopWorkspaceButtonStyle
                        }
                      >
                        Workspace
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          onDelete(
                            row.lead
                              .id
                          )
                        }
                        style={
                          desktopDeleteButtonStyle
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
   SMALL COMPONENTS
========================================================= */

function StrengthBadge({
  score,
}: {
  score: number
}) {
  const tone =
    score >= 80
      ? {
          color: '#4ade80',
          background:
            'rgba(74,222,128,0.10)',
          border:
            'rgba(74,222,128,0.25)',
        }
      : score >= 60
        ? {
            color: '#e6be67',
            background:
              'rgba(214,166,75,0.10)',
            border:
              'rgba(214,166,75,0.25)',
          }
        : {
            color: '#f59e0b',
            background:
              'rgba(245,158,11,0.10)',
            border:
              'rgba(245,158,11,0.25)',
          }

  return (
    <span
      style={{
        ...strengthBadgeStyle,
        color: tone.color,
        background:
          tone.background,
        borderColor:
          tone.border,
      }}
    >
      {score}
    </span>
  )
}

function FinancialCard({
  label,
  value,
  muted = false,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div
      style={
        financialCardStyle
      }
    >
      <div
        style={
          fieldLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          ...financialValueStyle,
          color: muted
            ? 'rgba(255,255,255,0.32)'
            : '#ffffff',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function MoneyValue({
  value,
  muted = false,
}: {
  value: number | null
  muted?: boolean
}) {
  return (
    <span
      style={{
        ...tableMoneyStyle,
        color: muted
          ? 'rgba(255,255,255,0.32)'
          : '#ffffff',
      }}
    >
      {formatMoney(value)}
    </span>
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
          loadingDotStyle
        }
      />

      <div>
        <div
          style={
            loadingTitleStyle
          }
        >
          Loading leads
        </div>

        <div
          style={
            loadingSubtitleStyle
          }
        >
          Pulling the latest property records…
        </div>
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
    query.length > 0 ||
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
        {filtered ? '⌕' : '＋'}
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
          emptySubtitleStyle
        }
      >
        {filtered
          ? 'Try a different search or clear your filters.'
          : 'Import your first batch of leads to start building your pipeline.'}
      </div>

      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          style={
            emptyActionStyle
          }
        >
          Clear Filters
        </button>
      ) : (
        <Link
          href="/imports"
          style={
            emptyActionStyle
          }
        >
          Import Leads
        </Link>
      )}
    </div>
  )
}

function formatEvidenceLevel(
  level: EvidenceLevel
): string {
  switch (level) {
    case 'strong':
      return 'Strong evidence'

    case 'moderate':
      return 'Moderate evidence'

    case 'limited':
      return 'Limited evidence'

    case 'insufficient':
    default:
      return 'Insufficient data'
  }
}

function evidenceLevelStyle(
  level: EvidenceLevel
): CSSProperties {
  if (level === 'strong') {
    return {
      fontSize: 10,
      color: '#4ade80',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }
  }

  if (level === 'moderate') {
    return {
      fontSize: 10,
      color: '#e6be67',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }
  }

  if (level === 'limited') {
    return {
      fontSize: 10,
      color: '#f59e0b',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }
  }

  return {
    fontSize: 10,
    color: 'rgba(255,255,255,0.42)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }
}

/* =========================================================
   STYLES
========================================================= */

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  marginBottom: 18,
}

const searchAndImportStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
}

const searchWrapperStyle: CSSProperties = {
  position: 'relative',
  flex: 1,
  minWidth: 0,
}

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'rgba(255,255,255,0.38)',
  fontSize: 20,
  pointerEvents: 'none',
}

const searchInputStyle: CSSProperties = {
  width: '100%',
  minHeight: 46,
  paddingLeft: 42,
  paddingRight: 38,
  boxSizing: 'border-box',
}

const clearSearchStyle: CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 26,
  height: 26,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.55)',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
}

const importLinkStyle: CSSProperties = {
  textDecoration: 'none',
  flexShrink: 0,
}

const filterScrollStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 2,
}

const filterButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 13px',
  borderRadius: 999,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.025)',
  color:
    'rgba(255,255,255,0.62)',
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const activeFilterStyle: CSSProperties = {
  ...filterButtonStyle,
  border:
    '1px solid rgba(214,166,75,0.30)',
  background:
    'rgba(214,166,75,0.12)',
  color: '#ffffff',
}

const bulkBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  padding: '12px 14px',
  borderRadius: 14,
  border:
    '1px solid rgba(214,166,75,0.22)',
  background:
    'linear-gradient(180deg, rgba(30,24,14,0.90), rgba(12,10,7,0.96))',
}

const bulkSelectionTextStyle: CSSProperties = {
  fontSize: 13,
  color:
    'rgba(255,255,255,0.72)',
}

const bulkActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const bulkSelectStyle: CSSProperties = {
  minHeight: 34,
  borderRadius: 8,
  border:
    '1px solid rgba(255,255,255,0.12)',
  background: '#111111',
  color: '#ffffff',
  padding: '0 10px',
  fontSize: 12,
  fontWeight: 650,
  outline: 'none',
}

const notificationStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 13px',
  borderRadius: 12,
  marginBottom: 14,
  fontSize: 13,
  fontWeight: 600,
}

const errorNotificationStyle: CSSProperties = {
  background:
    'rgba(239,68,68,0.09)',
  border:
    '1px solid rgba(239,68,68,0.22)',
  color: '#fca5a5',
}

const successNotificationStyle: CSSProperties = {
  background:
    'rgba(74,222,128,0.08)',
  border:
    '1px solid rgba(74,222,128,0.20)',
  color: '#86efac',
}

const notificationCloseStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 7,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.04)',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
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
  gap: 14,
}

const mobileLeadCardStyle: CSSProperties = {
  display: 'grid',
  gap: 15,
  padding: 16,
  borderRadius: 20,
  border:
    '1px solid rgba(255,255,255,0.075)',
  background:
    'linear-gradient(180deg, rgba(17,17,17,0.98), rgba(7,7,7,0.98))',
  boxShadow:
    '0 14px 35px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.025)',
}

const mobileCardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const mobileHeaderLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 11,
  minWidth: 0,
  flex: 1,
}

const propertyIdentityStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
  minWidth: 0,
}

const propertyAddressLinkStyle: CSSProperties = {
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: 19,
  lineHeight: 1.12,
  fontWeight: 800,
  letterSpacing: '-0.025em',
  wordBreak: 'break-word',
}

const propertyLocationStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.42)',
  fontSize: 11,
  lineHeight: 1.4,
  textTransform: 'uppercase',
  letterSpacing: '0.065em',
}

const strengthBadgeStyle: CSSProperties = {
  minWidth: 38,
  height: 32,
  padding: '0 8px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  border: '1px solid',
  fontSize: 13,
  fontWeight: 850,
  flexShrink: 0,
}

const noDataBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 30,
  padding: '0 9px',
  borderRadius: 9,
  border:
    '1px solid rgba(255,255,255,0.09)',
  background:
    'rgba(255,255,255,0.035)',
  color:
    'rgba(255,255,255,0.45)',
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
}

const stageCardStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
}

const stageLabelRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const fieldLabelStyle: CSSProperties = {
  fontSize: 9,
  lineHeight: 1.2,
  textTransform: 'uppercase',
  letterSpacing: '0.13em',
  color:
    'rgba(255,255,255,0.38)',
  fontWeight: 800,
}

const savingTextStyle: CSSProperties = {
  fontSize: 10,
  color:
    'rgba(255,255,255,0.40)',
}

const mobileStageSelectStyle: CSSProperties = {
  width: '100%',
  minHeight: 42,
  borderRadius: 11,
  border: '1px solid',
  padding: '0 11px',
  fontSize: 13,
  fontWeight: 750,
  outline: 'none',
  cursor: 'pointer',
}

const sellerBlockStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingTop: 2,
}

const ownerNameStyle: CSSProperties = {
  marginTop: 5,
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.25,
}

const contactActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 7,
  flexShrink: 0,
}

const contactActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 8,
  border:
    '1px solid rgba(255,255,255,0.09)',
  background:
    'rgba(255,255,255,0.035)',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 750,
}

const financialGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 8,
}

const financialCardStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: '11px 12px',
  borderRadius: 12,
  border:
    '1px solid rgba(255,255,255,0.055)',
  background:
    'rgba(255,255,255,0.025)',
}

const financialValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.1,
}

const analysisCardStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
  padding: '12px 13px',
  borderRadius: 13,
  border:
    '1px solid rgba(255,255,255,0.055)',
  background:
    'rgba(255,255,255,0.018)',
}

const analysisHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}

const analysisReasonListStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
}

const analysisReasonStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '10px 1fr',
  gap: 5,
  color:
    'rgba(255,255,255,0.62)',
  fontSize: 11,
  lineHeight: 1.4,
}

const insufficientDataStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.40)',
  fontSize: 11,
  lineHeight: 1.45,
}

const mobileCardFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  paddingTop: 3,
  borderTop:
    '1px solid rgba(255,255,255,0.055)',
}

const mobileDeleteStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#ef4444',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  padding: '8px 0',
}

const workspaceButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  minHeight: 36,
  padding: '0 13px',
  borderRadius: 10,
  border:
    '1px solid rgba(214,166,75,0.28)',
  background:
    'rgba(214,166,75,0.09)',
  color: '#e6be67',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 800,
}

/* =========================================================
   DESKTOP TABLE STYLES
========================================================= */

const desktopTableWrapperStyle: CSSProperties = {
  borderRadius: 16,
  border:
    '1px solid rgba(255,255,255,0.06)',
  overflowX: 'auto',
  overflowY: 'hidden',
  background:
    'rgba(0,0,0,0.18)',
}

const desktopTableStyle: CSSProperties = {
  minWidth: 1050,
}

const checkboxColumnStyle: CSSProperties = {
  width: 42,
}

const tableRowStyle: CSSProperties = {
  transition:
    'background 120ms ease',
}

const propertyCellStyle: CSSProperties = {
  minWidth: 220,
}

const desktopPropertyLinkStyle: CSSProperties = {
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.25,
}

const desktopLocationStyle: CSSProperties = {
  marginTop: 4,
  color:
    'rgba(255,255,255,0.42)',
  fontSize: 10,
  lineHeight: 1.3,
}

const desktopOwnerStyle: CSSProperties = {
  maxWidth: 150,
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 650,
  lineHeight: 1.3,
}

const desktopPhoneStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.78)',
  fontSize: 11,
  lineHeight: 1.4,
}

const desktopEmailStyle: CSSProperties = {
  marginTop: 2,
  color:
    'rgba(255,255,255,0.38)',
  fontSize: 10,
  lineHeight: 1.4,
  maxWidth: 180,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const desktopStageSelectStyle: CSSProperties = {
  minHeight: 31,
  minWidth: 130,
  borderRadius: 8,
  border: '1px solid',
  padding: '0 8px',
  fontSize: 10,
  fontWeight: 750,
  outline: 'none',
  cursor: 'pointer',
}

const tableMoneyStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 750,
  whiteSpace: 'nowrap',
}

const analysisDesktopStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
  justifyItems: 'start',
}

const desktopActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
}

const desktopWorkspaceButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 8,
  border:
    '1px solid rgba(214,166,75,0.25)',
  background:
    'rgba(214,166,75,0.08)',
  color: '#e6be67',
  textDecoration: 'none',
  fontSize: 10,
  fontWeight: 800,
}

const desktopDeleteButtonStyle: CSSProperties = {
  width: 29,
  height: 29,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  border:
    '1px solid rgba(239,68,68,0.18)',
  background:
    'rgba(239,68,68,0.06)',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
}

/* =========================================================
   STATES
========================================================= */

const loadingStateStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  minHeight: 220,
  color:
    'rgba(255,255,255,0.60)',
}

const loadingDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: '#d6a64b',
  boxShadow:
    '0 0 14px rgba(214,166,75,0.45)',
}

const loadingTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 750,
}

const loadingSubtitleStyle: CSSProperties = {
  marginTop: 3,
  color:
    'rgba(255,255,255,0.38)',
  fontSize: 11,
}

const emptyStateStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  textAlign: 'center',
  minHeight: 300,
  alignContent: 'center',
  padding: 24,
}

const emptyIconStyle: CSSProperties = {
  width: 48,
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border:
    '1px solid rgba(214,166,75,0.18)',
  background:
    'rgba(214,166,75,0.07)',
  color: '#d6a64b',
  fontSize: 24,
}

const emptyTitleStyle: CSSProperties = {
  marginTop: 14,
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 800,
}

const emptySubtitleStyle: CSSProperties = {
  maxWidth: 400,
  marginTop: 6,
  color:
    'rgba(255,255,255,0.42)',
  fontSize: 12,
  lineHeight: 1.5,
}

const emptyActionStyle: CSSProperties = {
  marginTop: 16,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 36,
  padding: '0 13px',
  borderRadius: 9,
  border:
    '1px solid rgba(214,166,75,0.25)',
  background:
    'rgba(214,166,75,0.08)',
  color: '#e6be67',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 800,
  cursor: 'pointer',
}