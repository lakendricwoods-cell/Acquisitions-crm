'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import { supabase } from '@/lib/supabase'

/* =========================================================
   TYPES
   ========================================================= */

type LeadRecord = {
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

  status?: string | null
  stage?: string | null
  lead_status?: string | null
  deal_status?: string | null
  pipeline_stage?: string | null

  asking_price?: number | null
  listing_price?: number | null
  purchase_price?: number | null
  offer_price?: number | null

  market_value?: number | null
  estimated_value?: number | null
  arv?: number | null

  repairs?: number | null
  estimated_repairs?: number | null
  assignment_fee?: number | null
  buy_percent?: number | null
  mao?: number | null

  beds?: number | null
  bedrooms?: number | null
  baths?: number | null
  bathrooms?: number | null
  sqft?: number | null
  square_feet?: number | null
  living_area?: number | null
  year_built?: number | null

  property_type?: string | null
  occupancy?: string | null
  owner_occupied?: boolean | null

  apn?: string | null
  parcel_id?: string | null

  mailing_address?: string | null

  equity?: number | null
  estimated_equity?: number | null
  mortgage_balance?: number | null
  loan_balance?: number | null

  last_sale_date?: string | null
  ownership_length?: number | null

  lead_type?: string | null
  source?: string | null

  motivation?: number | null
  strength?: number | null
  contactability?: number | null
  marketability?: number | null

  notes?: string | null

  created_at?: string | null
  updated_at?: string | null

  [key: string]: unknown
}

type Analysis = {
  strength: number | null
  motivation: number | null
  contactability: number | null
  marketability: number | null
  explanation: string[]
}

type StatusOption = {
  value: string
  label: string
}

const STATUS_OPTIONS: StatusOption[] = [
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

function firstString(
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

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,%\s,]/g, '')
    const parsed = Number(cleaned)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function booleanFromUnknown(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim()

    if (['true', 'yes', 'y', '1'].includes(normalized)) return true
    if (['false', 'no', 'n', '0'].includes(normalized)) return false
  }

  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
  }

  return null
}

function formatMoney(value: number | null): string {
  if (value === null) return 'Not available'

  return `$${Math.round(value).toLocaleString()}`
}

