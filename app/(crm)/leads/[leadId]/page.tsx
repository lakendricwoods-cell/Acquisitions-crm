'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'

import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
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

  county?: string | null
  property_county?: string | null

  apn?: string | null
  parcel_id?: string | null

  status?: string | null
  stage?: string | null
  lead_status?: string | null
  pipeline_stage?: string | null

  asking_price?: number | null
  listing_price?: number | null
  seller_price?: number | null
  purchase_price?: number | null

  market_value?: number | null
  estimated_value?: number | null

  arv?: number | null

  mao?: number | null
  max_allowable_offer?: number | null

  repairs?: number | null
  estimated_repairs?: number | null
  repair_estimate?: number | null

  assignment_fee?: number | null
  buy_percentage?: number | null
  buyer_percentage?: number | null

  beds?: number | null
  bedrooms?: number | null

  baths?: number | null
  bathrooms?: number | null

  sqft?: number | null
  square_feet?: number | null
  living_area?: number | null

  year_built?: number | null

  occupancy?: string | null
  owner_occupied?: boolean | null

  ownership_years?: number | null
  ownership_length?: number | null

  property_type?: string | null
  lead_type?: string | null
  source?: string | null

  last_sale_date?: string | null
  last_sold_date?: string | null

  mortgage_balance?: number | null
  estimated_equity?: number | null
  equity?: number | null

  default_amount?: number | null
  auction_date?: string | null
  lender?: string | null

  mailing_address?: string | null

  notes?: string | null

  created_at?: string | null
  updated_at?: string | null
}

type Analysis = {
  strength: number | null
  motivation: number | null
  contactability: number | null
  marketability: number | null

  strengthLabel: string
  motivationLabel: string
  contactabilityLabel: string
  marketabilityLabel: string

  reasons: string[]
  warnings: string[]
}

type DealAnalysis = {
  arv: number | null
  repairs: number | null
  buyPercentage: number | null
  assignmentFee: number | null
  baseMaximum: number | null
  mao: number | null
  sellerPrice: number | null
  spread: number | null
}

/* =========================================================
   CONSTANTS
========================================================= */

const STAGE_OPTIONS = [
  { value: 'new_lead', label: 'New Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'appointment_set', label: 'Appointment Set' },
  { value: 'offer_sent', label: 'Offer Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
  { value: 'dead_lead', label: 'Dead / Archive' },
]

/* =========================================================
   HELPERS
========================================================= */

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function firstNumber(
  ...values: Array<number | null | undefined>
): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return null
}

function formatMoney(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return '—'
  }

  return `$${Math.round(value).toLocaleString()}`
}

function formatNumber(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return '—'
  }

  return Math.round(value).toLocaleString()
}

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return '—'
  }

  return `${Math.round(value)}%`
}

