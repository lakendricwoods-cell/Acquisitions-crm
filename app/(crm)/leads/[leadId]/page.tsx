'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ActionButton from '@/components/ui/action-button'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import WorkspaceCanvas from '@/components/workspace-canvas'
import { supabase } from '@/lib/supabase'
import { resolveField, resolveNumericField } from '@/lib/resolve-field'
import { FIELD_ALIASES } from '@/lib/field-aliases'
import { computeOwnershipYears } from '@/lib/compute-fields'

type LeadRecord = {
  id: string

  property_address_1?: string | null
  property_address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  county?: string | null

  owner_name?: string | null
  owner_phone?: string | null
  owner_phone_primary?: string | null
  phone?: string | null
  phone1?: string | null
  owner_email?: string | null
  email?: string | null
  email1?: string | null

  owner_mailing_address?: string | null
  owner_mailing_city?: string | null
  owner_mailing_state?: string | null
  owner_mailing_zip?: string | null

  property_type?: string | null
  property_use?: string | null

  bedrooms?: number | null
  bathrooms?: number | null
  square_feet?: number | null
  year_built?: number | null

  apn?: string | null

  status?: string | null

  house_value?: number | null
  estimated_value?: number | null
  market_value?: number | null

  equity_amount?: number | null
  equity_percent?: number | null
  mortgage_balance?: number | null

  last_sale_amount?: number | null
  last_sale_date?: string | null

  asking_price?: number | null
  listing_price?: number | null

  default_amount?: number | null
  auction_date?: string | null
  lender_name?: string | null

  ownership_length?: number | null

  owner_occupied?: boolean | null
  vacant?: boolean | null

  lead_type?: string | null

  lead_intelligence?: Record<string, unknown> | null
  raw_import_data?: Record<string, unknown> | null
  source_columns?: Record<string, unknown> | null
}

type Comp = {
  id?: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  distance_miles?: number | null
  sold_price?: number | null
  sale_date?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  square_feet?: number | null
  year_built?: number | null
  property_type?: string | null
}

type Analysis = {
  overall: number | null
  motivation: number | null
  contactability: number | null
  marketability: number | null
  dealPotential: number | null
  confidence: number
  label: string
  explanation: string
  evidence: string[]
  warnings: string[]
}

type DealAnalysis = {
  arv: number | null
  repairs: number | null
  buyPercent: number
  assignmentFee: number
  mao: number | null
  sellerPrice: number | null
  spread: number | null
}

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

function text(value: unknown) {
  if (value === null || value === undefined) return null

  const result = String(value).trim()

  return result || null
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const parsed = Number(
    String(value).replace(/[$,%\s,]/g, '')
  )

  return Number.isFinite(parsed) ? parsed : null
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const result = text(value)

    if (result) return result
  }

  return null
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const result = numberValue(value)

    if (result !== null) return result
  }

  return null
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function percent(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'

  return `${Math.round(value)}%`
}

function stageLabel(value: string) {
  return (
    STAGE_OPTIONS.find((item) => item.value === value)?.label ||
    value.replaceAll('_', ' ')
  )
}