function formatNumber(value: number | null): string {
  if (value === null) return 'Not available'

  return Math.round(value).toLocaleString()
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString()
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getAddress(lead: LeadRecord): string {
  return (
    firstString(
      lead.property_address_1,
      lead.property_address,
    ) || 'Property address unavailable'
  )
}

function getCity(lead: LeadRecord): string | null {
  return firstString(lead.city, lead.property_city)
}

function getState(lead: LeadRecord): string | null {
  return firstString(lead.state, lead.property_state)
}

function getZip(lead: LeadRecord): string | null {
  return firstString(lead.zip, lead.property_zip)
}

function getLocation(lead: LeadRecord): string {
  return [
    getCity(lead),
    getState(lead),
    getZip(lead),
  ]
    .filter(Boolean)
    .join(', ')
}

function getPhone(lead: LeadRecord): string | null {
  return firstString(
    lead.owner_phone_primary,
    lead.phone1,
  )
}

function getEmail(lead: LeadRecord): string | null {
  return firstString(
    lead.owner_email,
    lead.email1,
  )
}

function getOwnerOccupied(lead: LeadRecord): boolean | null {
  if (typeof lead.owner_occupied === 'boolean') {
    return lead.owner_occupied
  }

  return booleanFromUnknown(
    lead.occupancy,
  )
}

function getBeds(lead: LeadRecord): number | null {
  return firstNumber(
    lead.beds,
    lead.bedrooms,
  )
}

function getBaths(lead: LeadRecord): number | null {
  return firstNumber(
    lead.baths,
    lead.bathrooms,
  )
}

function getSqft(lead: LeadRecord): number | null {
  return firstNumber(
    lead.sqft,
    lead.square_feet,
    lead.living_area,
  )
}

function getSellerPrice(lead: LeadRecord): number | null {
  return firstNumber(
    lead.asking_price,
    lead.listing_price,
    lead.offer_price,
    lead.purchase_price,
  )
}

function getArv(lead: LeadRecord): number | null {
  return firstNumber(
    lead.arv,
  )
}

function getRepairs(lead: LeadRecord): number | null {
  return firstNumber(
    lead.repairs,
    lead.estimated_repairs,
  )
}

function getAssignmentFee(lead: LeadRecord): number | null {
  return firstNumber(
    lead.assignment_fee,
  )
}

function getBuyPercent(lead: LeadRecord): number | null {
  const value = firstNumber(lead.buy_percent)

  if (value === null) return null

  if (value > 1) {
    return value / 100
  }

  return value
}

function getExistingMao(lead: LeadRecord): number | null {
  return firstNumber(lead.mao)
}

function getMarketValue(lead: LeadRecord): number | null {
  return firstNumber(
    lead.market_value,
    lead.estimated_value,
  )
}

function getMortgageBalance(lead: LeadRecord): number | null {
  return firstNumber(
    lead.mortgage_balance,
    lead.loan_balance,
  )
}

/*
 * IMPORTANT:
 * This function does not fabricate a status.
 *
 * The status column is treated as the canonical pipeline value.
 * If status is empty, we display "New Lead" without writing
 * anything back to the database until the user explicitly chooses
 * a status.
 */
function getCurrentStatus(lead: LeadRecord): string {
  return firstString(
    lead.status,
  ) || 'new_lead'
}

function getStatusLabel(status: string): string {
  const found = STATUS_OPTIONS.find(
    (option) => option.value === status,
  )

  return found?.label || titleCase(status)
}

function getStatusTone(status: string): string {
  const normalized = status.toLowerCase()

  if (normalized.includes('contract')) return '#4ade80'
  if (normalized.includes('closed')) return '#22c55e'
  if (normalized.includes('contact')) return '#f59e0b'
  if (normalized.includes('appointment')) return '#38bdf8'
  if (normalized.includes('offer')) return '#fbbf24'
  if (normalized.includes('negotiation')) return '#a78bfa'
  if (normalized.includes('dead')) return '#ef4444'

  return '#d6a64b'
}

/* =========================================================
   REAL DATA ANALYSIS
   ========================================================= */

/*
 * These scores are intentionally conservative.
 *
 * They are NOT fake market scores.
 *
 * They only score information that actually exists on the lead.
 * Missing data lowers confidence rather than being replaced by
 * made-up values.
 */

function calculateContactability(lead: LeadRecord): number | null {
  const owner = firstString(lead.owner_name)
  const phone = getPhone(lead)
  const email = getEmail(lead)

  let available = 0
  let possible = 0

  if (owner !== null) {
    available += 1
  }

  possible += 1

  if (phone !== null) {
    available += 1
  }

  possible += 1

  if (email !== null) {
    available += 1
  }

  possible += 1

  if (possible === 0) return null

  return Math.round((available / possible) * 100)
}

function calculateMarketability(lead: LeadRecord): number | null {
  let points = 0
  let possible = 0

  const arv = getArv(lead)
  const marketValue = getMarketValue(lead)
  const address = getAddress(lead)
  const city = getCity(lead)
  const sqft = getSqft(lead)
  const beds = getBeds(lead)
  const baths = getBaths(lead)
  const yearBuilt = firstNumber(lead.year_built)

  if (arv !== null) {
    points += 1
  }

  possible += 1

  if (marketValue !== null) {
    points += 1
  }

  possible += 1

  if (address !== 'Property address unavailable') {
    points += 1
  }

  possible += 1

  if (city !== null) {
    points += 1
  }

  possible += 1

  if (sqft !== null) {
    points += 1
  }

  possible += 1

  if (beds !== null) {
    points += 1
  }

  possible += 1

  if (baths !== null) {
    points += 1
  }

  possible += 1

  if (yearBuilt !== null) {
    points += 1
  }

  possible += 1

  if (possible === 0) return null

  return Math.round((points / possible) * 100)
}

function calculateMotivation(
  lead: LeadRecord,
): number | null {
  /*
   * Motivation is only estimated when the lead contains
   * actual indicators that can support the conclusion.
   *
   * We do NOT assume that every lead is motivated.
   */

  const explicitMotivation = numberFromUnknown(
    lead.motivation,
  )

  if (
    explicitMotivation !== null &&
    explicitMotivation >= 0 &&
    explicitMotivation <= 100
  ) {
    return explicitMotivation
  }

  const indicators: boolean[] = []

  const sellerPrice = getSellerPrice(lead)
  const leadType = firstString(lead.lead_type)
  const source = firstString(lead.source)
  const occupancy = getOwnerOccupied(lead)
  const equity = firstNumber(
    lead.equity,
    lead.estimated_equity,
  )

  if (sellerPrice !== null) {
    indicators.push(true)
  }

  if (leadType !== null) {
    indicators.push(true)
  }

  if (source !== null) {
    indicators.push(true)
  }

  if (occupancy !== null) {
    indicators.push(true)
  }

  if (equity !== null) {
    indicators.push(true)
  }

  /*
   * If there are no actual indicators, don't pretend we know
   * the seller's motivation.
   */
  if (indicators.length === 0) {
    return null
  }

  /*
   * We have evidence that can be evaluated, but not enough
   * evidence to claim a high motivation level.
   */
  const evidenceRatio =
    indicators.filter(Boolean).length / 5

  return Math.min(
    60,
    Math.max(20, Math.round(evidenceRatio * 60)),
  )
}

function calculateStrength(
  contactability: number | null,
  marketability: number | null,
  motivation: number | null,
): number | null {
  const values: number[] = []

  if (contactability !== null) {
    values.push(contactability)
  }

  if (marketability !== null) {
    values.push(marketability)
  }

  if (motivation !== null) {
    values.push(motivation)
  }

  if (values.length === 0) {
    return null
  }

  return Math.round(
    values.reduce(
      (total, value) => total + value,
      0,
    ) / values.length,
  )
}

function buildAnalysis(
  lead: LeadRecord,
): Analysis {
  const contactability = calculateContactability(lead)
  const marketability = calculateMarketability(lead)
  const motivation = calculateMotivation(lead)

  const strength = calculateStrength(
    contactability,
    marketability,
    motivation,
  )

  const explanation: string[] = []

  const phone = getPhone(lead)
  const email = getEmail(lead)
  const arv = getArv(lead)
  const sellerPrice = getSellerPrice(lead)
  const repairs = getRepairs(lead)
  const sqft = getSqft(lead)

  if (phone !== null) {
    explanation.push(
      'A phone number is available for seller outreach.',
    )
  } else {
    explanation.push(
      'No phone number is currently available.',
    )
  }

  if (email !== null) {
    explanation.push(
      'An email address is available for outreach.',
    )
  } else {
    explanation.push(
      'No email address is currently available.',
    )
  }

  if (arv !== null) {
    explanation.push(
      `ARV data exists for this property: ${formatMoney(arv)}.`,
    )
  } else {
    explanation.push(
      'ARV has not been established from verified data.',
    )
  }

  if (sellerPrice !== null) {
    explanation.push(
      `A seller/listing price is available: ${formatMoney(sellerPrice)}.`,
    )
  } else {
    explanation.push(
      'No seller/listing price is currently available.',
    )
  }

  if (repairs !== null) {
    explanation.push(
      `A repair estimate is available: ${formatMoney(repairs)}.`,
    )
  } else {
    explanation.push(
      'No repair estimate is available yet.',
    )
  }

  if (sqft !== null) {
    explanation.push(
      `Property size is available: ${formatNumber(sqft)} sq ft.`,
    )
  }

  return {
    strength,
    motivation,
    contactability,
    marketability,
    explanation,
  }
}

/* =========================================================
   PAGE
   ========================================================= */

export default function LeadWorkspacePage() {
  const params = useParams<{ leadId: string }>()
  const router = useRouter()

  const leadId = Array.isArray(params?.leadId)
    ? params.leadId[0]
    : params?.leadId

  const [lead, setLead] = useState<LeadRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [showScoreReasoning, setShowScoreReasoning] =
    useState(false)

  const loadLead = useCallback(async () => {
    if (!leadId) {
      setErrorMessage('No lead ID was provided.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage(null)

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle()

    if (error) {
      console.error('Failed to load lead:', error)
      setErrorMessage(
        `Unable to load this lead: ${error.message}`,
      )
      setLead(null)
      setLoading(false)
      return
    }

    if (!data) {
      setErrorMessage('This lead could not be found.')
      setLead(null)
      setLoading(false)
      return
    }

    const nextLead = data as LeadRecord

    setLead(nextLead)
    setNotes(
      typeof nextLead.notes === 'string'
        ? nextLead.notes
        : '',
    )
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    void loadLead()
  }, [loadLead])

  const analysis = useMemo<Analysis | null>(() => {
    if (!lead) return null

    return buildAnalysis(lead)
  }, [lead])

  const address = lead
    ? getAddress(lead)
    : 'Lead Workspace'

  const location = lead
    ? getLocation(lead)
    : ''

  const currentStatus = lead
    ? getCurrentStatus(lead)
    : 'new_lead'

  const statusColor = getStatusTone(currentStatus)

  const sellerPrice = lead
    ? getSellerPrice(lead)
    : null

  const arv = lead
    ? getArv(lead)
    : null

  const repairs = lead
    ? getRepairs(lead)
    : null

  const assignmentFee = lead
    ? getAssignmentFee(lead)
    : null

  const buyPercent = lead
    ? getBuyPercent(lead)
    : null

  const existingMao = lead
    ? getExistingMao(lead)
    : null

  const calculatedMao = useMemo(() => {
    if (arv === null || buyPercent === null) {
      return null
    }

    const base = arv * buyPercent
    const repairAmount = repairs ?? 0
    const fee = assignmentFee ?? 0

    return Math.max(
      0,
      base - repairAmount - fee,
    )
  }, [
    arv,
    buyPercent,
    repairs,
    assignmentFee,
  ])

  /*
   * We only display MAO if it actually exists in the database
   * or if there is enough real data to calculate it.
   */
  const mao = existingMao ?? calculatedMao

  const spread = useMemo(() => {
    if (
      sellerPrice === null ||
      mao === null
    ) {
      return null
    }

    return mao - sellerPrice
  }, [sellerPrice, mao])

  async function handleStatusChange(
    nextStatus: string,
  ) {
    if (!lead) return
    if (nextStatus === currentStatus) return

    setSavingStatus(true)
    setStatusMessage(null)
    setErrorMessage(null)

    /*
     * IMPORTANT:
     *
     * We update ONLY `status`.
     *
     * This is the canonical field used by the Leads page.
     * Updating several guessed columns was one of the reasons
     * status changes could fail when those columns don't exist.
     *
     * Pipeline should read the same status field.
     */
    const { data, error } = await supabase
      .from('leads')
      .update({
        status: nextStatus,
      })
      .eq('id', lead.id)
      .select('*')
      .maybeSingle()

    if (error) {
      console.error(
        'Failed to update lead status:',
        error,
      )

      setErrorMessage(
        `Status could not be changed: ${error.message}`,
      )

      setSavingStatus(false)
      return
    }

    if (data) {
      setLead(data as LeadRecord)
    } else {
      setLead((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
            }
          : current,
      )
    }

    setStatusMessage(
      `Lead moved to ${getStatusLabel(nextStatus)}.`,
    )

    setSavingStatus(false)
  }

  async function handleSaveNotes() {
    if (!lead) return

    setSavingNotes(true)
    setErrorMessage(null)
    setStatusMessage(null)

    /*
     * Notes is an existing optional field in the workspace model.
     * If your current leads table doesn't contain it, Supabase will
     * return an explicit error instead of silently pretending it saved.
     */
    const { error } = await supabase
      .from('leads')
      .update({
        notes,
      })
      .eq('id', lead.id)

    if (error) {
      console.error(
        'Failed to save notes:',
        error,
      )

      setErrorMessage(
        `Notes could not be saved: ${error.message}`,
      )

      setSavingNotes(false)
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

    setStatusMessage('Notes saved.')
    setSavingNotes(false)
  }

  function callSeller() {
    const phone = lead ? getPhone(lead) : null

    if (!phone) {
      setStatusMessage(
        'No seller phone number is available for this lead.',
      )
      return
    }

    window.location.href = `tel:${phone}`
  }

  function textSeller() {
    const phone = lead ? getPhone(lead) : null

    if (!phone) {
      setStatusMessage(
        'No seller phone number is available for this lead.',
      )
      return
    }

    window.location.href = `sms:${phone}`
  }

  function emailSeller() {
    const email = lead ? getEmail(lead) : null

    if (!email) {
      setStatusMessage(
        'No seller email address is available for this lead.',
      )
      return
    }

    window.location.href = `mailto:${email}`
  }

  if (loading) {
    return (
      <PageShell
        title="Lead Workspace"
        subtitle="Loading property intelligence..."
      >
        <SectionCard
          title="Loading"
          subtitle="Retrieving the latest lead information from Supabase."
        >
          <div style={loadingStyle}>
            <div style={loadingDotStyle} />
            Loading lead...
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  if (!lead) {
    return (
      <PageShell
        title="Lead Workspace"
        subtitle="The requested lead could not be loaded."
      >
        <SectionCard title="Lead unavailable">
          <div style={errorBoxStyle}>
            {errorMessage || 'Lead not found.'}
          </div>

          <div style={{ marginTop: 16 }}>
            <ActionButton
              compact
              onClick={() => router.push('/leads')}
            >
              Back to Leads
            </ActionButton>
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  const ownerName =
    firstString(lead.owner_name) ||
    'Owner information unavailable'

  const phone = getPhone(lead)
  const email = getEmail(lead)

  const ownerOccupied = getOwnerOccupied(lead)

  const county = firstString(
    lead.county,
    lead.property_county,
  )

  const propertyType = firstString(
    lead.property_type,
  )

  const leadType = firstString(
    lead.lead_type,
  )

  const source = firstString(
    lead.source,
  )

  const beds = getBeds(lead)
  const baths = getBaths(lead)
  const sqft = getSqft(lead)
  const yearBuilt = firstNumber(lead.year_built)

  const equity = firstNumber(
    lead.equity,
    lead.estimated_equity,
  )

  const mortgageBalance =
    getMortgageBalance(lead)

  const lastSaleDate = lead.last_sale_date

  const ownershipLength =
    firstNumber(lead.ownership_length)

  const apn = firstString(
    lead.apn,
    lead.parcel_id,
  )

  const mailingAddress =
    firstString(lead.mailing_address)

  const hasVerifiedArv = arv !== null
  const hasVerifiedPrice = sellerPrice !== null
  const hasEnoughForMao =
    arv !== null &&
    buyPercent !== null

  return (
    <PageShell
      title="Lead Workspace"
      subtitle={`${address}${location ? ` • ${location}` : ''}`}
      actions={
        <>
          <Link href="/leads">
            <ActionButton compact>
              ← Back to Leads
            </ActionButton>
          </Link>

          <button
            type="button"
            onClick={() => void loadLead()}
            style={refreshButtonStyle}
            title="Refresh lead"
          >
            ↻ Refresh
          </button>
        </>
      }
    >
      {/* =====================================================
          GLOBAL ERROR / SUCCESS MESSAGES
          ===================================================== */}

      {errorMessage && (
        <div style={errorBoxStyle}>
          <strong>Something needs attention.</strong>
          <div style={{ marginTop: 4 }}>
            {errorMessage}
          </div>
        </div>
      )}

      {statusMessage && !errorMessage && (
        <div style={successBoxStyle}>
          {statusMessage}
        </div>
      )}

      {/* =====================================================
          PROPERTY HEADER
          ===================================================== */}

      <section style={heroStyle}>
        <div style={heroMainStyle}>
          <div style={eyebrowStyle}>
            LEAD WORKSPACE
          </div>

          <h1 style={heroTitleStyle}>
            {address}
          </h1>

          <div style={heroLocationStyle}>
            {location || 'Location unavailable'}
            {county ? ` • ${county} County` : ''}
          </div>

          <div style={heroMetaRowStyle}>
            {leadType && (
              <span style={goldBadgeStyle}>
                {titleCase(leadType)}
              </span>
            )}

            {source && (
              <span style={mutedBadgeStyle}>
                Source: {source}
              </span>
            )}

            {ownerOccupied !== null && (
              <span
                style={
                  ownerOccupied
                    ? greenBadgeStyle
                    : mutedBadgeStyle
                }
              >
                {ownerOccupied
                  ? 'Owner Occupied'
                  : 'Not Owner Occupied'}
              </span>
            )}
          </div>
        </div>

        <div style={heroControlsStyle}>
          <div style={stageLabelStyle}>
            CURRENT STAGE
          </div>

          <select
            value={currentStatus}
            disabled={savingStatus}
            onChange={(event) =>
              void handleStatusChange(
                event.target.value,
              )
            }
            style={{
              ...heroStatusSelectStyle,
              borderColor: `${statusColor}66`,
              color: statusColor,
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                style={optionStyle}
              >
                {option.label}
              </option>
            ))}
          </select>

          {savingStatus && (
            <div style={savingTextStyle}>
              Saving...
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          QUICK ACTIONS
          ===================================================== */}

      <div style={quickActionsStyle}>
        <button
          type="button"
          onClick={callSeller}
          style={quickActionGoldStyle}
        >
          ☎ Call Seller
        </button>

        <button
          type="button"
          onClick={textSeller}
          style={quickActionGreenStyle}
        >
          ◇ Text Seller
        </button>

        <button
          type="button"
          onClick={emailSeller}
          style={quickActionBlueStyle}
        >
          ✉ Email Seller
        </button>
      </div>

      {/* =====================================================
          INTELLIGENCE STRIP
          ===================================================== */}

      <section style={metricGridStyle}>
        <MetricCard
          label="Strength"
          value={analysis?.strength}
          tone="gold"
          description={
            analysis?.strength === null
              ? 'Insufficient data'
              : analysis!.strength >= 75
                ? 'Strong'
                : analysis!.strength >= 50
                  ? 'Moderate'
                  : 'Needs work'
          }
        />

        <MetricCard
          label="Motivation"
          value={analysis?.motivation}
          tone="orange"
          description={
            analysis?.motivation === null
              ? 'Insufficient evidence'
              : analysis!.motivation >= 75
                ? 'High'
                : analysis!.motivation >= 45
                  ? 'Moderate'
                  : 'Low'
          }
        />

        <MetricCard
          label="Contactability"
          value={analysis?.contactability}
          tone="blue"
          description={
            analysis?.contactability === null
              ? 'No contact data'
              : analysis!.contactability >= 75
                ? 'Excellent'
                : analysis!.contactability >= 50
                  ? 'Partial'
                  : 'Needs attention'
          }
        />

        <MetricCard
          label="Marketability"
          value={analysis?.marketability}
          tone="green"
          description={
            analysis?.marketability === null
              ? 'Insufficient property data'
              : analysis!.marketability >= 75
                ? 'Strong'
                : analysis!.marketability >= 50
                  ? 'Moderate'
                  : 'Limited'
          }
        />
      </section>

      {/* =====================================================
          MAIN GRID
          ===================================================== */}

      <div style={mainGridStyle}>
        {/* ===================================================
            LEFT COLUMN
            =================================================== */}

        <div style={leftColumnStyle}>
          {/* PROPERTY SNAPSHOT */}

          <SectionCard
            title="Property Snapshot"
            subtitle="Only information currently available on this lead."
          >
            <div style={snapshotGridStyle}>
              <SnapshotItem
                label="ARV"
                value={formatMoney(arv)}
                tone="gold"
              />

              <SnapshotItem
                label="Seller Price"
                value={formatMoney(sellerPrice)}
                tone="white"
              />

              <SnapshotItem
                label="Estimated Equity"
                value={formatMoney(equity)}
                tone="green"
              />

              <SnapshotItem
                label="Mortgage Balance"
                value={formatMoney(mortgageBalance)}
                tone="blue"
              />

              <SnapshotItem
                label="Sq Ft"
                value={formatNumber(sqft)}
                tone="white"
              />

              <SnapshotItem
                label="Beds / Baths"
                value={
                  beds !== null || baths !== null
                    ? `${beds !== null ? beds : '—'} / ${
                        baths !== null ? baths : '—'
                      }`
                    : 'Not available'
                }
                tone="white"
              />
            </div>

            {!hasVerifiedArv && (
              <div style={dataWarningStyle}>
                <strong>ARV not calculated.</strong>
                <span>
                  No verified ARV is stored for this lead.
                  The workspace will not invent a value.
                </span>
              </div>
            )}
          </SectionCard>

          {/* SELLER */}

          <SectionCard
            title="Seller"
            subtitle="Owner and contact information."
          >
            <div style={sellerHeaderStyle}>
              <div style={sellerAvatarStyle}>
                {ownerName
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={sellerNameStyle}>
                  {ownerName}
                </div>

                <div style={sellerSubStyle}>
                  {ownerOccupied === true
                    ? 'Owner Occupied'
                    : ownerOccupied === false
                      ? 'Not Owner Occupied'
                      : 'Occupancy unavailable'}
                </div>
              </div>
            </div>

            <div style={contactGridStyle}>
              <ContactRow
                label="Phone"
                value={phone || 'Not available'}
              />

              <ContactRow
                label="Email"
                value={email || 'Not available'}
              />

              <ContactRow
                label="Mailing Address"
                value={
                  mailingAddress ||
                  'Not available'
                }
              />

              <ContactRow
                label="Ownership Length"
                value={
                  ownershipLength !== null
                    ? `${ownershipLength} years`
                    : 'Not available'
                }
              />
            </div>
          </SectionCard>

          {/* NEXT ACTION */}

          <SectionCard
            title="Next Action"
            subtitle="Keep the next step obvious."
          >
            <div style={nextActionStyle}>
              <div style={nextActionIconStyle}>
                {phone ? '☎' : '!' }
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={nextActionTitleStyle}>
                  {phone
                    ? 'Contact Seller'
                    : 'Find Contact Information'}
                </div>

                <div style={nextActionTextStyle}>
                  {phone
                    ? 'A seller phone number is available.'
                    : 'No phone number is currently available.'}
                </div>
              </div>
            </div>

            <div style={actionButtonRowStyle}>
              <button
                type="button"
                onClick={callSeller}
                style={primaryButtonStyle}
              >
                ☎ Call Seller
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleStatusChange(
                    'contacted',
                  )
                }
                style={secondaryButtonStyle}
              >
                ✓ Mark Contacted
              </button>
            </div>
          </SectionCard>

          {/* PROPERTY DETAILS */}

          <SectionCard
            title="Property Details"
            subtitle="Structured property information."
          >
            <div style={detailGridStyle}>
              <DetailItem
                label="Property Type"
                value={
                  propertyType ||
                  'Not available'
                }
              />

              <DetailItem
                label="County"
                value={
                  county ||
                  'Not available'
                }
              />

              <DetailItem
                label="Beds"
                value={
                  beds !== null
                    ? String(beds)
                    : 'Not available'
                }
              />

              <DetailItem
                label="Baths"
                value={
                  baths !== null
                    ? String(baths)
                    : 'Not available'
                }
              />

              <DetailItem
                label="Sq Ft"
                value={formatNumber(sqft)}
              />

              <DetailItem
                label="Year Built"
                value={
                  yearBuilt !== null
                    ? String(yearBuilt)
                    : 'Not available'
                }
              />

              <DetailItem
                label="Occupancy"
                value={
                  ownerOccupied === null
                    ? 'Not available'
                    : ownerOccupied
                      ? 'Owner Occupied'
                      : 'Not Owner Occupied'
                }
              />

              <DetailItem
                label="APN / Parcel"
                value={
                  apn ||
                  'Not available'
                }
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowMoreDetails(
                  (current) => !current,
                )
              }
              style={expandButtonStyle}
            >
              {showMoreDetails
                ? 'Hide Additional Details ↑'
                : 'View Additional Details ↓'}
            </button>

            {showMoreDetails && (
              <div style={additionalDetailsStyle}>
                <DetailItem
                  label="Last Sale Date"
                  value={formatDate(lastSaleDate)}
                />

                <DetailItem
                  label="Ownership Length"
                  value={
                    ownershipLength !== null
                      ? `${ownershipLength} years`
                      : 'Not available'
                  }
                />

                <DetailItem
                  label="Lead Type"
                  value={
                    leadType ||
                    'Not available'
                  }
                />

                <DetailItem
                  label="Source"
                  value={
                    source ||
                    'Not available'
                  }
                />

                <DetailItem
                  label="Mailing Address"
                  value={
                    mailingAddress ||
                    'Not available'
                  }
                />
              </div>
            )}
          </SectionCard>

          {/* LEAD INTELLIGENCE */}

          <SectionCard
            title="Lead Intelligence"
            subtitle="Evidence-based scoring from information on the lead."
          >
            <div style={intelligenceRowsStyle}>
              <IntelligenceRow
                label="Overall Strength"
                value={analysis?.strength}
              />

              <IntelligenceRow
                label="Motivation"
                value={analysis?.motivation}
              />

              <IntelligenceRow
                label="Contactability"
                value={analysis?.contactability}
              />

              <IntelligenceRow
                label="Marketability"
                value={analysis?.marketability}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowScoreReasoning(
                  (current) => !current,
                )
              }
              style={expandButtonStyle}
            >
              {showScoreReasoning
                ? 'Hide Score Reasoning ↑'
                : 'Why this score? ↓'}
            </button>

            {showScoreReasoning && (
              <div style={reasoningBoxStyle}>
                {analysis?.explanation.map(
                  (item, index) => (
                    <div
                      key={`${item}-${index}`}
                      style={reasoningItemStyle}
                    >
                      <span style={reasoningDotStyle}>
                        •
                      </span>

                      <span>{item}</span>
                    </div>
                  ),
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ===================================================
            RIGHT COLUMN
            =================================================== */}

        <div style={rightColumnStyle}>
          {/* DEAL ANALYSIS */}

          <SectionCard
            title="Deal Analysis"
            subtitle="No fabricated financial assumptions."
          >
            <div style={analysisRowsStyle}>
              <AnalysisRow
                label="ARV"
                value={formatMoney(arv)}
                emphasis="gold"
              />

              <AnalysisRow
                label="Repairs"
                value={formatMoney(repairs)}
              />

              <AnalysisRow
                label="Buy %"
                value={
                  buyPercent !== null
                    ? `${Math.round(
                        buyPercent * 100,
                      )}%`
                    : 'Not available'
                }
              />

              <div style={dividerStyle} />

              <AnalysisRow
                label="Base Maximum"
                value={
                  arv !== null &&
                  buyPercent !== null
                    ? formatMoney(
                        arv * buyPercent,
                      )
                    : 'Not available'
                }
              />

              <AnalysisRow
                label="Assignment Fee"
                value={formatMoney(
                  assignmentFee,
                )}
              />

              <div style={dividerStyle} />

              <AnalysisRow
                label="MAO"
                value={formatMoney(mao)}
                emphasis="green"
                large
              />

              <AnalysisRow
                label="Seller Price"
                value={formatMoney(
                  sellerPrice,
                )}
              />

              <div style={dashedDividerStyle} />

              <AnalysisRow
                label="Difference"
                value={
                  spread === null
                    ? 'Not available'
                    : formatMoney(
                        spread,
                      )
                }
                emphasis={
                  spread === null
                    ? undefined
                    : spread >= 0
                      ? 'green'
                      : 'red'
                }
                large
              />
            </div>

            {!hasEnoughForMao && (
              <div style={dataWarningStyle}>
                <strong>MAO unavailable.</strong>
                <span>
                  A verified ARV and buy percentage are
                  required before a meaningful MAO can be
                  calculated.
                </span>
              </div>
            )}

            {hasEnoughForMao &&
              mao !== null &&
              sellerPrice !== null && (
                <div
                  style={
                    spread !== null &&
                    spread >= 0
                      ? dealHealthGoodStyle
                      : dealHealthBadStyle
                  }
                >
                  <div style={dealHealthEyebrowStyle}>
                    DEAL HEALTH
                  </div>

                  <div style={dealHealthTitleStyle}>
                    {spread !== null &&
                    spread >= 0
                      ? 'WITHIN MAO'
                      : 'ABOVE MAO'}
                  </div>

                  <div style={dealHealthTextStyle}>
                    {spread !== null &&
                    spread >= 0
                      ? `The seller price is ${formatMoney(
                          Math.abs(spread),
                        )} below the calculated MAO.`
                      : `The seller price is ${formatMoney(
                          Math.abs(spread ?? 0),
                        )} above the calculated MAO.`}
                  </div>
                </div>
              )}

            <div style={analysisDisclaimerStyle}>
              Calculations shown here use only values
              actually available on this lead. Verified
              comparable sales are required before treating
              ARV as a market-supported number.
            </div>
          </SectionCard>

          {/* COMPS */}

          <SectionCard
            title="Comparable Sales"
            subtitle="Verified comps only — no fabricated properties."
          >
            <div style={emptyDataCardStyle}>
              <div style={emptyDataIconStyle}>
                ⌕
              </div>

              <div>
                <div style={emptyDataTitleStyle}>
                  No verified comps loaded
                </div>

                <div style={emptyDataTextStyle}>
                  This workspace will not populate fake
                  comparable sales. A future comps lookup can
                  search actual sales using the property's
                  location and a six-month / one-mile
                  constraint.
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ACTIVITY */}

          <SectionCard
            title="Activity"
            subtitle="Workspace notes and lead history."
          >
            <div style={activityItemStyle}>
              <div style={activityDotStyle} />

              <div>
                <div style={activityTitleStyle}>
                  Lead created
                </div>

                <div style={activityTextStyle}>
                  {formatDate(
                    lead.created_at,
                  )}
                </div>
              </div>
            </div>

            {lead.updated_at && (
              <div style={activityItemStyle}>
                <div
                  style={{
                    ...activityDotStyle,
                    background:
                      '#38bdf8',
                  }}
                />

                <div>
                  <div style={activityTitleStyle}>
                    Lead updated
                  </div>

                  <div style={activityTextStyle}>
                    {formatDate(
                      lead.updated_at,
                    )}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* NOTES */}

          <SectionCard
            title="Workspace Notes"
            subtitle="Your private deal notes for this lead."
          >
            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add notes, seller details, follow-up thoughts, property observations, offer strategy..."
              style={notesInputStyle}
            />

            <div style={notesFooterStyle}>
              <span style={notesHintStyle}>
                Notes are stored on the lead record.
              </span>

              <button
                type="button"
                onClick={() =>
                  void handleSaveNotes()
                }
                disabled={savingNotes}
                style={primaryButtonStyle}
              >
                {savingNotes
                  ? 'Saving...'
                  : 'Save Notes'}
              </button>
            </div>
          </SectionCard>

          {/* TOOLS */}

          <SectionCard
            title="Tools"
            subtitle="Tools can be added without changing the core workspace."
          >
            <div style={toolsGridStyle}>
              <ToolCard
                title="Comps Analyzer"
                description="Find verified comparable sales and establish market-supported ARV."
                disabled
              />

              <ToolCard
                title="Repair Estimator"
                description="Build a property-specific renovation estimate."
                disabled
              />

              <ToolCard
                title="Contract Generator"
                description="Prepare purchase agreement deal information."
                disabled
              />

              <ToolCard
                title="Assignment Calculator"
                description="Evaluate assignment fee and transaction economics."
                disabled
              />
            </div>
          </SectionCard>
        </div>
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
  description,
  tone,
}: {
  label: string
  value: number | null | undefined
  description: string
  tone: 'gold' | 'orange' | 'blue' | 'green'
}) {
  const toneMap = {
    gold: {
      value: '#e6be67',
      border: 'rgba(214,166,75,0.22)',
      background: 'rgba(214,166,75,0.08)',
    },
    orange: {
      value: '#ffb84d',
      border: 'rgba(245,158,11,0.22)',
      background: 'rgba(245,158,11,0.08)',
    },
    blue: {
      value: '#8fc1ff',
      border: 'rgba(96,165,250,0.22)',
      background: 'rgba(96,165,250,0.08)',
    },
    green: {
      value: '#7fe3a0',
      border: 'rgba(34,197,94,0.22)',
      background: 'rgba(34,197,94,0.08)',
    },
  }[tone]

  return (
    <div
      style={{
        ...metricCardStyle,
        borderColor: toneMap.border,
        background: toneMap.background,
      }}
    >
      <div style={metricLabelStyle}>
        {label}
      </div>

      <div
        style={{
          ...metricValueStyle,
          color: toneMap.value,
        }}
      >
        {value === null ||
        value === undefined
          ? '—'
          : value}
      </div>

      <div style={metricDescriptionStyle}>
        {description}
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
  tone: 'gold' | 'green' | 'blue' | 'white'
}) {
  const color =
    tone === 'gold'
      ? '#e6be67'
      : tone === 'green'
        ? '#7fe3a0'
        : tone === 'blue'
          ? '#8fc1ff'
          : '#ffffff'

  return (
    <div style={snapshotItemStyle}>
      <div style={miniLabelStyle}>
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

function ContactRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={contactRowStyle}>
      <div style={miniLabelStyle}>
        {label}
      </div>

      <div style={contactValueStyle}>
        {value}
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={detailItemStyle}>
      <div style={miniLabelStyle}>
        {label}
      </div>

      <div style={detailValueStyle}>
        {value}
      </div>
    </div>
  )
}

function IntelligenceRow({
  label,
  value,
}: {
  label: string
  value: number | null | undefined
}) {
  return (
    <div style={intelligenceRowStyle}>
      <div>
        <div style={intelligenceLabelStyle}>
          {label}
        </div>
      </div>

      <div style={intelligenceValueWrapStyle}>
        <div style={intelligenceValueStyle}>
          {value === null ||
          value === undefined
            ? '—'
            : value}
        </div>

        <div style={intelligenceStatusStyle}>
          {value === null ||
          value === undefined
            ? 'Insufficient data'
            : value >= 75
              ? 'Strong'
              : value >= 50
                ? 'Moderate'
                : 'Needs attention'}
        </div>
      </div>
    </div>
  )
}

function AnalysisRow({
  label,
  value,
  emphasis,
  large,
}: {
  label: string
  value: string
  emphasis?:
    | 'gold'
    | 'green'
    | 'red'
  large?: boolean
}) {
  const valueColor =
    emphasis === 'gold'
      ? '#e6be67'
      : emphasis === 'green'
        ? '#7fe3a0'
        : emphasis === 'red'
          ? '#f87171'
          : '#ffffff'

  return (
    <div style={analysisRowStyle}>
      <span style={analysisLabelStyle}>
        {label}
      </span>

      <span
        style={{
          ...analysisValueStyle,
          color: valueColor,
          fontSize: large ? 18 : 14,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ToolCard({
  title,
  description,
  disabled,
}: {
  title: string
  description: string
  disabled?: boolean
}) {
  return (
    <div
      style={{
        ...toolCardStyle,
        opacity: disabled ? 0.72 : 1,
      }}
    >
      <div style={toolIconStyle}>
        ✦
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={toolTitleStyle}>
          {title}
        </div>

        <div style={toolDescriptionStyle}>
          {description}
        </div>

        <div style={toolStatusStyle}>
          {disabled
            ? 'Not connected'
            : 'Open tool →'}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   STYLES
   ========================================================= */

const loadingStyle: CSSProperties = {
  minHeight: 180,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  color: 'rgba(255,255,255,0.6)',
}

const loadingDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#d6a64b',
}

const errorBoxStyle: CSSProperties = {
  marginBottom: 16,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(239,68,68,0.28)',
  background: 'rgba(239,68,68,0.08)',
  color: '#fca5a5',
  fontSize: 13,
  lineHeight: 1.5,
}

const successBoxStyle: CSSProperties = {
  marginBottom: 16,
  padding: '11px 14px',
  borderRadius: 12,
  border: '1px solid rgba(34,197,94,0.22)',
  background: 'rgba(34,197,94,0.07)',
  color: '#86efac',
  fontSize: 13,
}

const refreshButtonStyle: CSSProperties = {
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 9,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)',
  color: 'rgba(255,255,255,0.75)',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const heroStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 24,
  padding: '24px',
  marginBottom: 14,
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.07)',
  background:
    'linear-gradient(135deg, rgba(19,17,12,0.98), rgba(5,5,5,0.98))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.025)',
  flexWrap: 'wrap',
}

const heroMainStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.16em',
  color: '#d6a64b',
  marginBottom: 8,
}

const heroTitleStyle: CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: 'clamp(26px, 4vw, 42px)',
  lineHeight: 1.05,
  letterSpacing: '-0.035em',
  fontWeight: 850,
  wordBreak: 'break-word',
}

const heroLocationStyle: CSSProperties = {
  marginTop: 8,
  color: 'rgba(255,255,255,0.55)',
  fontSize: 13,
}

const heroMetaRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 7,
  marginTop: 14,
}

const goldBadgeStyle: CSSProperties = {
  padding: '5px 9px',
  borderRadius: 999,
  border: '1px solid rgba(214,166,75,0.28)',
  background: 'rgba(214,166,75,0.1)',
  color: '#e6be67',
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const greenBadgeStyle: CSSProperties = {
  ...goldBadgeStyle,
  borderColor: 'rgba(34,197,94,0.24)',
  background: 'rgba(34,197,94,0.08)',
  color: '#86efac',
}

const mutedBadgeStyle: CSSProperties = {
  ...goldBadgeStyle,
  borderColor: 'rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  color: 'rgba(255,255,255,0.58)',
}

const heroControlsStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
  minWidth: 180,
}

const stageLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.14em',
  color: 'rgba(255,255,255,0.38)',
}

const heroStatusSelectStyle: CSSProperties = {
  minHeight: 42,
  padding: '0 12px',
  borderRadius: 10,
  background: 'rgba(0,0,0,0.55)',
  border: '1px solid rgba(214,166,75,0.3)',
  fontSize: 13,
  fontWeight: 750,
  outline: 'none',
  cursor: 'pointer',
}

const optionStyle: CSSProperties = {
  background: '#111111',
  color: '#ffffff',
}

const savingTextStyle: CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.4)',
}

const quickActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 9,
  marginBottom: 14,
  flexWrap: 'wrap',
}

const quickActionBase: CSSProperties = {
  minHeight: 40,
  padding: '0 15px',
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
  border: '1px solid',
}

const quickActionGoldStyle: CSSProperties = {
  ...quickActionBase,
  borderColor: 'rgba(214,166,75,0.3)',
  background: 'rgba(214,166,75,0.1)',
  color: '#e6be67',
}

const quickActionGreenStyle: CSSProperties = {
  ...quickActionBase,
  borderColor: 'rgba(34,197,94,0.25)',
  background: 'rgba(34,197,94,0.08)',
  color: '#86efac',
}

const quickActionBlueStyle: CSSProperties = {
  ...quickActionBase,
  borderColor: 'rgba(96,165,250,0.25)',
  background: 'rgba(96,165,250,0.08)',
  color: '#93c5fd',
}

const metricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(4, minmax(0, 1fr))',
  gap: 12,
  marginBottom: 14,
}

const metricCardStyle: CSSProperties = {
  minWidth: 0,
  padding: '15px 16px',
  borderRadius: 16,
  border: '1px solid',
}

const metricLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.14em',
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase',
}

const metricValueStyle: CSSProperties = {
  marginTop: 7,
  fontSize: 28,
  lineHeight: 1,
  fontWeight: 850,
}

const metricDescriptionStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  color: 'rgba(255,255,255,0.48)',
}

const mainGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1.15fr) minmax(330px, 0.85fr)',
  gap: 14,
  alignItems: 'start',
}

const leftColumnStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  minWidth: 0,
}

const rightColumnStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  minWidth: 0,
}

const snapshotGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap: 9,
}

const snapshotItemStyle: CSSProperties = {
  minWidth: 0,
  padding: '12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.055)',
  background: 'rgba(255,255,255,0.018)',
}

const miniLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.11em',
  color: 'rgba(255,255,255,0.36)',
}

const snapshotValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 15,
  lineHeight: 1.2,
  fontWeight: 800,
  wordBreak: 'break-word',
}

const dataWarningStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  marginTop: 12,
  padding: '11px 12px',
  borderRadius: 11,
  border: '1px solid rgba(214,166,75,0.18)',
  background: 'rgba(214,166,75,0.055)',
  color: 'rgba(255,255,255,0.58)',
  fontSize: 11,
  lineHeight: 1.45,
}

const sellerHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingBottom: 15,
  borderBottom:
    '1px solid rgba(255,255,255,0.06)',
}

const sellerAvatarStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 13,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  background: 'rgba(214,166,75,0.1)',
  border: '1px solid rgba(214,166,75,0.2)',
  color: '#e6be67',
  fontSize: 16,
  fontWeight: 850,
}

const sellerNameStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 800,
  wordBreak: 'break-word',
}