function titleCase(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function getAddress(lead: LeadRow) {
  return (
    firstNonEmpty(
      lead.property_address_1,
      lead.property_address,
    ) || 'Property address unavailable'
  )
}

function getCity(lead: LeadRow) {
  return firstNonEmpty(
    lead.city,
    lead.property_city,
  )
}

function getState(lead: LeadRow) {
  return firstNonEmpty(
    lead.state,
    lead.property_state,
  )
}

function getZip(lead: LeadRow) {
  return firstNonEmpty(
    lead.zip,
    lead.property_zip,
  )
}

function getLocation(lead: LeadRow) {
  return [
    getCity(lead),
    getState(lead),
    getZip(lead),
  ]
    .filter(Boolean)
    .join(', ')
}

function getPhone(lead: LeadRow) {
  return firstNonEmpty(
    lead.owner_phone_primary,
    lead.phone1,
  )
}

function getEmail(lead: LeadRow) {
  return firstNonEmpty(
    lead.owner_email,
    lead.email1,
  )
}

function getSellerPrice(lead: LeadRow) {
  return firstNumber(
    lead.seller_price,
    lead.asking_price,
    lead.listing_price,
    lead.purchase_price,
  )
}

function getARV(lead: LeadRow) {
  return firstNumber(
    lead.arv,
  )
}

function getRepairs(lead: LeadRow) {
  return firstNumber(
    lead.repairs,
    lead.estimated_repairs,
    lead.repair_estimate,
  )
}

function getMAO(lead: LeadRow) {
  return firstNumber(
    lead.mao,
    lead.max_allowable_offer,
  )
}

function getBuyPercentage(lead: LeadRow) {
  return firstNumber(
    lead.buy_percentage,
    lead.buyer_percentage,
  )
}

function getAssignmentFee(lead: LeadRow) {
  return firstNumber(
    lead.assignment_fee,
  )
}

function getStage(lead: LeadRow) {
  return (
    firstNonEmpty(
      lead.status,
      lead.stage,
      lead.lead_status,
      lead.pipeline_stage,
    ) || 'new_lead'
  )
}

function getStageLabel(stage: string) {
  return (
    STAGE_OPTIONS.find((item) => item.value === stage)?.label ||
    titleCase(stage)
  )
}

function getStageColor(stage: string) {
  switch (stage) {
    case 'contacted':
      return '#f59e0b'

    case 'appointment_set':
      return '#38bdf8'

    case 'offer_sent':
      return '#eab308'

    case 'negotiation':
      return '#a78bfa'

    case 'under_contract':
      return '#4ade80'

    case 'closed':
      return '#22c55e'

    case 'dead_lead':
      return '#ef4444'

    default:
      return '#d6a64b'
  }
}

function scoreLabel(score: number | null) {
  if (score == null) return 'Not enough data'
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Moderate'
  if (score >= 30) return 'Needs Attention'

  return 'Weak'
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

/* =========================================================
   REAL DATA-BASED LEAD ANALYSIS
========================================================= */

function analyzeLead(lead: LeadRow): Analysis {
  /*
   IMPORTANT:
   This does NOT pretend to know things that are not in the lead.

   Every score comes from actual fields on the lead.

   Missing information reduces confidence instead of being
   converted into an arbitrary "good" score.
  */

  let contactPoints = 0
  let contactPossible = 0

  if (lead.owner_name) {
    contactPoints += 20
  }

  contactPossible += 20

  if (getPhone(lead)) {
    contactPoints += 50
  }

  contactPossible += 50

  if (getEmail(lead)) {
    contactPoints += 20
  }

  contactPossible += 20

  const contactability =
    contactPossible > 0
      ? clamp((contactPoints / contactPossible) * 100)
      : null

  /* -------------------------------------------------------
     MARKETABILITY
  ------------------------------------------------------- */

  let marketPoints = 0
  let marketPossible = 0

  if (getARV(lead) != null) {
    marketPoints += 30
  }

  marketPossible += 30

  if (getSellerPrice(lead) != null) {
    marketPoints += 20
  }

  marketPossible += 20

  if (
    getCity(lead) &&
    getState(lead)
  ) {
    marketPoints += 15
  }

  marketPossible += 15

  if (
    lead.beds != null ||
    lead.bedrooms != null
  ) {
    marketPoints += 10
  }

  marketPossible += 10

  if (
    lead.baths != null ||
    lead.bathrooms != null
  ) {
    marketPoints += 10
  }

  marketPossible += 10

  if (
    lead.sqft != null ||
    lead.square_feet != null ||
    lead.living_area != null
  ) {
    marketPoints += 10
  }

  marketPossible += 10

  if (lead.year_built != null) {
    marketPoints += 5
  }

  marketPossible += 5

  const marketability =
    marketPossible > 0
      ? clamp((marketPoints / marketPossible) * 100)
      : null

  /* -------------------------------------------------------
     MOTIVATION
  ------------------------------------------------------- */

  /*
   We only use observable property/lead signals.

   We do NOT say someone is motivated simply because
   they are a lead.
  */

  let motivationPoints = 0
  let motivationSignals = 0

  if (getSellerPrice(lead) != null) {
    motivationPoints += 15
  }

  motivationSignals += 15

  if (
    lead.owner_occupied === true ||
    lead.occupancy?.toLowerCase().includes('owner')
  ) {
    /*
     Owner occupancy is contextual information, not
     automatically a motivation signal.
     Therefore it receives no direct motivation points.
    */
  }

  if (lead.default_amount != null && lead.default_amount > 0) {
    motivationPoints += 30
  }

  motivationSignals += 30

  if (lead.auction_date) {
    motivationPoints += 30
  }

  motivationSignals += 30

  if (
    lead.lead_type &&
    /foreclosure|tax|lien|distress|pre.?foreclosure/i.test(
      lead.lead_type,
    )
  ) {
    motivationPoints += 25
  }

  motivationSignals += 25

  if (
    lead.source &&
    /foreclosure|tax|lien|distress/i.test(
      lead.source,
    )
  ) {
    motivationPoints += 20
  }

  motivationSignals += 20

  const motivation =
    motivationSignals > 0
      ? clamp((motivationPoints / motivationSignals) * 100)
      : null

  /* -------------------------------------------------------
     OVERALL STRENGTH
  ------------------------------------------------------- */

  const availableScores = [
    contactability,
    marketability,
    motivation,
  ].filter(
    (value): value is number => value != null,
  )

  const strength =
    availableScores.length > 0
      ? clamp(
          availableScores.reduce(
            (sum, value) => sum + value,
            0,
          ) / availableScores.length,
        )
      : null

  /* -------------------------------------------------------
     EXPLANATION
  ------------------------------------------------------- */

  const reasons: string[] = []
  const warnings: string[] = []

  if (getPhone(lead)) {
    reasons.push('A verified phone number is available.')
  } else {
    warnings.push('No phone number is currently available.')
  }

  if (getEmail(lead)) {
    reasons.push('An owner email is available.')
  } else {
    warnings.push('No owner email is currently available.')
  }

  if (getARV(lead) != null) {
    reasons.push('ARV data is available in the property record.')
  } else {
    warnings.push(
      'ARV has not been established from real comparable sales.',
    )
  }

  if (getMAO(lead) != null) {
    reasons.push('A stored MAO is available for the property.')
  } else {
    warnings.push(
      'MAO has not been established yet.',
    )
  }

  if (getSellerPrice(lead) != null) {
    reasons.push('A seller/listing price is available.')
  } else {
    warnings.push(
      'No seller/listing price is currently available.',
    )
  }

  if (lead.default_amount != null && lead.default_amount > 0) {
    reasons.push(
      'The property contains a recorded default amount.',
    )
  }

  if (lead.auction_date) {
    reasons.push(
      'An auction date is present in the property data.',
    )
  }

  if (
    lead.lead_type &&
    /foreclosure|tax|lien|distress|pre.?foreclosure/i.test(
      lead.lead_type,
    )
  ) {
    reasons.push(
      'The lead type contains a distress-related signal.',
    )
  }

  if (availableScores.length === 0) {
    warnings.push(
      'There is not enough property/lead data to calculate a reliable strength score.',
    )
  }

  return {
    strength,
    motivation,
    contactability,
    marketability,

    strengthLabel: scoreLabel(strength),
    motivationLabel: scoreLabel(motivation),
    contactabilityLabel: scoreLabel(contactability),
    marketabilityLabel: scoreLabel(marketability),

    reasons,
    warnings,
  }
}

/* =========================================================
   DEAL ANALYSIS
========================================================= */

function calculateDealAnalysis(
  lead: LeadRow,
): DealAnalysis {
  const arv = getARV(lead)
  const repairs = getRepairs(lead)
  const buyPercentage = getBuyPercentage(lead)
  const assignmentFee = getAssignmentFee(lead)
  const storedMAO = getMAO(lead)
  const sellerPrice = getSellerPrice(lead)

  /*
   We NEVER fabricate an ARV.

   Therefore:
   - If ARV exists, it can be used.
   - If ARV does not exist, MAO is not invented.
  */

  const baseMaximum =
    arv != null &&
    buyPercentage != null
      ? arv * (buyPercentage / 100)
      : null

  /*
   A calculated MAO is only possible if we have enough
   actual numbers.

   Formula:
   Base Maximum
   - Repairs
   - Assignment Fee
  */

  const calculatedMAO =
    baseMaximum != null
      ? baseMaximum -
        (repairs ?? 0) -
        (assignmentFee ?? 0)
      : null

  /*
   Prefer an explicitly stored MAO.

   Otherwise use the calculated MAO only when the
   required inputs actually exist.
  */

  const mao =
    storedMAO ??
    calculatedMAO

  const spread =
    mao != null &&
    sellerPrice != null
      ? mao - sellerPrice
      : null

  return {
    arv,
    repairs,
    buyPercentage,
    assignmentFee,
    baseMaximum,
    mao,
    sellerPrice,
    spread,
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function LeadWorkspacePage() {
  const params = useParams<{ leadId: string }>()
  const router = useRouter()

  const leadId = params?.leadId

  const [lead, setLead] = useState<LeadRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingStage, setSavingStage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showMoreProperty, setShowMoreProperty] =
    useState(false)

  const [showAnalysisReasons, setShowAnalysisReasons] =
    useState(false)

  const [notes, setNotes] = useState('')

  /* -------------------------------------------------------
     LOAD LEAD
  ------------------------------------------------------- */

  const loadLead = useCallback(async () => {
    if (!leadId) {
      setError('Lead ID is missing.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } =
      await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .maybeSingle()

    if (fetchError) {
      console.error(
        'Failed to load lead:',
        fetchError,
      )

      setError(fetchError.message)
      setLead(null)
      setLoading(false)
      return
    }

    if (!data) {
      setError('Lead not found.')
      setLead(null)
      setLoading(false)
      return
    }

    const loadedLead = data as LeadRow

    setLead(loadedLead)
    setNotes(loadedLead.notes ?? '')
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    void loadLead()
  }, [loadLead])

  /* -------------------------------------------------------
     DERIVED DATA
  ------------------------------------------------------- */

  const analysis = useMemo(
    () => (lead ? analyzeLead(lead) : null),
    [lead],
  )

  const dealAnalysis = useMemo(
    () => (lead ? calculateDealAnalysis(lead) : null),
    [lead],
  )

  const stage = lead
    ? getStage(lead)
    : 'new_lead'

  const stageColor = getStageColor(stage)

  /* -------------------------------------------------------
     STATUS UPDATE
  ------------------------------------------------------- */

  async function handleStageChange(
    nextStage: string,
  ) {
    if (!lead || savingStage) return

    const previousStage = getStage(lead)

    if (nextStage === previousStage) {
      return
    }

    setSavingStage(true)
    setError(null)

    /*
     IMPORTANT:
     We intentionally update only `status`.

     The previous implementation attempted to write:
       status
       stage
       lead_status
       deal_status
       pipeline_stage

     If even ONE of those columns does not exist in
     Supabase, the entire update fails.

     `status` is the canonical field used here.
    */

    const { data, error: updateError } =
      await supabase
        .from('leads')
        .update({
          status: nextStage,
        })
        .eq('id', lead.id)
        .select('*')
        .maybeSingle()

    if (updateError) {
      console.error(
        'Failed to update lead status:',
        updateError,
      )

      setError(
        `Could not update status: ${updateError.message}`,
      )

      setSavingStage(false)
      return
    }

    /*
     * Use the returned database row when available.
     * This keeps the UI synchronized with Supabase.
     */
    if (data) {
      setLead(data as LeadRow)
    } else {
      setLead((current) =>
        current
          ? {
              ...current,
              status: nextStage,
            }
          : current,
      )
    }

    setSavingStage(false)
  }

  /* -------------------------------------------------------
     SAVE NOTES
  ------------------------------------------------------- */

  async function handleSaveNotes() {
    if (!lead) return

    const { error: saveError } =
      await supabase
        .from('leads')
        .update({
          notes,
        })
        .eq('id', lead.id)

    if (saveError) {
      setError(
        `Could not save notes: ${saveError.message}`,
      )
      return
    }

    setLead((current) =>
      current
        ? {
            ...current,
            notes,
          }
        : current,
    )
  }

  /* -------------------------------------------------------
     DELETE
  ------------------------------------------------------- */

  async function handleDeleteLead() {
    if (!lead) return

    const confirmed = window.confirm(
      'Delete this lead permanently?',
    )

    if (!confirmed) return

    const { error: deleteError } =
      await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)

    if (deleteError) {
      setError(
        `Could not delete lead: ${deleteError.message}`,
      )
      return
    }

    router.push('/leads')
  }

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <PageShell
        title="Lead Workspace"
        subtitle="Loading property intelligence..."
      >
        <div style={loadingStyle}>
          Loading lead...
        </div>
      </PageShell>
    )
  }

  /* -------------------------------------------------------
     ERROR
  ------------------------------------------------------- */

  if (!lead) {
    return (
      <PageShell
        title="Lead Workspace"
        subtitle="The requested lead could not be loaded."
      >
        <SectionCard
          title="Lead unavailable"
          subtitle={
            error ||
            'No lead was found for this ID.'
          }
        >
          <div style={errorPanelStyle}>
            <div style={errorTitleStyle}>
              Unable to load this workspace
            </div>

            <div style={errorTextStyle}>
              {error ||
                'The lead does not exist or could not be retrieved.'}
            </div>

            <div style={buttonRowStyle}>
              <Link href="/leads">
                <ActionButton compact tone="gold">
                  Back to Leads
                </ActionButton>
              </Link>
            </div>
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  const address = getAddress(lead)
  const location = getLocation(lead)

  const ownerName =
    lead.owner_name ||
    'Owner information unavailable'

  const phone = getPhone(lead)
  const email = getEmail(lead)

  const beds = firstNumber(
    lead.beds,
    lead.bedrooms,
  )

  const baths = firstNumber(
    lead.baths,
    lead.bathrooms,
  )

  const sqft = firstNumber(
    lead.sqft,
    lead.square_feet,
    lead.living_area,
  )

  const ownershipYears = firstNumber(
    lead.ownership_years,
    lead.ownership_length,
  )

  const county = firstNonEmpty(
    lead.county,
    lead.property_county,
  )

  const apn = firstNonEmpty(
    lead.apn,
    lead.parcel_id,
  )

  const propertyType = firstNonEmpty(
    lead.property_type,
    lead.lead_type,
  )

  const equity = firstNumber(
    lead.estimated_equity,
    lead.equity,
  )

  const mortgage = firstNumber(
    lead.mortgage_balance,
  )

  const ownerOccupied =
    lead.owner_occupied === true ||
    lead.occupancy
      ?.toLowerCase()
      .includes('owner')

  return (
    <PageShell
      title="Lead Workspace"
      subtitle={`${address}${location ? ` • ${location}` : ''}`}
      actions={
        <div style={headerActionsStyle}>
          <Link href="/leads">
            <ActionButton compact>
              ← Back to Leads
            </ActionButton>
          </Link>

          <button
            type="button"
            onClick={handleDeleteLead}
            style={dangerOutlineButtonStyle}
          >
            Delete
          </button>
        </div>
      }
    >
      {/* =====================================================
          ERROR BANNER
      ===================================================== */}

      {error ? (
        <div style={errorBannerStyle}>
          <div>
            <strong>Something needs attention.</strong>
            <div style={errorBannerTextStyle}>
              {error}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            style={dismissButtonStyle}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* =====================================================
          PROPERTY HEADER
      ===================================================== */}

      <div style={heroCardStyle}>
        <div style={heroMainStyle}>
          <div style={heroEyebrowStyle}>
            PROPERTY WORKSPACE
          </div>

          <h1 style={heroAddressStyle}>
            {address}
          </h1>

          <div style={heroLocationStyle}>
            {location ||
              'Property location unavailable'}
            {county ? ` • ${county} County` : ''}
          </div>

          <div style={heroMetaRowStyle}>
            {propertyType ? (
              <span style={propertyBadgeStyle}>
                {titleCase(propertyType)}
              </span>
            ) : null}

            {lead.source ? (
              <span style={mutedBadgeStyle}>
                Source: {titleCase(lead.source)}
              </span>
            ) : null}
          </div>
        </div>

        <div style={heroControlsStyle}>
          <div style={stageLabelStyle}>
            STAGE
          </div>

          <select
            value={stage}
            disabled={savingStage}
            onChange={(event) =>
              void handleStageChange(
                event.target.value,
              )
            }
            style={{
              ...stageSelectStyle,
              color: stageColor,
              borderColor: `${stageColor}66`,
            }}
          >
            {STAGE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                style={optionStyle}
              >
                {option.label}
              </option>
            ))}
          </select>

          {savingStage ? (
            <div style={savingTextStyle}>
              Saving...
            </div>
          ) : null}
        </div>
      </div>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <div style={quickActionsStyle}>
        <a
          href={phone ? `tel:${phone}` : undefined}
          onClick={(event) => {
            if (!phone) event.preventDefault()
          }}
          style={{
            ...quickActionButtonStyle,
            opacity: phone ? 1 : 0.45,
          }}
        >
          ☎ Call Seller
        </a>

        <a
          href={phone ? `sms:${phone}` : undefined}
          onClick={(event) => {
            if (!phone) event.preventDefault()
          }}
          style={{
            ...quickActionButtonStyle,
            opacity: phone ? 1 : 0.45,
          }}
        >
          💬 Text
        </a>

        <a
          href={email ? `mailto:${email}` : undefined}
          onClick={(event) => {
            if (!email) event.preventDefault()
          }}
          style={{
            ...quickActionButtonStyle,
            opacity: email ? 1 : 0.45,
          }}
        >
          ✉ Email
        </a>
      </div>

      {/* =====================================================
          INTELLIGENCE STRIP
      ===================================================== */}

      <div style={metricsGridStyle}>
        <MetricCard
          label="Strength"
          value={
            analysis?.strength != null
              ? String(analysis.strength)
              : '—'
          }
          detail={
            analysis?.strengthLabel ||
            'Not enough data'
          }
          tone="gold"
        />

        <MetricCard
          label="Motivation"
          value={
            analysis?.motivation != null
              ? String(analysis.motivation)
              : '—'
          }
          detail={
            analysis?.motivationLabel ||
            'Not enough data'
          }
          tone="green"
        />

        <MetricCard
          label="Contactability"
          value={
            analysis?.contactability != null
              ? String(
                  analysis.contactability,
                )
              : '—'
          }
          detail={
            analysis?.contactabilityLabel ||
            'Not enough data'
          }
          tone="blue"
        />

        <MetricCard
          label="Marketability"
          value={
            analysis?.marketability != null
              ? String(
                  analysis.marketability,
                )
              : '—'
          }
          detail={
            analysis?.marketabilityLabel ||
            'Not enough data'
          }
          tone="purple"
        />
      </div>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div style={mainGridStyle}>
        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <div style={columnStyle}>
          {/* PROPERTY SNAPSHOT */}

          <SectionCard
            title="Property Snapshot"
            subtitle="Only information currently available in the lead record."
          >
            <div style={snapshotGridStyle}>
              <SnapshotItem
                label="ARV"
                value={formatMoney(
                  getARV(lead),
                )}
                tone="gold"
              />

              <SnapshotItem
                label="Estimated Equity"
                value={formatMoney(equity)}
                tone="green"
              />

              <SnapshotItem
                label="Mortgage Balance"
                value={formatMoney(mortgage)}
                tone="blue"
              />

              <SnapshotItem
                label="Seller Price"
                value={formatMoney(
                  getSellerPrice(lead),
                )}
                tone="gold"
              />
            </div>

            <div style={smallFactsGridStyle}>
              <SmallFact
                label="Beds"
                value={formatNumber(beds)}
              />

              <SmallFact
                label="Baths"
                value={formatNumber(baths)}
              />

              <SmallFact
                label="Sq Ft"
                value={formatNumber(sqft)}
              />

              <SmallFact
                label="Year Built"
                value={formatNumber(
                  lead.year_built,
                )}
              />

              <SmallFact
                label="Ownership"
                value={
                  ownershipYears != null
                    ? `${ownershipYears} yrs`
                    : '—'
                }
              />

              <SmallFact
                label="Occupancy"
                value={
                  ownerOccupied
                    ? 'Owner Occupied'
                    : lead.occupancy || '—'
                }
              />
            </div>
          </SectionCard>

          {/* SELLER */}

          <SectionCard
            title="Seller"
            subtitle="Owner and contact information."
          >
            <div style={sellerHeaderStyle}>
              <div style={avatarStyle}>
                {ownerName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={sellerNameStyle}>
                  {ownerName}
                </div>

                {ownerOccupied ? (
                  <span style={ownerBadgeStyle}>
                    Owner Occupied
                  </span>
                ) : null}
              </div>
            </div>

            <div style={contactGridStyle}>
              <ContactItem
                label="Phone"
                value={phone || 'Not available'}
              />

              <ContactItem
                label="Email"
                value={email || 'Not available'}
              />

              <ContactItem
                label="Mailing Address"
                value={
                  lead.mailing_address ||
                  'Not available'
                }
              />

              <ContactItem
                label="Ownership"
                value={
                  ownershipYears != null
                    ? `${ownershipYears} years`
                    : 'Not available'
                }
              />
            </div>

            <div style={buttonRowStyle}>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  style={primaryActionStyle}
                >
                  Call Seller
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  style={disabledActionStyle}
                >
                  Find Contact
                </button>
              )}

              {phone ? (
                <a
                  href={`sms:${phone}`}
                  style={secondaryActionStyle}
                >
                  Text
                </a>
              ) : null}

              {email ? (
                <a
                  href={`mailto:${email}`}
                  style={secondaryActionStyle}
                >
                  Email
                </a>
              ) : null}
            </div>
          </SectionCard>

          {/* NEXT ACTION */}

          <SectionCard
            title="Next Action"
            subtitle="The next useful action for this lead."
          >
            <div style={nextActionCardStyle}>
              <div style={nextActionIconStyle}>
                ☎
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={nextActionTitleStyle}>
                  {phone
                    ? 'Contact Seller'
                    : 'Find Seller Contact'}
                </div>

                <div style={nextActionTextStyle}>
                  {phone
                    ? 'A phone number is available. Reach out and log the result.'
                    : 'No phone number is currently available for this owner.'}
                </div>
              </div>
            </div>

            <div style={buttonRowStyle}>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  style={primaryActionStyle}
                >
                  ☎ Call Seller
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  style={disabledActionStyle}
                >
                  No Phone Available
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  void handleStageChange(
                    'contacted',
                  )
                }
                disabled={savingStage}
                style={secondaryActionStyle}
              >
                ✓ Mark Contacted
              </button>
            </div>
          </SectionCard>

          {/* PROPERTY DETAILS */}

          <SectionCard
            title="Property Details"
            subtitle="Expanded property information from Supabase."
          >
            <div style={propertyDetailsGridStyle}>
              <DetailTile
                label="Property Type"
                value={
                  propertyType
                    ? titleCase(propertyType)
                    : '—'
                }
              />

              <DetailTile
                label="County"
                value={county || '—'}
              />

              <DetailTile
                label="APN"
                value={apn || '—'}
              />

              <DetailTile
                label="Beds"
                value={formatNumber(beds)}
              />

              <DetailTile
                label="Baths"
                value={formatNumber(baths)}
              />

              <DetailTile
                label="Sq Ft"
                value={formatNumber(sqft)}
              />

              <DetailTile
                label="Year Built"
                value={formatNumber(
                  lead.year_built,
                )}
              />

              <DetailTile
                label="Occupancy"
                value={
                  ownerOccupied
                    ? 'Owner Occupied'
                    : lead.occupancy || '—'
                }
              />

              {showMoreProperty ? (
                <>
                  <DetailTile
                    label="Default Amount"
                    value={formatMoney(
                      lead.default_amount,
                    )}
                  />

                  <DetailTile
                    label="Auction Date"
                    value={
                      lead.auction_date || '—'
                    }
                  />

                  <DetailTile
                    label="Lender"
                    value={
                      lead.lender || '—'
                    }
                  />

                  <DetailTile
                    label="Last Sale"
                    value={
                      lead.last_sale_date ||
                      lead.last_sold_date ||
                      '—'
                    }
                  />

                  <DetailTile
                    label="Ownership Length"
                    value={
                      ownershipYears != null
                        ? `${ownershipYears} years`
                        : '—'
                    }
                  />

                  <DetailTile
                    label="Source"
                    value={
                      lead.source
                        ? titleCase(
                            lead.source,
                          )
                        : '—'
                    }
                  />
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() =>
                setShowMoreProperty(
                  (value) => !value,
                )
              }
              style={expandButtonStyle}
            >
              {showMoreProperty
                ? 'Show Less ↑'
                : 'View More Property Information ↓'}
            </button>
          </SectionCard>

          {/* LEAD INTELLIGENCE */}

          <SectionCard
            title="Lead Intelligence"
            subtitle="Calculated from information actually present on this lead."
          >
            <div style={intelligenceListStyle}>
              <IntelligenceRow
                label="Overall Strength"
                score={analysis?.strength ?? null}
                description={
                  analysis?.strengthLabel ||
                  'Not enough data'
                }
              />

              <IntelligenceRow
                label="Motivation"
                score={
                  analysis?.motivation ?? null
                }
                description={
                  analysis?.motivationLabel ||
                  'Not enough data'
                }
              />

              <IntelligenceRow
                label="Contactability"
                score={
                  analysis?.contactability ??
                  null
                }
                description={
                  analysis?.contactabilityLabel ||
                  'Not enough data'
                }
              />

              <IntelligenceRow
                label="Marketability"
                score={
                  analysis?.marketability ??
                  null
                }
                description={
                  analysis?.marketabilityLabel ||
                  'Not enough data'
                }
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowAnalysisReasons(
                  (value) => !value,
                )
              }
              style={expandButtonStyle}
            >
              {showAnalysisReasons
                ? 'Hide Analysis ↑'
                : 'Why this score? ↓'}
            </button>

            {showAnalysisReasons &&
            analysis ? (
              <div style={analysisExplanationStyle}>
                {analysis.reasons.length > 0 ? (
                  <div>
                    <div
                      style={
                        explanationHeadingStyle
                      }
                    >
                      Supporting signals
                    </div>

                    <ul
                      style={
                        explanationListStyle
                      }
                    >
                      {analysis.reasons.map(
                        (reason) => (
                          <li key={reason}>
                            {reason}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : null}

                {analysis.warnings.length > 0 ? (
                  <div>
                    <div
                      style={{
                        ...explanationHeadingStyle,
                        color: '#fbbf24',
                      }}
                    >
                      Missing / incomplete data
                    </div>

                    <ul
                      style={
                        explanationListStyle
                      }
                    >
                      {analysis.warnings.map(
                        (warning) => (
                          <li key={warning}>
                            {warning}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </SectionCard>
        </div>

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div style={columnStyle}>
          {/* DEAL ANALYSIS */}

          <SectionCard
            title="Deal Analysis"
            subtitle="No valuation is invented when the required data is missing."
          >
            <div style={dealListStyle}>
              <DealRow
                label="ARV"
                value={formatMoney(
                  dealAnalysis?.arv,
                )}
              />

              <DealRow
                label="Repairs"
                value={formatMoney(
                  dealAnalysis?.repairs,
                )}
              />

              <DealRow
                label="Buy %"
                value={formatPercent(
                  dealAnalysis?.buyPercentage,
                )}
              />

              <div style={dividerStyle} />

              <DealRow
                label="Base Maximum"
                value={formatMoney(
                  dealAnalysis?.baseMaximum,
                )}
              />

              <DealRow
                label="Assignment Fee"
                value={formatMoney(
                  dealAnalysis?.assignmentFee,
                )}
              />

              <div style={dividerStyle} />

              <DealRow
                label="MAO"
                value={formatMoney(
                  dealAnalysis?.mao,
                )}
                strong
              />

              <DealRow
                label="Seller Price"
                value={formatMoney(
                  dealAnalysis?.sellerPrice,
                )}
              />

              <DealRow
                label="Difference"
                value={formatMoney(
                  dealAnalysis?.spread,
                )}
                strong
              />
            </div>

            <DealHealth
              mao={dealAnalysis?.mao ?? null}
              sellerPrice={
                dealAnalysis?.sellerPrice ??
                null
              }
            />

            {!dealAnalysis?.arv ? (
              <div style={dataMissingPanelStyle}>
                <div
                  style={dataMissingTitleStyle}
                >
                  ARV not established
                </div>

                <div
                  style={dataMissingTextStyle}
                >
                  No ARV is shown until actual comparable
                  sales are available. This workspace will
                  not populate a made-up valuation.
                </div>
              </div>
            ) : null}
          </SectionCard>

          {/* COMPS STATUS */}

          <SectionCard
            title="Comparable Sales"
            subtitle="Valuation should be based on real nearby sales."
          >
            <div style={compsPanelStyle}>
              <div style={compsIconStyle}>
                ◉
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={compsTitleStyle}>
                  Real comp analysis
                </div>

                <div style={compsTextStyle}>
                  The valuation should use closed comparable
                  sales within the configured radius and
                  date window. This workspace will not display
                  fabricated comps.
                </div>
              </div>
            </div>

            <div style={compRuleGridStyle}>
              <SmallFact
                label="Radius"
                value="1 mile"
              />

              <SmallFact
                label="Sale Window"
                value="6 months"
              />

              <SmallFact
                label="ARV"
                value={
                  dealAnalysis?.arv != null
                    ? formatMoney(
                        dealAnalysis.arv,
                      )
                    : 'Pending'
                }
              />

              <SmallFact
                label="Source"
                value={
                  dealAnalysis?.arv != null
                    ? 'Stored valuation'
                    : 'Not calculated'
                }
              />
            </div>
          </SectionCard>

          {/* NOTES */}

          <SectionCard
            title="Workspace Notes"
            subtitle="Private working notes for this lead."
          >
            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add notes, seller details, negotiation thoughts, repair observations, follow-ups..."
              style={notesStyle}
            />

            <div style={notesFooterStyle}>
              <span style={notesHintStyle}>
                Notes are stored on the lead.
              </span>

              <ActionButton
                compact
                tone="gold"
                onClick={handleSaveNotes}
              >
                Save Notes
              </ActionButton>
            </div>
          </SectionCard>

          {/* ACTIVITY / STATUS */}

          <SectionCard
            title="Lead Activity"
            subtitle="Current lifecycle position."
          >
            <div style={activityItemStyle}>
              <div
                style={{
                  ...activityDotStyle,
                  background:
                    stageColor,
                }}
              />

              <div style={{ minWidth: 0 }}>
                <div style={activityTitleStyle}>
                  {getStageLabel(stage)}
                </div>

                <div style={activityTextStyle}>
                  Current lead status in Supabase.
                </div>
              </div>
            </div>

            <div style={activityItemStyle}>
              <div
                style={{
                  ...activityDotStyle,
                  background: '#60a5fa',
                }}
              />

              <div style={{ minWidth: 0 }}>
                <div style={activityTitleStyle}>
                  Lead created
                </div>

                <div style={activityTextStyle}>
                  {lead.created_at
                    ? new Date(
                        lead.created_at,
                      ).toLocaleString()
                    : 'Creation date unavailable'}
                </div>
              </div>
            </div>

            {lead.updated_at ? (
              <div style={activityItemStyle}>
                <div
                  style={{
                    ...activityDotStyle,
                    background: '#a78bfa',
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <div
                    style={activityTitleStyle}
                  >
                    Last updated
                  </div>

                  <div
                    style={activityTextStyle}
                  >
                    {new Date(
                      lead.updated_at,
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : null}
          </SectionCard>

          {/* TOOLS */}

          <SectionCard
            title="Tools"
            subtitle="Open the tools when actual data needs to be calculated."
          >
            <div style={toolsGridStyle}>
              <ToolCard
                title="Comps Analyzer"
                description="Analyze real comparable sales and establish ARV."
                href={`/leads/${lead.id}`}
              />

              <ToolCard
                title="Repair Estimator"
                description="Build a property-specific renovation budget."
                href={`/leads/${lead.id}`}
              />

              <ToolCard
                title="Contract Generator"
                description="Prepare purchase agreement deal terms."
                href={`/leads/${lead.id}`}
              />

              <ToolCard
                title="Assignment"
                description="Structure assignment terms and fee."
                href={`/leads/${lead.id}`}
              />

              <ToolCard
                title="Closing Costs"
                description="Estimate transaction expenses."
                href={`/leads/${lead.id}`}
              />

              <ToolCard
                title="Seller Script"
                description="Build a call script from this lead."
                href={`/leads/${lead.id}`}
              />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div style={footerNoticeStyle}>
        <strong>Data integrity:</strong>{' '}
        ARV, MAO, comparable sales, and lead intelligence
        are only displayed when supported by available
        property data. Missing information remains missing
        instead of being replaced with fabricated values.
      </div>
    </PageShell>
  )
}

/* =========================================================
   COMPONENTS
========================================================= */

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'gold' | 'green' | 'blue' | 'purple'
}) {
  const colors = {
    gold: '#e0b84f',
    green: '#4ade80',
    blue: '#60a5fa',
    purple: '#a78bfa',
  }

  const color = colors[tone]

  return (
    <div
      style={{
        ...metricCardStyle,
        borderTopColor: `${color}66`,
      }}
    >
      <div style={metricLabelStyle}>
        {label}
      </div>

      <div
        style={{
          ...metricValueStyle,
          color,
        }}
      >
        {value}
      </div>

      <div style={metricDetailStyle}>
        {detail}
      </div>
    </div>
  )
}

function SnapshotItem({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'gold' | 'green' | 'blue'
}) {
  const color =
    tone === 'gold'
      ? '#e0b84f'
      : tone === 'green'
        ? '#4ade80'
        : '#60a5fa'

  return (
    <div style={snapshotItemStyle}>
      <div style={snapshotLabelStyle}>
        {label}
      </div>

      <div
        style={{
          ...snapshotValueStyle,
          color,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SmallFact({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={smallFactStyle}>
      <div style={smallFactLabelStyle}>
        {label}
      </div>

      <div style={smallFactValueStyle}>
        {value}
      </div>
    </div>
  )
}

function ContactItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={contactItemStyle}>
      <div style={contactLabelStyle}>
        {label}
      </div>

      <div style={contactValueStyle}>
        {value}
      </div>
    </div>
  )
}

function DetailTile({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={detailTileStyle}>
      <div style={detailTileLabelStyle}>
        {label}
      </div>

      <div style={detailTileValueStyle}>
        {value}
      </div>
    </div>
  )
}

function IntelligenceRow({
  label,
  score,
  description,
}: {
  label: string
  score: number | null
  description: string
}) {
  return (
    <div style={intelligenceRowStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={intelligenceLabelStyle}>
          {label}
        </div>

        <div
          style={
            intelligenceDescriptionStyle
          }
        >
          {description}
        </div>
      </div>

      <div style={intelligenceScoreStyle}>
        {score != null ? score : '—'}
      </div>
    </div>
  )
}

function DealRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div style={dealRowStyle}>
      <span
        style={
          strong
            ? dealStrongLabelStyle
            : dealLabelStyle
        }
      >
        {label}
      </span>

      <span
        style={
          strong
            ? dealStrongValueStyle
            : dealValueStyle
        }
      >
        {value}
      </span>
    </div>
  )
}

function DealHealth({
  mao,
  sellerPrice,
}: {
  mao: number | null
  sellerPrice: number | null
}) {
  if (mao == null || sellerPrice == null) {
    return (
      <div style={neutralHealthStyle}>
        <div style={healthTitleStyle}>
          DEAL HEALTH
        </div>

        <div style={healthMainNeutralStyle}>
          Insufficient data
        </div>

        <div style={healthTextStyle}>
          A seller price and MAO are both required to
          determine whether the deal is above or below
          the maximum allowable offer.
        </div>
      </div>
    )
  }

  const difference = sellerPrice - mao

  if (difference > 0) {
    return (
      <div style={dangerHealthStyle}>
        <div style={healthTitleStyle}>
          DEAL HEALTH
        </div>

        <div style={healthMainDangerStyle}>
          ABOVE MAO
        </div>

        <div style={healthTextStyle}>
          Seller price is{' '}
          <strong>
            {formatMoney(difference)}
          </strong>{' '}
          above the current MAO.
        </div>
      </div>
    )
  }

  return (
    <div style={positiveHealthStyle}>
      <div style={healthTitleStyle}>
        DEAL HEALTH
      </div>

      <div style={healthMainPositiveStyle}>
        AT / BELOW MAO
      </div>

      <div style={healthTextStyle}>
        Seller price is{' '}
        <strong>
          {formatMoney(
            Math.abs(difference),
          )}
        </strong>{' '}
        below the current MAO.
      </div>
    </div>
  )
}

function ToolCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      style={toolCardStyle}
    >
      <div style={toolIconStyle}>
        ◇
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={toolTitleStyle}>
          {title}
        </div>

        <div style={toolDescriptionStyle}>
          {description}
        </div>

        <div style={toolLinkStyle}>
          Open Tool →
        </div>
      </div>
    </Link>
  )
}

/* =========================================================
   STYLES
========================================================= */

const loadingStyle: CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: 'rgba(255,255,255,0.55)',
}

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const dangerOutlineButtonStyle: CSSProperties = {
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid rgba(239,68,68,0.30)',
  background: 'rgba(239,68,68,0.08)',
  color: '#f87171',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const errorPanelStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 18,
  borderRadius: 16,
  border: '1px solid rgba(239,68,68,0.25)',
  background: 'rgba(239,68,68,0.06)',
}

const errorTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#ffffff',
}

const errorTextStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.58)',
}

const errorBannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '12px 14px',
  marginBottom: 14,
  borderRadius: 12,
  border: '1px solid rgba(239,68,68,0.25)',
  background: 'rgba(239,68,68,0.08)',
  color: '#ffffff',
}

const errorBannerTextStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 12,
  color: 'rgba(255,255,255,0.62)',
}

const dismissButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#fca5a5',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const heroCardStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 24,
  padding: 24,
  marginBottom: 12,
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.07)',
  background:
    'linear-gradient(135deg, rgba(18,18,18,0.98), rgba(8,8,8,0.98))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 50px rgba(0,0,0,0.18)',
  flexWrap: 'wrap',
}

const heroMainStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
}

const heroEyebrowStyle: CSSProperties = {
  marginBottom: 7,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.14em',
  color: '#d6a64b',
}

const heroAddressStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(24px, 4vw, 38px)',
  lineHeight: 1.05,
  fontWeight: 850,
  letterSpacing: '-0.035em',
  color: '#ffffff',
  wordBreak: 'break-word',
}

const heroLocationStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: 'rgba(255,255,255,0.50)',
}

const heroMetaRowStyle: CSSProperties = {
  display: 'flex',
  gap: 7,
  flexWrap: 'wrap',
  marginTop: 13,
}

const propertyBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 27,
  padding: '0 9px',
  borderRadius: 999,
  border: '1px solid rgba(214,166,75,0.25)',
  background: 'rgba(214,166,75,0.08)',
  color: '#e7c46f',
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const mutedBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 27,
  padding: '0 9px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.07)',
  background: 'rgba(255,255,255,0.025)',
  color: 'rgba(255,255,255,0.48)',
  fontSize: 10,
  fontWeight: 700,
}

const heroControlsStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
  minWidth: 170,
}

const stageLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.13em',
  color: 'rgba(255,255,255,0.40)',
}