function calculateAnalysis(
  lead: LeadRecord,
  comps: Comp[],
  deal: DealAnalysis
): Analysis {
  const raw = lead.raw_import_data as any
  const intelligence = lead.lead_intelligence as any

  const phone = firstText(
    lead.owner_phone,
    lead.owner_phone_primary,
    lead.phone,
    lead.phone1,
    raw?.owner_phone,
    raw?.phone,
    intelligence?.owner_phone,
    intelligence?.phone
  )

  const email = firstText(
    lead.owner_email,
    lead.email,
    lead.email1,
    raw?.owner_email,
    raw?.email,
    intelligence?.owner_email,
    intelligence?.email
  )

  const owner = firstText(
    lead.owner_name,
    raw?.owner_name,
    intelligence?.owner_name
  )

  const propertyAddress = firstText(
    lead.property_address_1,
    lead.property_address
  )

  const marketValue = firstNumber(
    lead.market_value,
    lead.estimated_value,
    lead.house_value,
    intelligence?.market_value,
    intelligence?.estimated_value,
    intelligence?.house_value
  )

  const equity = firstNumber(
    lead.equity_amount,
    intelligence?.equity_amount
  )

  const equityPercent = firstNumber(
    lead.equity_percent,
    intelligence?.equity_percent
  )

  const ownershipYears =
    lead.ownership_length ??
    computeOwnershipYears({
      ...lead,
      last_sale_date: lead.last_sale_date,
    })

  /*
   * CONTACTABILITY
   *
   * This score is based on actual contact information.
   * No arbitrary starting score.
   */
  const contactEvidence = [
    owner ? 25 : 0,
    phone ? 50 : 0,
    email ? 25 : 0,
  ]

  const contactability = Math.min(
    100,
    contactEvidence.reduce((a, b) => a + b, 0)
  )

  /*
   * MARKETABILITY
   *
   * Verified comps are weighted heavily.
   */
  let marketability = 0
  const marketEvidence: string[] = []
  const warnings: string[] = []

  if (propertyAddress) {
    marketability += 10
    marketEvidence.push('Property address verified')
  }

  if (lead.bedrooms != null) {
    marketability += 10
    marketEvidence.push('Bedroom count available')
  }

  if (lead.bathrooms != null) {
    marketability += 10
    marketEvidence.push('Bathroom count available')
  }

  if (lead.square_feet != null) {
    marketability += 10
    marketEvidence.push('Square footage available')
  }

  if (marketValue !== null) {
    marketability += 15
    marketEvidence.push('Market value available')
  }

  if (comps.length >= 3) {
    marketability += 30
    marketEvidence.push(
      `${comps.length} verified comparable sales within target criteria`
    )
  } else if (comps.length > 0) {
    marketability += 15
    marketEvidence.push(
      `${comps.length} verified comparable sale(s) found`
    )
  } else {
    warnings.push(
      'No verified qualifying comparable sales were returned.'
    )
  }

  if (deal.arv !== null) {
    marketability += 15
    marketEvidence.push('ARV supported by verified comparable sales')
  }

  /*
   * MOTIVATION
   *
   * Motivation is evidence-based. Merely having an owner name
   * does not make the lead motivated.
   */
  let motivation = 0
  const motivationEvidence: string[] = []

  if (lead.vacant === true) {
    motivation += 25
    motivationEvidence.push('Property is marked vacant')
  }

  if (lead.owner_occupied === false) {
    motivation += 15
    motivationEvidence.push('Owner appears absentee')
  }

  if (lead.default_amount != null && lead.default_amount > 0) {
    motivation += 25
    motivationEvidence.push('Default amount reported')
  }

  if (lead.auction_date) {
    motivation += 25
    motivationEvidence.push('Auction date reported')
  }

  if (lead.equity_percent != null && lead.equity_percent >= 40) {
    motivation += 10
    motivationEvidence.push('Substantial equity reported')
  }

  if (
    ownershipYears !== null &&
    ownershipYears !== undefined &&
    ownershipYears >= 10
  ) {
    motivation += 10
    motivationEvidence.push(
      `${Math.round(ownershipYears)} years of ownership`
    )
  }

  motivation = Math.min(100, motivation)

  /*
   * DEAL POTENTIAL
   *
   * Cannot be calculated without a verified ARV and seller price.
   */
  let dealPotential: number | null = null

  if (deal.arv !== null && deal.sellerPrice !== null) {
    const spread = deal.arv - deal.sellerPrice

    if (spread <= 0) {
      dealPotential = 0
    } else {
      dealPotential = Math.max(
        0,
        Math.min(100, Math.round((spread / deal.arv) * 100))
      )
    }
  }

  /*
   * OVERALL
   *
   * Only available when sufficient evidence exists.
   */
  const components = [
    contactability,
    motivation,
    marketability,
    dealPotential,
  ].filter((value): value is number => value !== null)

  const confidenceInputs = [
    propertyAddress,
    owner,
    phone,
    email,
    marketValue,
    lead.square_feet,
    lead.bedrooms,
    lead.bathrooms,
    comps.length > 0 ? comps.length : null,
    deal.arv,
  ]

  const confidence =
    Math.round(
      (confidenceInputs.filter(
        (value) => value !== null && value !== undefined
      ).length /
        confidenceInputs.length) *
        100
    )

  if (components.length < 2 || confidence < 40) {
    return {
      overall: null,
      motivation,
      contactability,
      marketability,
      dealPotential,
      confidence,
      label: 'Insufficient Data',
      explanation:
        'There is not enough verified property, ownership, contact, or market information to produce a reliable lead-strength score.',
      evidence: [
        ...motivationEvidence,
        ...marketEvidence,
      ],
      warnings,
    }
  }

  const overall = Math.round(
    components.reduce((sum, value) => sum + value, 0) /
      components.length
  )

  let label = 'Needs Attention'

  if (overall >= 80) label = 'Strong Opportunity'
  else if (overall >= 65) label = 'Promising'
  else if (overall >= 45) label = 'Moderate'

  const explanation =
    overall >= 80
      ? 'Multiple verified property, ownership, contact, and/or deal signals indicate this lead deserves active attention.'
      : overall >= 65
        ? 'The available evidence suggests a potentially workable opportunity, but additional qualification may improve confidence.'
        : overall >= 45
          ? 'Some useful signals exist, but the opportunity needs additional qualification before it should receive high priority.'
          : 'The available evidence is currently weak or incomplete.'

  return {
    overall,
    motivation,
    contactability,
    marketability,
    dealPotential,
    confidence,
    label,
    explanation,
    evidence: [
      ...motivationEvidence,
      ...marketEvidence,
    ],
    warnings,
  }
}