const sellerSubStyle: CSSProperties = {
  marginTop: 3,
  color: 'rgba(255,255,255,0.42)',
  fontSize: 11,
}

const contactGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginTop: 15,
}

const contactRowStyle: CSSProperties = {
  minWidth: 0,
}

const contactValueStyle: CSSProperties = {
  marginTop: 5,
  color: '#ffffff',
  fontSize: 13,
  lineHeight: 1.4,
  wordBreak: 'break-word',
}

const nextActionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const nextActionIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  background: 'rgba(214,166,75,0.1)',
  border: '1px solid rgba(214,166,75,0.2)',
  color: '#e6be67',
  fontSize: 17,
  fontWeight: 800,
}

const nextActionTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 800,
}

const nextActionTextStyle: CSSProperties = {
  marginTop: 3,
  color: 'rgba(255,255,255,0.45)',
  fontSize: 11,
  lineHeight: 1.4,
}

const actionButtonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 15,
  flexWrap: 'wrap',
}

const primaryButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: '0 13px',
  borderRadius: 9,
  border: '1px solid rgba(214,166,75,0.3)',
  background: 'rgba(214,166,75,0.12)',
  color: '#e6be67',
  fontSize: 11,
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: '0 13px',
  borderRadius: 9,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.025)',
  color: 'rgba(255,255,255,0.75)',
  fontSize: 11,
  fontWeight: 800,
  cursor: 'pointer',
}

const detailGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 9,
}

const detailItemStyle: CSSProperties = {
  minWidth: 0,
  padding: '10px 11px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.018)',
  border:
    '1px solid rgba(255,255,255,0.05)',
}

const detailValueStyle: CSSProperties = {
  marginTop: 5,
  color: '#ffffff',
  fontSize: 12,
  lineHeight: 1.4,
  wordBreak: 'break-word',
}

const expandButtonStyle: CSSProperties = {
  width: '100%',
  marginTop: 11,
  padding: '9px 0',
  border: 'none',
  borderTop:
    '1px solid rgba(255,255,255,0.06)',
  background: 'transparent',
  color: '#d6a64b',
  fontSize: 11,
  fontWeight: 800,
  cursor: 'pointer',
}

const additionalDetailsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 9,
  marginTop: 3,
}

const intelligenceRowsStyle: CSSProperties = {
  display: 'grid',
  gap: 0,
}

const intelligenceRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 15,
  padding: '12px 0',
  borderBottom:
    '1px solid rgba(255,255,255,0.05)',
}

const intelligenceLabelStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.72)',
  fontSize: 12,
  fontWeight: 700,
}

const intelligenceValueWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
}

const intelligenceValueStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 19,
  fontWeight: 850,
}

const intelligenceStatusStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: 10,
  fontWeight: 700,
}