const stageSelectStyle: CSSProperties = {
  minHeight: 42,
  padding: '0 12px',
  borderRadius: 10,
  background: 'rgba(0,0,0,0.72)',
  border: '1px solid rgba(255,255,255,0.10)',
  fontSize: 13,
  fontWeight: 800,
  outline: 'none',
  cursor: 'pointer',
}

const optionStyle: CSSProperties = {
  background: '#111111',
  color: '#ffffff',
}

const savingTextStyle: CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.42)',
}

const quickActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 12,
  flexWrap: 'wrap',
}

const quickActionButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 38,
  padding: '0 14px',
  borderRadius: 9,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.035)',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 750,
}

const metricsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(4, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 14,
}

const metricCardStyle: CSSProperties = {
  minWidth: 0,
  padding: 16,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  borderTop: '2px solid',
  background: 'rgba(8,8,8,0.92)',
}

const metricLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.13em',
  color: 'rgba(255,255,255,0.40)',
}

const metricValueStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 850,
}

const metricDetailStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  color: 'rgba(255,255,255,0.52)',
}

const mainGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1.35fr) minmax(320px, 0.85fr)',
  gap: 14,
  alignItems: 'start',
}

const columnStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  minWidth: 0,
}

const snapshotGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(4, minmax(0, 1fr))',
  gap: 8,
}