export default function LeadWorkspacePage() {
  const params = useParams()
  const router = useRouter()

  const leadId = String(params?.leadId || '')

  const [lead, setLead] = useState<LeadRecord | null>(null)
  const [comps, setComps] = useState<Comp[]>([])
  const [loading, setLoading] = useState(true)
  const [compsLoading, setCompsLoading] = useState(false)
  const [savingStage, setSavingStage] = useState(false)
  const [compsMessage, setCompsMessage] = useState('')

  useEffect(() => {
    async function loadLead() {
      if (!leadId) return

      setLoading(true)

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) {
        console.error('Failed to load lead:', error)
        setLead(null)
      } else {
        setLead(data as LeadRecord)
      }

      setLoading(false)
    }

    void loadLead()
  }, [leadId])

  const normalizedLead = useMemo(() => {
    if (!lead) return null

    const raw = lead.raw_import_data as any
    const source = lead.source_columns as any
    const intelligence = lead.lead_intelligence as any

    const bedrooms =
      resolveNumericField(
        lead as any,
        FIELD_ALIASES.beds,
        null,
        {
          treatZeroAsMissing: true,
          min: 1,
        }
      ) ??
      firstNumber(
        lead.bedrooms,
        raw?.bedrooms,
        raw?.beds,
        source?.bedrooms,
        source?.beds,
        intelligence?.bedrooms
      )

    const bathrooms =
      resolveNumericField(
        lead as any,
        FIELD_ALIASES.baths,
        null,
        {
          treatZeroAsMissing: false,
          min: 0,
        }
      ) ??
      firstNumber(
        lead.bathrooms,
        raw?.bathrooms,
        raw?.baths,
        source?.bathrooms,
        source?.baths,
        intelligence?.bathrooms
      )

    const squareFeet =
      resolveNumericField(
        lead as any,
        FIELD_ALIASES.sqft,
        null,
        {
          treatZeroAsMissing: true,
          min: 1,
        }
      ) ??
      firstNumber(
        lead.square_feet,
        raw?.square_feet,
        raw?.sqft,
        source?.square_feet,
        source?.sqft,
        intelligence?.square_feet
      )

    const ownerName = firstText(
      resolveField(
        lead as any,
        FIELD_ALIASES.ownerName
      ),
      lead.owner_name,
      intelligence?.owner_name,
      raw?.owner_name
    )

    const ownerPhone = firstText(
      lead.owner_phone,
      lead.owner_phone_primary,
      lead.phone,
      lead.phone1,
      intelligence?.owner_phone,
      intelligence?.phone,
      raw?.owner_phone,
      raw?.phone
    )

    const ownerEmail = firstText(
      lead.owner_email,
      lead.email,
      lead.email1,
      intelligence?.owner_email,
      intelligence?.email,
      raw?.owner_email,
      raw?.email
    )

    const lastSaleDate = firstText(
      resolveField(
        lead as any,
        FIELD_ALIASES.lastSaleDate
      ),
      lead.last_sale_date,
      intelligence?.last_sale_date
    )

    const estimatedValue = firstNumber(
      resolveField(
        lead as any,
        FIELD_ALIASES.estimatedValue
      ),
      lead.market_value,
      lead.estimated_value,
      lead.house_value,
      intelligence?.market_value,
      intelligence?.estimated_value,
      intelligence?.house_value
    )

    const ownershipLength =
      computeOwnershipYears({
        ...lead,
        last_sale_date: lastSaleDate,
      }) ??
      lead.ownership_length ??
      null

    return {
      ...lead,
      bedrooms,
      bathrooms,
      square_feet: squareFeet,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      last_sale_date: lastSaleDate,
      ownership_length: ownershipLength,
      resolved_value: estimatedValue,
      status: lead.status || 'new_lead',
    }
  }, [lead])

  /*
   * REAL COMPS
   *
   * This intentionally calls an application endpoint.
   * The endpoint must return actual sold records.
   *
   * We do NOT create fallback/fake comps.
   */
  useEffect(() => {
    async function loadComps() {
      if (!normalizedLead) return

      const address = firstText(
        normalizedLead.property_address_1,
        normalizedLead.property_address
      )

      if (!address) {
        setComps([])
        setCompsMessage(
          'Property address is required before comparable sales can be searched.'
        )
        return
      }

      setCompsLoading(true)
      setCompsMessage('')

      try {
        const params = new URLSearchParams({
          address,
          city: normalizedLead.city || '',
          state: normalizedLead.state || '',
          zip: normalizedLead.zip || '',
          radiusMiles: '1',
          months: '6',
          soldOnly: 'true',
          limit: '20',
        })

        const response = await fetch(
          `/api/comps?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        if (!response.ok) {
          throw new Error(
            `Comparable search failed (${response.status})`
          )
        }

        const result = await response.json()

        const returnedComps = Array.isArray(result?.comps)
          ? result.comps
          : []

        const verifiedComps = returnedComps.filter(
          (comp: Comp) =>
            comp.sold_price != null &&
            comp.sale_date != null
        )

        setComps(verifiedComps)

        if (verifiedComps.length === 0) {
          setCompsMessage(
            'No verified sold comparables were found within 1 mile and the last 6 months.'
          )
        } else {
          setCompsMessage(
            `${verifiedComps.length} verified comparable sale${verifiedComps.length === 1 ? '' : 's'} found.`
          )
        }
      } catch (error) {
        console.error('Comparable search failed:', error)

        setComps([])
        setCompsMessage(
          'Verified comparable sales could not be retrieved. ARV was not estimated.'
        )
      } finally {
        setCompsLoading(false)
      }
    }

    void loadComps()
  }, [normalizedLead])

  const arv = useMemo(() => {
    if (comps.length === 0) return null

    const prices = comps
      .map((comp) => numberValue(comp.sold_price))
      .filter(
        (value): value is number =>
          value !== null && value > 0
      )

    if (prices.length === 0) return null

    /*
     * Conservative verified-comp approach:
     * use median sold price rather than inventing an appreciation
     * factor or unsupported adjustment.
     */
    const sorted = [...prices].sort((a, b) => a - b)

    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return Math.round(
        (sorted[middle - 1] + sorted[middle]) / 2
      )
    }

    return Math.round(sorted[middle])
  }, [comps])

  const deal = useMemo<DealAnalysis>(() => {
    if (!normalizedLead) {
      return {
        arv,
        repairs: null,
        buyPercent: 70,
        assignmentFee: 20000,
        mao: null,
        sellerPrice: null,
        spread: null,
      }
    }

    const sellerPrice = firstNumber(
      normalizedLead.asking_price,
      normalizedLead.listing_price
    )

    const repairs = firstNumber(
      (normalizedLead.lead_intelligence as any)?.repair_estimate,
      (normalizedLead.lead_intelligence as any)?.repairs,
      (normalizedLead.raw_import_data as any)?.repair_estimate,
      (normalizedLead.raw_import_data as any)?.repairs
    )

    const buyPercent = 70
    const assignmentFee = 20000

    /*
     * MAO is only calculated when we have a verified ARV.
     *
     * Repairs are not fabricated. If repairs are missing, MAO remains
     * unavailable because pretending repairs are $0 would distort the deal.
     */
    const mao =
      arv !== null && repairs !== null
        ? Math.round(
            arv * (buyPercent / 100) -
              repairs -
              assignmentFee
          )
        : null

    const spread =
      mao !== null && sellerPrice !== null
        ? mao - sellerPrice
        : null

    return {
      arv,
      repairs,
      buyPercent,
      assignmentFee,
      mao,
      sellerPrice,
      spread,
    }
  }, [normalizedLead, arv])

  const analysis = useMemo(() => {
    if (!normalizedLead) return null

    return calculateAnalysis(
      normalizedLead,
      comps,
      deal
    )
  }, [normalizedLead, comps, deal])

  async function handleUpdateStage(nextStage: string) {
    if (!leadId || savingStage) return

    setSavingStage(true)

    /*
     * IMPORTANT:
     *
     * `status` is the canonical pipeline field.
     * We intentionally do NOT update stage, lead_status,
     * deal_status, or pipeline_stage.
     */
    const { data, error } = await supabase
      .from('leads')
      .update({
        status: nextStage,
      })
      .eq('id', leadId)
      .select('*')
      .single()

    if (error) {
      console.error('Failed to update lead status:', error)

      alert(
        `Unable to update lead status.\n\n${error.message}`
      )

      setSavingStage(false)
      return
    }

    setLead(data as LeadRecord)
    setSavingStage(false)
  }

  async function handleDeleteLead() {
    if (!leadId) return

    if (
      !confirm(
        'Are you sure you want to permanently delete this lead?'
      )
    ) {
      return
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      alert(
        `Failed to delete lead: ${error.message}`
      )
      return
    }

    router.push('/leads')
  }

  if (loading) {
    return (
      <PageShell
        title="Lead Workspace"
        subtitle="Loading property intelligence..."
      >
        <SectionCard title="Loading">
          <div style={loadingStyle}>
            Loading lead...
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  if (!normalizedLead || !analysis) {
    return (
      <PageShell
        title="Lead Workspace"
        subtitle="Lead could not be found."
      >
        <SectionCard title="Lead Not Found">
          <Link href="/leads">
            <ActionButton tone="gold">
              Back to Leads
            </ActionButton>
          </Link>
        </SectionCard>
      </PageShell>
    )
  }

  const address =
    normalizedLead.property_address_1 ||
    normalizedLead.property_address ||
    'Unknown Property'

  const location = [
    normalizedLead.city,
    normalizedLead.state,
    normalizedLead.zip,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <PageShell
      title="Lead Workspace"
      subtitle="Property intelligence, verified market data, deal analysis, and next actions."
      actions={
        <div style={headerActionsStyle}>
          <select
            value={normalizedLead.status || 'new_lead'}
            onChange={(event) =>
              void handleUpdateStage(
                event.target.value
              )
            }
            disabled={savingStage}
            style={stageSelectStyle}
          >
            {STAGE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {savingStage
                  ? 'Saving...'
                  : option.label}
              </option>
            ))}
          </select>

          <ActionButton
            compact
            tone="danger"
            onClick={handleDeleteLead}
          >
            Delete
          </ActionButton>
        </div>
      }
    >
      <div style={pageGridStyle}>
        <div style={mainColumnStyle}>
          <SectionCard
            title={address}
            subtitle={location || 'Location unavailable'}
            actions={
              <span style={statusBadgeStyle}>
                {stageLabel(
                  normalizedLead.status ||
                    'new_lead'
                )}
              </span>
            }
          >
            <div style={heroGridStyle}>
              <Metric
                label="Lead Strength"
                value={
                  analysis.overall === null
                    ? '—'
                    : String(analysis.overall)
                }
                detail={analysis.label}
                tone="gold"
              />

              <Metric
                label="Motivation"
                value={
                  analysis.motivation === null
                    ? '—'
                    : String(analysis.motivation)
                }
                detail={
                  analysis.motivation >= 75
                    ? 'High'
                    : analysis.motivation >= 45
                      ? 'Moderate'
                      : 'Limited'
                }
                tone="green"
              />

              <Metric
                label="Contactability"
                value={
                  analysis.contactability === null
                    ? '—'
                    : String(
                        analysis.contactability
                      )
                }
                detail={
                  analysis.contactability >= 75
                    ? 'Strong'
                    : analysis.contactability >= 40
                      ? 'Partial'
                      : 'Limited'
                }
                tone="blue"
              />

              <Metric
                label="Marketability"
                value={
                  analysis.marketability === null
                    ? '—'
                    : String(
                        analysis.marketability
                      )
                }
                detail={
                  comps.length > 0
                    ? 'Verified comps'
                    : 'Insufficient market data'
                }
                tone="green"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Deal Analysis"
            subtitle="Calculations only use verified values. Missing inputs remain unavailable."
          >
            <div style={dealGridStyle}>
              <DealValue
                label="ARV"
                value={money(deal.arv)}
                tone="green"
              />

              <DealValue
                label="Repairs"
                value={money(deal.repairs)}
                tone="gold"
              />

              <DealValue
                label="Buy %"
                value={`${deal.buyPercent}%`}
                tone="blue"
              />

              <DealValue
                label="Assignment Fee"
                value={money(deal.assignmentFee)}
                tone="gold"
              />

              <DealValue
                label="MAO"
                value={money(deal.mao)}
                tone="green"
              />

              <DealValue
                label="Seller Price"
                value={money(deal.sellerPrice)}
                tone="blue"
              />

              <DealValue
                label="Potential Spread"
                value={money(deal.spread)}
                tone={
                  deal.spread !== null &&
                  deal.spread > 0
                    ? 'green'
                    : 'red'
                }
              />
            </div>

            <div style={verificationBoxStyle}>
              <strong>
                {compsLoading
                  ? 'Searching verified comps...'
                  : compsMessage ||
                    'Market verification pending.'}
              </strong>

              {deal.arv === null ? (
                <span>
                  ARV is intentionally unavailable until
                  qualifying sold comps are verified.
                </span>
              ) : (
                <span>
                  ARV is based on the median verified
                  comparable sale price returned by the
                  market-data service.
                </span>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Lead Intelligence"
            subtitle="Evidence-based analysis of the actual information available for this property."
          >
            <div style={analysisHeroStyle}>
              <div>
                <div style={eyebrowStyle}>
                  Overall Opportunity
                </div>

                <div style={analysisScoreStyle}>
                  {analysis.overall === null
                    ? '—'
                    : analysis.overall}
                </div>

                <div style={analysisLabelStyle}>
                  {analysis.label}
                </div>
              </div>

              <div style={confidenceBoxStyle}>
                <div style={eyebrowStyle}>
                  Analysis Confidence
                </div>

                <strong>
                  {analysis.confidence}%
                </strong>
              </div>
            </div>

            <p style={analysisTextStyle}>
              {analysis.explanation}
            </p>

            {analysis.evidence.length > 0 && (
              <div style={evidenceGridStyle}>
                {analysis.evidence.map(
                  (item, index) => (
                    <div
                      key={`${item}-${index}`}
                      style={evidenceItemStyle}
                    >
                      ✓ {item}
                    </div>
                  )
                )}
              </div>
            )}

            {analysis.warnings.length > 0 && (
              <div style={warningStyle}>
                <strong>
                  Data limitations
                </strong>

                {analysis.warnings.map(
                  (warning, index) => (
                    <div
                      key={`${warning}-${index}`}
                    >
                      {warning}
                    </div>
                  )
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Property Details"
            subtitle="Verified and imported property information."
          >
            <div style={propertyGridStyle}>
              <Info
                label="Owner"
                value={
                  normalizedLead.owner_name ||
                  'Not available'
                }
              />

              <Info
                label="Bedrooms"
                value={
                  normalizedLead.bedrooms != null
                    ? String(
                        normalizedLead.bedrooms
                      )
                    : '—'
                }
              />

              <Info
                label="Bathrooms"
                value={
                  normalizedLead.bathrooms != null
                    ? String(
                        normalizedLead.bathrooms
                      )
                    : '—'
                }
              />

              <Info
                label="Square Feet"
                value={
                  normalizedLead.square_feet != null
                    ? normalizedLead.square_feet.toLocaleString()
                    : '—'
                }
              />

              <Info
                label="Year Built"
                value={
                  normalizedLead.year_built != null
                    ? String(
                        normalizedLead.year_built
                      )
                    : '—'
                }
              />

              <Info
                label="County"
                value={
                  normalizedLead.county || '—'
                }
              />

              <Info
                label="APN"
                value={
                  normalizedLead.apn || '—'
                }
              />

              <Info
                label="Ownership"
                value={
                  normalizedLead.ownership_length !=
                  null
                    ? `${Math.round(
                        normalizedLead.ownership_length
                      )} years`
                    : '—'
                }
              />

              <Info
                label="Occupancy"
                value={
                  normalizedLead.owner_occupied ===
                  true
                    ? 'Owner Occupied'
                    : normalizedLead.owner_occupied ===
                        false
                      ? 'Absentee'
                      : 'Unknown'
                }
              />

              <Info
                label="Equity"
                value={money(
                  normalizedLead.equity_amount
                )}
              />

              <Info
                label="Equity %"
                value={percent(
                  normalizedLead.equity_percent
                )}
              />

              <Info
                label="Mortgage"
                value={money(
                  normalizedLead.mortgage_balance
                )}
              />

              <Info
                label="Last Sale"
                value={money(
                  normalizedLead.last_sale_amount
                )}
              />

              <Info
                label="Last Sale Date"
                value={
                  normalizedLead.last_sale_date ||
                  '—'
                }
              />

              <Info
                label="Default"
                value={money(
                  normalizedLead.default_amount
                )}
              />

              <Info
                label="Auction"
                value={
                  normalizedLead.auction_date ||
                  '—'
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Verified Comparable Sales"
            subtitle="Target: sold properties within 1 mile during the previous 6 months."
          >
            {compsLoading ? (
              <div style={loadingStyle}>
                Searching real comparable sales...
              </div>
            ) : comps.length === 0 ? (
              <div style={emptyStateStyle}>
                <strong>
                  No verified comps available
                </strong>

                <span>
                  ARV will remain unavailable until
                  qualifying real sold-property data
                  is returned.
                </span>
              </div>
            ) : (
              <div style={compListStyle}>
                {comps.map((comp, index) => (
                  <div
                    key={
                      comp.id ||
                      `${comp.address}-${index}`
                    }
                    style={compStyle}
                  >
                    <div>
                      <strong>
                        {comp.address ||
                          'Unknown address'}
                      </strong>

                      <div
                        style={smallTextStyle}
                      >
                        {[
                          comp.city,
                          comp.state,
                        ]
                          .filter(Boolean)
                          .join(', ') ||
                          'Location unavailable'}
                      </div>
                    </div>

                    <div style={compStatsStyle}>
                      <span>
                        {money(
                          comp.sold_price
                        )}
                      </span>

                      <small>
                        {comp.sale_date ||
                          'Date unavailable'}
                      </small>

                      {comp.distance_miles !=
                        null && (
                        <small>
                          {comp.distance_miles.toFixed(
                            2
                          )}{' '}
                          mi
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Owner Contact"
            subtitle="Available contact information."
          >
            <div style={contactGridStyle}>
              <Info
                label="Phone"
                value={
                  normalizedLead.owner_phone ||
                  'Not available'
                }
              />

              <Info
                label="Email"
                value={
                  normalizedLead.owner_email ||
                  'Not available'
                }
              />

              <Info
                label="Mailing Address"
                value={
                  [
                    normalizedLead.owner_mailing_address,
                    normalizedLead.owner_mailing_city,
                    normalizedLead.owner_mailing_state,
                    normalizedLead.owner_mailing_zip,
                  ]
                    .filter(Boolean)
                    .join(', ') ||
                  'Not available'
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Deal Tools"
            subtitle="Continue analysis without leaving the lead."
          >
            <div style={toolsGridStyle}>
              <Tool
                href={`/tools/comps-analyzer?leadId=${encodeURIComponent(
                  leadId
                )}`}
                title="Comps Analyzer"
                description="Review comparable sales."
              />

              <Tool
                href={`/tools/repair-estimator?leadId=${encodeURIComponent(
                  leadId
                )}`}
                title="Repair Estimator"
                description="Build a verified repair budget."
              />

              <Tool
                href={`/tools/contract-generator?leadId=${encodeURIComponent(
                  leadId
                )}`}
                title="Contract Generator"
                description="Prepare purchase documents."
              />

              <Tool
                href={`/tools/assignment-contract?leadId=${encodeURIComponent(
                  leadId
                )}`}
                title="Assignment Contract"
                description="Structure the assignment."
              />
            </div>
          </SectionCard>
        </div>

        <aside style={sideColumnStyle}>
          <WorkspaceCanvas
            leadId={leadId}
            leadTitle={address}
          />
        </aside>
      </div>
    </PageShell>
  )
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'gold' | 'green' | 'blue'
}) {
  const color =
    tone === 'gold'
      ? '#d6a64b'
      : tone === 'green'
        ? '#4ade80'
        : '#93c5fd'

  return (
    <div style={metricStyle}>
      <div style={eyebrowStyle}>
        {label}
      </div>

      <strong
        style={{
          fontSize: 30,
          color,
        }}
      >
        {value}
      </strong>

      <span style={smallTextStyle}>
        {detail}
      </span>
    </div>
  )
}

function DealValue({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'gold' | 'green' | 'blue' | 'red'
}) {
  const color =
    tone === 'gold'
      ? '#d6a64b'
      : tone === 'green'
        ? '#4ade80'
        : tone === 'blue'
          ? '#93c5fd'
          : '#ef4444'

  return (
    <div style={dealValueStyle}>
      <span style={eyebrowStyle}>
        {label}
      </span>

      <strong
        style={{
          color,
          fontSize: 20,
        }}
      >
        {value}
      </strong>
    </div>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={infoStyle}>
      <span style={eyebrowStyle}>
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  )
}

function Tool({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link href={href} style={toolStyle}>
      <strong>{title}</strong>
      <span>{description}</span>
      <b>Open →</b>
    </Link>
  )
}

const pageGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1.25fr) minmax(320px, .75fr)',
  gap: 18,
  alignItems: 'start',
}

const mainColumnStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
  minWidth: 0,
}

const sideColumnStyle: CSSProperties = {
  minWidth: 0,
  position: 'sticky',
  top: 18,
}

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const stageSelectStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 12px',
  borderRadius: 9,
  border:
    '1px solid rgba(214,166,75,.35)',
  background: 'rgba(214,166,75,.10)',
  color: '#e0b84f',
  fontSize: 12,
  fontWeight: 800,
  outline: 'none',
}

const statusBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  padding: '5px 9px',
  borderRadius: 999,
  background: 'rgba(214,166,75,.10)',
  border:
    '1px solid rgba(214,166,75,.25)',
  color: '#e0b84f',
  fontSize: 10,
  fontWeight: 800,
}

const heroGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(150px,1fr))',
  gap: 10,
}

const metricStyle: CSSProperties = {
  padding: 15,
  borderRadius: 14,
  border:
    '1px solid rgba(255,255,255,.07)',
  background: 'rgba(255,255,255,.025)',
  display: 'grid',
  gap: 5,
}

const dealGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(150px,1fr))',
  gap: 10,
}

const dealValueStyle: CSSProperties = {
  padding: 14,
  borderRadius: 13,
  border:
    '1px solid rgba(255,255,255,.07)',
  background: 'rgba(255,255,255,.025)',
  display: 'grid',
  gap: 6,
}

const verificationBoxStyle: CSSProperties = {
  marginTop: 12,
  padding: 13,
  borderRadius: 12,
  border:
    '1px solid rgba(147,197,253,.16)',
  background: 'rgba(147,197,253,.04)',
  display: 'grid',
  gap: 5,
  fontSize: 12,
  color: 'rgba(255,255,255,.58)',
}

const analysisHeroStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  padding: 18,
  borderRadius: 16,
  border:
    '1px solid rgba(214,166,75,.22)',
  background:
    'linear-gradient(135deg,rgba(31,25,14,.9),rgba(8,7,4,.98))',
}

const analysisScoreStyle: CSSProperties = {
  fontSize: 46,
  lineHeight: 1,
  fontWeight: 900,
  color: '#d6a64b',
  marginTop: 5,
}

const analysisLabelStyle: CSSProperties = {
  color: '#fff',
  fontWeight: 800,
  fontSize: 13,
  marginTop: 5,
}

const confidenceBoxStyle: CSSProperties = {
  minWidth: 110,
  textAlign: 'right',
}

const analysisTextStyle: CSSProperties = {
  margin: '14px 0 0',
  color: 'rgba(255,255,255,.62)',
  fontSize: 13,
  lineHeight: 1.6,
}

const evidenceGridStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
  marginTop: 14,
}

const evidenceItemStyle: CSSProperties = {
  padding: '9px 11px',
  borderRadius: 9,
  background: 'rgba(74,222,128,.05)',
  border:
    '1px solid rgba(74,222,128,.12)',
  color: 'rgba(255,255,255,.70)',
  fontSize: 12,
}

const warningStyle: CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 11,
  background: 'rgba(239,68,68,.06)',
  border:
    '1px solid rgba(239,68,68,.18)',
  color: 'rgba(255,255,255,.65)',
  display: 'grid',
  gap: 5,
  fontSize: 12,
}

const propertyGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(155px,1fr))',
  gap: 9,
}

const infoStyle: CSSProperties = {
  minWidth: 0,
  padding: 11,
  borderRadius: 11,
  border:
    '1px solid rgba(255,255,255,.06)',
  background: 'rgba(255,255,255,.02)',
  display: 'grid',
  gap: 5,
}

const contactGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(200px,1fr))',
  gap: 10,
}

const compListStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
}

const compStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 15,
  padding: 12,
  borderRadius: 12,
  border:
    '1px solid rgba(255,255,255,.06)',
  background: 'rgba(255,255,255,.02)',
}

const compStatsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  flexDirection: 'column',
  gap: 3,
}

const smallTextStyle: CSSProperties = {
  color: 'rgba(255,255,255,.48)',
  fontSize: 11,
  lineHeight: 1.4,
}

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 13,
  border:
    '1px solid rgba(255,255,255,.07)',
  background: 'rgba(255,255,255,.02)',
  display: 'grid',
  gap: 5,
  color: 'rgba(255,255,255,.62)',
  fontSize: 12,
}

const toolsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(190px,1fr))',
  gap: 10,
}

const toolStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  padding: 14,
  borderRadius: 13,
  border:
    '1px solid rgba(214,166,75,.16)',
  background:
    'linear-gradient(180deg,rgba(31,25,14,.6),rgba(8,7,4,.9))',
  display: 'grid',
  gap: 6,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '.1em',
  color: 'rgba(255,255,255,.40)',
  fontWeight: 700,
}

const loadingStyle: CSSProperties = {
  minHeight: 120,
  display: 'grid',
  placeItems: 'center',
  color: 'rgba(255,255,255,.5)',
}