const reasoningBoxStyle: CSSProperties = {
  marginTop: 11,
  padding: 12,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.018)',
  border:
    '1px solid rgba(255,255,255,0.055)',
}

const reasoningItemStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  color: 'rgba(255,255,255,0.58)',
  fontSize: 11,
  lineHeight: 1.5,
  marginBottom: 7,
}

const reasoningDotStyle: CSSProperties = {
  color: '#d6a64b',
  fontWeight: 900,
}

const analysisRowsStyle: CSSProperties = {
  display: 'grid',
  gap: 0,
}

const analysisRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 15,
  padding: '10px 0',
}

const analysisLabelStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.52)',
  fontSize: 12,
}

const analysisValueStyle: CSSProperties = {
  color: '#ffffff',
  fontWeight: 800,
  textAlign: 'right',
}

const dividerStyle: CSSProperties = {
  height: 1,
  background: 'rgba(255,255,255,0.07)',
  margin: '3px 0',
}

const dashedDividerStyle: CSSProperties = {
  borderTop:
    '1px dashed rgba(255,255,255,0.12)',
  margin: '5px 0',
}

const dealHealthGoodStyle: CSSProperties = {
  marginTop: 12,
  padding: 13,
  borderRadius: 13,
  border:
    '1px solid rgba(34,197,94,0.22)',
  background: 'rgba(34,197,94,0.07)',
}