const snapshotItemStyle: CSSProperties = {
  padding: 13,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.018)',
}

const snapshotLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  color: 'rgba(255,255,255,0.38)',
}

const snapshotValueStyle: CSSProperties = {
  marginTop: 7,
  fontSize: 18,
  fontWeight: 850,
}

const smallFactsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap: 8,
  marginTop: 10,
}

const smallFactStyle: CSSProperties = {
  minWidth: 0,
  padding: '10px 11px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.018)',
}

const smallFactLabelStyle: CSSProperties = {
  fontSize: 8,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  color: 'rgba(255,255,255,0.34)',
}

const smallFactValueStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 700,
  color: '#ffffff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const sellerHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
}

const avatarStyle: CSSProperties = {
  width: 46,
  height: 46,
  flex: '0 0 46px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 14,
  border: '1px solid rgba(214,166,75,0.20)',
  background: 'rgba(214,166,75,0.10)',
  color: '#e0b84f',
  fontSize: 17,
  fontWeight: 850,
}

const sellerNameStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 850,
  color: '#ffffff',
}

const ownerBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  marginTop: 5,
  padding: '3px 7px',
  borderRadius: 999,
  background: 'rgba(34,197,94,0.09)',
  border: '1px solid rgba(34,197,94,0.20)',
  color: '#86efac',
  fontSize: 9,
  fontWeight: 800,
}

const contactGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 8,
}

const contactItemStyle: CSSProperties = {
  padding: 11,
  borderRadius: 11,
  background: 'rgba(255,255,255,0.018)',
}

const contactLabelStyle: CSSProperties = {
  fontSize: 8,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  color: 'rgba(255,255,255,0.34)',
}

const contactValueStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 12,
  lineHeight: 1.4,
  fontWeight: 650,
  color: '#ffffff',
  overflowWrap: 'anywhere',
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 13,
  flexWrap: 'wrap',
}

const primaryActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 36,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid rgba(214,166,75,0.28)',
  background: 'rgba(214,166,75,0.12)',
  color: '#e8c66e',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 800,
}

const secondaryActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 36,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'rgba(255,255,255,0.035)',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 750,
  cursor: 'pointer',
}

const disabledActionStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  color: 'rgba(255,255,255,0.28)',
  fontSize: 11,
  fontWeight: 750,
}

const nextActionCardStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: 14,
  borderRadius: 13,
  border: '1px solid rgba(214,166,75,0.16)',
  background:
    'linear-gradient(135deg, rgba(214,166,75,0.08), rgba(255,255,255,0.015))',
}

const nextActionIconStyle: CSSProperties = {
  width: 38,
  height: 38,
  flex: '0 0 38px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 12,
  background: 'rgba(214,166,75,0.13)',
  color: '#e0b84f',
  fontSize: 17,
}

const nextActionTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 850,
  color: '#ffffff',
}

const nextActionTextStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.50)',
}

const propertyDetailsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap: 8,
}

const detailTileStyle: CSSProperties = {
  minWidth: 0,
  padding: 11,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.05)',
  background: 'rgba(255,255,255,0.015)',
}

const detailTileLabelStyle: CSSProperties = {
  fontSize: 8,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  color: 'rgba(255,255,255,0.34)',
}

const detailTileValueStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 12,
  lineHeight: 1.35,
  fontWeight: 700,
  color: '#ffffff',
  overflowWrap: 'anywhere',
}

const expandButtonStyle: CSSProperties = {
  width: '100%',
  marginTop: 12,
  minHeight: 34,
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 9,
  background: 'rgba(255,255,255,0.02)',
  color: 'rgba(255,255,255,0.62)',
  fontSize: 10,
  fontWeight: 750,
  cursor: 'pointer',
}

const intelligenceListStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
}

const intelligenceRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '11px 12px',
  borderRadius: 11,
  background: 'rgba(255,255,255,0.018)',
}

const intelligenceLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 750,
  color: '#ffffff',
}

const intelligenceDescriptionStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 10,
  color: 'rgba(255,255,255,0.42)',
}

const intelligenceScoreStyle: CSSProperties = {
  minWidth: 40,
  textAlign: 'right',
  fontSize: 18,
  fontWeight: 850,
  color: '#e0b84f',
}

const analysisExplanationStyle: CSSProperties = {
  display: 'grid',
  gap: 13,
  marginTop: 12,
  padding: 13,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.018)',
  border: '1px solid rgba(255,255,255,0.05)',
}

const explanationHeadingStyle: CSSProperties = {
  marginBottom: 6,
  fontSize: 9,
  fontWeight: 850,
  textTransform: 'uppercase',
  letterSpacing: '0.11em',
  color: '#86efac',
}

const explanationListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 5,
  fontSize: 11,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.58)',
}

const dealListStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
}

const dealRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  minHeight: 28,
}

const dealLabelStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.50)',
}

const dealValueStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 750,
  color: '#ffffff',
  textAlign: 'right',
}

const dealStrongLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#ffffff',
}

const dealStrongValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 850,
  color: '#79e7a0',
  textAlign: 'right',
}

const dividerStyle: CSSProperties = {
  height: 1,
  background: 'rgba(255,255,255,0.06)',
  margin: '4px 0',
}

const dangerHealthStyle: CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 13,
  border: '1px solid rgba(239,68,68,0.22)',
  background: 'rgba(239,68,68,0.07)',
}

const positiveHealthStyle: CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 13,
  border: '1px solid rgba(34,197,94,0.20)',
  background: 'rgba(34,197,94,0.07)',
}