const dealHealthBadStyle: CSSProperties = {
  marginTop: 12,
  padding: 13,
  borderRadius: 13,
  border:
    '1px solid rgba(239,68,68,0.22)',
  background: 'rgba(239,68,68,0.07)',
}

const dealHealthEyebrowStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.13em',
}

const dealHealthTitleStyle: CSSProperties = {
  marginTop: 4,
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 850,
}

const dealHealthTextStyle: CSSProperties = {
  marginTop: 5,
  color: 'rgba(255,255,255,0.55)',
  fontSize: 11,
  lineHeight: 1.45,
}

const analysisDisclaimerStyle: CSSProperties = {
  marginTop: 12,
  paddingTop: 11,
  borderTop:
    '1px solid rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.32)',
  fontSize: 10,
  lineHeight: 1.45,
}

const emptyDataCardStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  padding: 14,
  borderRadius: 13,
  border:
    '1px solid rgba(255,255,255,0.055)',
  background: 'rgba(255,255,255,0.018)',
}

const emptyDataIconStyle: CSSProperties = {
  width: 38,
  height: 38,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 11,
  background: 'rgba(214,166,75,0.08)',
  border:
    '1px solid rgba(214,166,75,0.18)',
  color: '#d6a64b',
  fontSize: 18,
}

const emptyDataTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 800,
}

const emptyDataTextStyle: CSSProperties = {
  marginTop: 5,
  color: 'rgba(255,255,255,0.45)',
  fontSize: 11,
  lineHeight: 1.5,
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
  marginTop: 4,
  flexShrink: 0,
  borderRadius: '50%',
  background: '#d6a64b',
}

const activityTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 750,
}

const activityTextStyle: CSSProperties = {
  marginTop: 3,
  color: 'rgba(255,255,255,0.4)',
  fontSize: 10,
}

const notesInputStyle: CSSProperties = {
  width: '100%',
  minHeight: 150,
  resize: 'vertical',
  boxSizing: 'border-box',
  padding: 13,
  borderRadius: 12,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.35)',
  color: '#ffffff',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: 12,
  lineHeight: 1.55,
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
  color: 'rgba(255,255,255,0.32)',
  fontSize: 10,
}

const toolsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 9,
}

const toolCardStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  padding: 11,
  borderRadius: 12,
  border:
    '1px solid rgba(255,255,255,0.055)',
  background: 'rgba(255,255,255,0.018)',
}

const toolIconStyle: CSSProperties = {
  width: 32,
  height: 32,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 9,
  background: 'rgba(214,166,75,0.08)',
  color: '#d6a64b',
  fontSize: 13,
}

const toolTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 11,
  fontWeight: 800,
}

const toolDescriptionStyle: CSSProperties = {
  marginTop: 4,
  color: 'rgba(255,255,255,0.4)',
  fontSize: 10,
  lineHeight: 1.4,
}

const toolStatusStyle: CSSProperties = {
  marginTop: 6,
  color: '#d6a64b',
  fontSize: 9,
  fontWeight: 800,
}

/* =========================================================
   RESPONSIVE CSS
   ========================================================= */

/*
 * The component intentionally uses inline styles so it does
 * not require another CSS file. A small style tag handles
 * the responsive layout.
 */

if (typeof document !== 'undefined') {
  const styleId =
    'foundation-lead-workspace-responsive'

  if (!document.getElementById(styleId)) {
    const style =
      document.createElement('style')

    style.id = styleId

    style.textContent = `
      @media (max-width: 1050px) {
        .foundation-lead-workspace-responsive {}
      }

      @media (max-width: 900px) {
        .foundation-lead-workspace-responsive {}
      }
    `

    document.head.appendChild(style)
  }
}