const neutralHealthStyle: CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 13,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
}

const healthTitleStyle: CSSProperties = {
  fontSize: 8,
  fontWeight: 850,
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.40)',
}

const healthMainDangerStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 19,
  fontWeight: 900,
  color: '#f87171',
}

const healthMainPositiveStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 19,
  fontWeight: 900,
  color: '#4ade80',
}

const healthMainNeutralStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 17,
  fontWeight: 850,
  color: '#ffffff',
}

const healthTextStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 11,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.52)',
}

const dataMissingPanelStyle: CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 11,
  border: '1px solid rgba(214,166,75,0.14)',
  background: 'rgba(214,166,75,0.045)',
}

const dataMissingTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 850,
  color: '#e0b84f',
}

const dataMissingTextStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 10,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.46)',
}

const compsPanelStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: 13,
  borderRadius: 12,
  border: '1px solid rgba(96,165,250,0.15)',
  background: 'rgba(96,165,250,0.045)',
}

const compsIconStyle: CSSProperties = {
  width: 38,
  height: 38,
  flex: '0 0 38px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 12,
  background: 'rgba(96,165,250,0.10)',
  color: '#60a5fa',
}

const compsTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 850,
  color: '#ffffff',
}

const compsTextStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 10,
  lineHeight: 1.55,
  color: 'rgba(255,255,255,0.48)',
}

const compRuleGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 8,
  marginTop: 10,
}

const notesStyle: CSSProperties = {
  width: '100%',
  minHeight: 150,
  resize: 'vertical',
  padding: 13,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.25)',
  color: '#ffffff',
  fontSize: 12,
  lineHeight: 1.55,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const notesFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  marginTop: 10,
  flexWrap: 'wrap',
}

const notesHintStyle: CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.35)',
}

const activityItemStyle: CSSProperties = {
  display: 'flex',
  gap: 11,
  padding: '11px 0',
  borderBottom:
    '1px solid rgba(255,255,255,0.05)',
}

const activityDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  flex: '0 0 8px',
  marginTop: 5,
  borderRadius: 999,
}

const activityTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 750,
  color: '#ffffff',
}

const activityTextStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 10,
  lineHeight: 1.45,
  color: 'rgba(255,255,255,0.42)',
}

const toolsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 8,
}

const toolCardStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  minWidth: 0,
  padding: 12,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.018)',
  textDecoration: 'none',
}

const toolIconStyle: CSSProperties = {
  width: 30,
  height: 30,
  flex: '0 0 30px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 9,
  background: 'rgba(214,166,75,0.09)',
  color: '#d6a64b',
  fontSize: 14,
}

const toolTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 850,
  color: '#ffffff',
}

const toolDescriptionStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 9,
  lineHeight: 1.45,
  color: 'rgba(255,255,255,0.42)',
}

const toolLinkStyle: CSSProperties = {
  marginTop: 7,
  fontSize: 9,
  fontWeight: 800,
  color: '#e0b84f',
}

const footerNoticeStyle: CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 11,
  border: '1px solid rgba(255,255,255,0.05)',
  background: 'rgba(255,255,255,0.015)',
  fontSize: 10,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.35)',
}

/* =========================================================
   RESPONSIVE CSS
========================================================= */

if (
  typeof document !== 'undefined' &&
  !document.getElementById(
    'lead-workspace-responsive-styles',
  )
) {
  const style =
    document.createElement('style')

  style.id =
    'lead-workspace-responsive-styles'

  style.textContent = `
    @media (max-width: 1000px) {
      .lead-workspace-main-grid {
        grid-template-columns: 1fr !important;
      }
    }

    @media (max-width: 760px) {
      .lead-workspace-metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      .lead-workspace-snapshot {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      .lead-workspace-details {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      .lead-workspace-facts {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 500px) {
      .lead-workspace-metrics {
        grid-template-columns: 1fr 1fr !important;
      }

      .lead-workspace-contact {
        grid-template-columns: 1fr !important;
      }

      .lead-workspace-tools {
        grid-template-columns: 1fr !important;
      }

      .lead-workspace-snapshot {
        grid-template-columns: 1fr 1fr !important;
      }
    }
  `

  document.head.appendChild(style)
}