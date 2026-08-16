'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import { useParams, useRouter } from 'next/navigation'

import ActionButton from '@/components/ui/action-button'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import WorkspaceCanvas from '@/components/workspace-canvas'

import { supabase } from '@/lib/supabase'
import { computeLeadScores } from '@/lib/intelligence/lead-score-v2'
import {
  resolveField,
  resolveNumericField,
} from '@/lib/resolve-field'
import { FIELD_ALIASES } from '@/lib/field-aliases'
import { computeOwnershipYears } from '@/lib/compute-fields'

type LeadRecord = {
  id: string

  property_address_1?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  county?: string | null

  owner_name?: string | null
  owner_phone?: string | null
  owner_email?: string | null

  phone?: string | null
  email?: string | null

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
  stage?: string | null
  lead_status?: string | null
  pipeline_stage?: string | null

  /*
   * IMPORTANT:
   *
   * deal_status intentionally removed.
   *
   * Your Supabase error confirms that the leads table
   * does NOT contain a deal_status column.
   */

  lead_type?: string | null

  house_value?: number | null
  estimated_value?: number | null
  market_value?: number | null

  equity_amount?: number | null
  equity_percent?: number | null
  mortgage_balance?: number | null

  last_sale_amount?: number | null
  last_sale_date?: string | null

  default_amount?: number | null
  auction_date?: string | null
  lender_name?: string | null

  ownership_length?: number | null

  owner_occupied?: boolean | null
  vacant?: boolean | null

  lead_intelligence?: Record<string, unknown> | null
  raw_import_data?: Record<string, unknown> | null
  source_columns?: Record<string, unknown> | null

  [key: string]: unknown
}

const STAGE_OPTIONS = [
  {
    value: 'new_lead',
    label: 'New Lead',
  },
  {
    value: 'contacted',
    label: 'Contacted',
  },
  {
    value: 'appointment_set',
    label: 'Appointment Set',
  },
  {
    value: 'offer_sent',
    label: 'Offer Sent',
  },
  {
    value: 'negotiation',
    label: 'Negotiation',
  },
  {
    value: 'under_contract',
    label: 'Under Contract',
  },
  {
    value: 'closed',
    label: 'Closed',
  },
  {
    value: 'dead_lead',
    label: 'Dead / Archive',
  },
]

type StageColumn =
  | 'status'
  | 'stage'
  | 'lead_status'
  | 'pipeline_stage'

const STAGE_COLUMNS: StageColumn[] = [
  'status',
  'stage',
  'lead_status',
  'pipeline_stage',
]

function money(value: number | null | undefined) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return '—'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function yn(
  value: boolean | null | undefined,
  positive = 'Yes',
  negative = 'No'
) {
  if (value === null || value === undefined) {
    return '—'
  }

  return value ? positive : negative
}

function toNumber(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
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

function toText(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  const text = String(value).trim()

  return text.length ? text : null
}

function toBoolean(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'boolean') {
    return value
  }

  const text = String(value)
    .trim()
    .toLowerCase()

  if (
    [
      '1',
      'true',
      'yes',
      'y',
      'occupied',
      'owner occupied',
      'homestead',
      'primary',
    ].includes(text)
  ) {
    return true
  }

  if (
    [
      '0',
      'false',
      'no',
      'n',
      'vacant',
      'non owner occupied',
      'not owner occupied',
    ].includes(text)
  ) {
    return false
  }

  return null
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = toText(value)

    if (text) {
      return text
    }
  }

  return null
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = toNumber(value)

    if (number !== null) {
      return number
    }
  }

  return null
}

/*
 * Determines which stage/status column is actually present
 * on the loaded lead record.
 *
 * This prevents the app from assuming that every possible
 * status column exists in the database.
 */
function getStageColumn(
  lead: LeadRecord
): StageColumn | null {
  for (const column of STAGE_COLUMNS) {
    if (
      Object.prototype.hasOwnProperty.call(
        lead,
        column
      )
    ) {
      return column
    }
  }

  return null
}

/*
 * Gets the current stage from the first usable stage column.
 */
function getCurrentStage(
  lead: LeadRecord
): string {
  for (const column of STAGE_COLUMNS) {
    const value = toText(lead[column])

    if (value) {
      return value
    }
  }

  return 'new_lead'
}

export default function LeadWorkspacePage() {
  const params = useParams()
  const router = useRouter()

  const leadId = String(params?.leadId || '')

  const [lead, setLead] =
    useState<LeadRecord | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [savingStage, setSavingStage] =
    useState(false)

  useEffect(() => {
    async function loadLead() {
      if (!leadId) {
        setLoading(false)
        return
      }

      setLoading(true)

      const {
        data,
        error,
      } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) {
        console.error(
          'Failed to load lead:',
          error
        )

        setLead(null)
        setLoading(false)
        return
      }

      setLead(data as LeadRecord)
      setLoading(false)
    }

    void loadLead()
  }, [leadId])

  const normalizedLead = useMemo(() => {
    if (!lead) {
      return null
    }

    const raw =
      lead.raw_import_data as Record<
        string,
        any
      > | null

    const source =
      lead.source_columns as Record<
        string,
        any
      > | null

    const intelligence =
      lead.lead_intelligence as Record<
        string,
        any
      > | null

    /*
     * BEDROOMS
     */
    const beds =
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
        raw?.bedroom_count,
        raw?.nbr_beds,
        source?.bedrooms,
        source?.beds,
        source?.bedroom_count,
        source?.nbr_beds,
        intelligence?.bedrooms,
        intelligence?.beds
      )

    /*
     * BATHROOMS
     */
    const baths =
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
        raw?.bathroom_count,
        raw?.nbr_baths,
        source?.bathrooms,
        source?.baths,
        source?.bathroom_count,
        source?.nbr_baths,
        intelligence?.bathrooms,
        intelligence?.baths
      )

    /*
     * SQUARE FEET
     */
    const sqft =
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
        raw?.living_area,
        source?.square_feet,
        source?.sqft,
        intelligence?.square_feet,
        intelligence?.sqft
      )

    /*
     * OWNER NAME
     */
    const ownerName =
      firstText(
        resolveField(
          lead as any,
          FIELD_ALIASES.ownerName
        ),
        intelligence?.owner_name,
        lead.owner_name
      ) || null

    /*
     * OWNER PHONE
     */
    const ownerPhone = firstText(
      intelligence?.owner_phone,
      intelligence?.phone,
      raw?.owner_phone,
      raw?.phone,
      raw?.phone_number,
      raw?.primary_phone,
      source?.owner_phone,
      source?.phone,
      source?.phone_number,
      source?.primary_phone,
      lead.owner_phone,
      lead.phone
    )

    /*
     * OWNER EMAIL
     */
    const ownerEmail = firstText(
      intelligence?.owner_email,
      intelligence?.email,
      raw?.owner_email,
      raw?.email,
      raw?.email_address,
      raw?.primary_email,
      source?.owner_email,
      source?.email,
      source?.email_address,
      source?.primary_email,
      lead.owner_email,
      lead.email
    )

    /*
     * OWNER OCCUPIED
     */
    const ownerOccupied =
      toBoolean(
        resolveField(
          lead as any,
          FIELD_ALIASES.ownerOccupied
        )
      ) ??
      toBoolean(
        intelligence?.owner_occupied
      ) ??
      lead.owner_occupied

    /*
     * LAST SALE DATE
     */
    const lastSaleDate =
      firstText(
        resolveField(
          lead as any,
          FIELD_ALIASES.lastSaleDate
        ),
        intelligence?.last_sale_date,
        lead.last_sale_date
      ) || null

    /*
     * ESTIMATED / HOUSE VALUE
     */
    const estimatedValue =
      firstNumber(
        resolveField(
          lead as any,
          FIELD_ALIASES.estimatedValue
        ),
        intelligence?.house_value,
        intelligence?.estimated_value,
        intelligence?.market_value,
        lead.house_value,
        lead.estimated_value,
        lead.market_value
      )

    /*
     * OWNERSHIP YEARS
     */
    const ownershipYears =
      computeOwnershipYears({
        ...lead,
        last_sale_date: lastSaleDate,
      })

    /*
     * CURRENT STAGE
     *
     * We intentionally do NOT reference deal_status.
     */
    const currentStage =
      getCurrentStage(lead)

    /*
     * Determine the actual writable database
     * column for stage updates.
     */
    const stageColumn =
      getStageColumn(lead)

    return {
      ...lead,

      stage: currentStage,

      stage_column: stageColumn,

      bedrooms: beds ?? null,
      bathrooms: baths ?? null,
      square_feet: sqft ?? null,

      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,

      owner_occupied: ownerOccupied,

      last_sale_date: lastSaleDate,

      ownership_length:
        ownershipYears ??
        lead.ownership_length ??
        null,

      resolved_value:
        estimatedValue ?? null,
    }
  }, [lead])

  const scores = useMemo(() => {
    if (!normalizedLead) {
      return null
    }

    return computeLeadScores(
      normalizedLead as any
    )
  }, [normalizedLead])

  /*
   * FIXED STAGE UPDATE
   *
   * The old version attempted to update:
   *
   * status
   * stage
   * lead_status
   * deal_status   <-- DOES NOT EXIST
   * pipeline_stage
   *
   * Supabase rejects the entire update when one column
   * doesn't exist.
   *
   * This version detects the actual stage column and
   * updates ONLY that column.
   */
  async function handleUpdateStage(
    nextStage: string
  ) {
    if (!leadId || !lead) {
      return
    }

    if (savingStage) {
      return
    }

    const stageColumn =
      getStageColumn(lead)

    if (!stageColumn) {
      alert(
        'Could not update stage because no supported stage column was found on the leads table. Expected one of: status, stage, lead_status, or pipeline_stage.'
      )

      return
    }

    setSavingStage(true)

    try {
      const payload: Record<
        string,
        string
      > = {
        [stageColumn]: nextStage,
      }

      console.log(
        'Updating lead stage:',
        {
          leadId,
          stageColumn,
          nextStage,
          payload,
        }
      )

      const {
        error,
      } = await supabase
        .from('leads')
        .update(payload)
        .eq('id', leadId)

      if (error) {
        console.error(
          'Failed to update lead stage:',
          {
            error,
            leadId,
            stageColumn,
            nextStage,
          }
        )

        alert(
          `Failed to update stage: ${error.message}`
        )

        return
      }

      /*
       * Update local state using the SAME column
       * that was successfully written to Supabase.
       */
      setLead((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          [stageColumn]: nextStage,
        }
      })
    } finally {
      setSavingStage(false)
    }
  }

  async function handleDeleteLead() {
    if (!leadId) {
      return
    }

    if (
      !confirm(
        'Are you sure you want to permanently delete this lead?'
      )
    ) {
      return
    }

    const {
      error,
    } = await supabase
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
        subtitle="Loading lead workspace..."
      >
        <SectionCard
          title="Loading"
          subtitle="Pulling uploaded lead intelligence."
        >
          <div style={loadingBoxStyle}>
            <div style={spinnerStyle} />

            <span
              style={{
                color:
                  'rgba(255,255,255,0.5)',
                fontSize: 13,
              }}
            >
              Retrieving property intelligence...
            </span>
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  if (
    !normalizedLead ||
    !scores
  ) {
    return (
      <PageShell
        title="Lead Workspace"
        subtitle="Lead could not be found."
      >
        <SectionCard
          title="Lead not found"
          subtitle="This record could not be loaded."
        >
          <Link href="/leads">
            <ActionButton tone="gold">
              Back to Leads
            </ActionButton>
          </Link>
        </SectionCard>
      </PageShell>
    )
  }

  const topValue =
    normalizedLead.resolved_value ??
    normalizedLead.house_value ??
    normalizedLead.estimated_value ??
    normalizedLead.market_value ??
    null

  const addressLine =
    [
      normalizedLead.city,
      normalizedLead.state,
      normalizedLead.zip,
    ]
      .filter(Boolean)
      .join(', ') ||
    'No city/state/zip'

  const propertyAddress =
    normalizedLead.property_address_1 ||
    'Lead'

  const compsHref =
    `/tools/comps-analyzer?leadId=${encodeURIComponent(
      normalizedLead.id
    )}&address=${encodeURIComponent(
      propertyAddress
    )}`

  const contractHref =
    `/tools/contract-generator?leadId=${encodeURIComponent(
      normalizedLead.id
    )}`

  const assignmentHref =
    `/tools/assignment-contract?leadId=${encodeURIComponent(
      normalizedLead.id
    )}`

  const repairHref =
    `/tools/repair-estimator?leadId=${encodeURIComponent(
      normalizedLead.id
    )}`

  const closingHref =
    `/tools/closing-cost?leadId=${encodeURIComponent(
      normalizedLead.id
    )}`

  return (
    <PageShell
      title="Lead Workspace"
      subtitle="Imported property intelligence and deal thinking surface."
      actions={
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <select
              value={normalizedLead.stage}
              disabled={savingStage}
              onChange={(e) =>
                handleUpdateStage(
                  e.target.value
                )
              }
              style={{
                ...workspaceSelectStyle,
                opacity: savingStage
                  ? 0.6
                  : 1,
              }}
            >
              {STAGE_OPTIONS.map(
                (opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={optionStyle}
                  >
                    Stage: {opt.label}
                  </option>
                )
              )}
            </select>

            <ActionButton
              compact
              tone="danger"
              onClick={
                handleDeleteLead
              }
            >
              Delete Lead
            </ActionButton>
          </div>

          <StatPill
            label="Strength"
            value={
              scores.overall.score
            }
          />

          <StatPill
            label="Motivation"
            value={
              scores.motivation.score
            }
          />

          <StatPill
            label="Contact"
            value={
              scores.contactability
                .score
            }
          />

          <StatPill
            label="Market"
            value={
              scores.marketability.score
            }
          />
        </>
      }
    >
      <div style={pageGridStyle}>
        <div style={leftRailStyle}>
          <SectionCard
            title={propertyAddress}
            subtitle={addressLine}
            actions={
              <span
                style={
                  typeBadgeStyle
                }
              >
                {normalizedLead.lead_type ||
                  'standard'}
              </span>
            }
          >
            <div
              style={
                heroSignalGridStyle
              }
            >
              <HeroSignal
                label="House Value"
                value={money(
                  topValue
                )}
                tone="gold"
              />

              <HeroSignal
                label="Equity"
                value={money(
                  normalizedLead.equity_amount
                )}
                tone="green"
              />

              <HeroSignal
                label="Mortgage Balance"
                value={money(
                  normalizedLead.mortgage_balance
                )}
                tone="ice"
              />

              <HeroSignal
                label="Last Money In"
                value={money(
                  normalizedLead.last_sale_amount
                )}
                tone="gold"
              />

              <HeroSignal
                label="Last Sale Date"
                value={
                  normalizedLead.last_sale_date ||
                  '—'
                }
                tone="ice"
              />

              <HeroSignal
                label="Owner"
                value={
                  normalizedLead.owner_name ||
                  '—'
                }
                tone="green"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Owner Contact"
            subtitle="Contact information available from the imported lead data."
          >
            <div
              style={
                contactGridStyle
              }
            >
              <ContactCard
                label="Owner"
                value={
                  normalizedLead.owner_name ||
                  'Not available'
                }
                tone="green"
              />

              <ContactCard
                label="Phone"
                value={
                  normalizedLead.owner_phone ||
                  'Not available'
                }
                tone="gold"
                href={
                  normalizedLead.owner_phone
                    ? `tel:${normalizedLead.owner_phone}`
                    : undefined
                }
              />

              <ContactCard
                label="Email"
                value={
                  normalizedLead.owner_email ||
                  'Not available'
                }
                tone="ice"
                href={
                  normalizedLead.owner_email
                    ? `mailto:${normalizedLead.owner_email}`
                    : undefined
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Property Signals"
            subtitle="Promoted from uploaded data and used for scoring."
          >
            <div
              style={
                propertyGridStyle
              }
            >
              <InfoTile
                label="Lead Type"
                value={
                  normalizedLead.lead_type ||
                  'standard'
                }
                tone="gold"
              />

              <InfoTile
                label="APN"
                value={
                  normalizedLead.apn ||
                  '—'
                }
                tone="ice"
              />

              <InfoTile
                label="County"
                value={
                  normalizedLead.county ||
                  '—'
                }
                tone="green"
              />

              <InfoTile
                label="Bedrooms"
                value={
                  normalizedLead.bedrooms !==
                    null &&
                  normalizedLead.bedrooms !==
                    undefined
                    ? String(
                        normalizedLead.bedrooms
                      )
                    : '—'
                }
                tone="gold"
              />

              <InfoTile
                label="Bathrooms"
                value={
                  normalizedLead.bathrooms !==
                    null &&
                  normalizedLead.bathrooms !==
                    undefined
                    ? String(
                        normalizedLead.bathrooms
                      )
                    : '—'
                }
                tone="green"
              />

              <InfoTile
                label="Beds / Baths"
                value={`${normalizedLead.bedrooms ?? '—'} / ${
                  normalizedLead.bathrooms ??
                  '—'
                }`}
                tone="gold"
              />

              <InfoTile
                label="Square Feet"
                value={
                  normalizedLead.square_feet
                    ? String(
                        normalizedLead.square_feet
                      )
                    : '—'
                }
                tone="ice"
              />

              <InfoTile
                label="Year Built"
                value={
                  normalizedLead.year_built
                    ? String(
                        normalizedLead.year_built
                      )
                    : '—'
                }
                tone="green"
              />

              <InfoTile
                label="Ownership Length"
                value={
                  normalizedLead.ownership_length
                    ? `${normalizedLead.ownership_length} yrs`
                    : '—'
                }
                tone="gold"
              />

              <InfoTile
                label="Occupied / Vacant"
                value={`${yn(
                  normalizedLead.owner_occupied,
                  'Owner Occupied',
                  'Not Owner Occupied'
                )}${
                  normalizedLead.vacant ===
                  true
                    ? ' · Vacant'
                    : ''
                }`}
                tone="ice"
              />

              <InfoTile
                label="Default Amount"
                value={money(
                  normalizedLead.default_amount
                )}
                tone="green"
              />

              <InfoTile
                label="Auction Date"
                value={
                  normalizedLead.auction_date ||
                  '—'
                }
                tone="gold"
              />

              <InfoTile
                label="Lender"
                value={
                  normalizedLead.lender_name ||
                  '—'
                }
                tone="ice"
              />

              <InfoTile
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
                  '—'
                }
                tone="green"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Lead Strength"
            subtitle="Quick view of the signals that make this lead worth pursuing."
          >
            <div
              style={
                strengthSummaryStyle
              }
            >
              <div
                style={
                  strengthHeroStyle
                }
              >
                <div
                  style={
                    strengthHeroLabelStyle
                  }
                >
                  Overall Lead Strength
                </div>

                <div
                  style={
                    strengthHeroScoreStyle
                  }
                >
                  {
                    scores.overall.score
                  }
                </div>

                <div
                  style={
                    strengthHeroDescriptionStyle
                  }
                >
                  {getStrengthDescription(
                    scores.overall.score
                  )}
                </div>
              </div>

              <div
                style={
                  strengthRowsStyle
                }
              >
                <StrengthRow
                  label="Motivation"
                  score={
                    scores.motivation
                      .score
                  }
                />

                <StrengthRow
                  label="Contactability"
                  score={
                    scores.contactability
                      .score
                  }
                />

                <StrengthRow
                  label="Marketability"
                  score={
                    scores.marketability
                      .score
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Deal Tools"
            subtitle="Run analysis and create deal documents directly from this property."
          >
            <div
              style={
                toolGridStyle
              }
            >
              <LeadTool
                href={compsHref}
                title="Comps Analyzer"
                description="Analyze comparable sales and estimate ARV."
                icon="⌁"
                tone="gold"
              />

              <LeadTool
                href={repairHref}
                title="Repair Estimator"
                description="Build a renovation budget and repair estimate."
                icon="⌂"
                tone="gold"
              />

              <LeadTool
                href={closingHref}
                title="Closing Costs"
                description="Estimate transaction and closing expenses."
                icon="$"
                tone="ice"
              />

              <LeadTool
                href={contractHref}
                title="Contract Generator"
                description="Prepare purchase agreement deal terms."
                icon="▤"
                tone="gold"
              />

              <LeadTool
                href={assignmentHref}
                title="Assignment Contract"
                description="Structure the assignment and assignment fee."
                icon="▣"
                tone="green"
              />

              <LeadTool
                href={`/tools/script-generator?leadId=${encodeURIComponent(
                  normalizedLead.id
                )}`}
                title="Script Generator"
                description="Create a seller call script for this lead."
                icon="✎"
                tone="ice"
              />
            </div>
          </SectionCard>
        </div>

        <div style={rightRailStyle}>
          <WorkspaceCanvas
            leadId={
              normalizedLead.id
            }
            leadTitle={
              normalizedLead.property_address_1 ||
              'Lead'
            }
          />
        </div>
      </div>
    </PageShell>
  )
}

function getStrengthDescription(
  score: number
) {
  if (score >= 90) {
    return 'Excellent lead. Multiple strong signals suggest this property deserves immediate attention.'
  }

  if (score >= 80) {
    return 'Strong lead. The available property and market signals support active follow-up.'
  }

  if (score >= 70) {
    return 'Promising lead. There are enough positive signals to justify further qualification.'
  }

  if (score >= 60) {
    return 'Moderate lead. Additional owner and property information could materially improve the opportunity.'
  }

  return 'Needs qualification. Contact information, motivation, or property data may be limiting the opportunity.'
}

function StrengthRow({
  label,
  score,
}: {
  label: string
  score: number
}) {
  const tone =
    score >= 80
      ? '#4ade80'
      : score >= 60
        ? '#d6a64b'
        : '#93c5fd'

  return (
    <div
      style={
        strengthRowStyle
      }
    >
      <div>
        <div
          style={
            strengthRowLabelStyle
          }
        >
          {label}
        </div>

        <div
          style={
            strengthRowStatusStyle
          }
        >
          {score >= 80
            ? 'Strong'
            : score >= 60
              ? 'Moderate'
              : 'Needs Attention'}
        </div>
      </div>

      <div
        style={{
          ...strengthRowScoreStyle,
          color: tone,
        }}
      >
        {score}
      </div>
    </div>
  )
}

function LeadTool({
  href,
  title,
  description,
  icon,
  tone,
}: {
  href: string
  title: string
  description: string
  icon: string
  tone: 'gold' | 'green' | 'ice'
}) {
  const palette =
    tone === 'gold'
      ? {
          border:
            'rgba(214,166,75,0.22)',
          background:
            'linear-gradient(180deg, rgba(31,25,14,0.82), rgba(8,7,4,0.96))',
          icon: '#d6a64b',
        }
      : tone === 'green'
        ? {
            border:
              'rgba(74,222,128,0.22)',
            background:
              'linear-gradient(180deg, rgba(13,28,18,0.82), rgba(5,10,7,0.96))',
            icon: '#4ade80',
          }
        : {
            border:
              'rgba(147,197,253,0.22)',
            background:
              'linear-gradient(180deg, rgba(15,22,31,0.82), rgba(5,8,12,0.96))',
            icon: '#93c5fd',
          }

  return (
    <Link
      href={href}
      style={{
        ...leadToolLinkStyle,
        borderColor:
          palette.border,
        background:
          palette.background,
      }}
    >
      <div
        style={{
          ...leadToolIconStyle,
          borderColor:
            palette.border,
          color: palette.icon,
        }}
      >
        {icon}
      </div>

      <div
        style={
          leadToolContentStyle
        }
      >
        <div
          style={
            leadToolTitleStyle
          }
        >
          {title}
        </div>

        <div
          style={
            leadToolDescriptionStyle
          }
        >
          {description}
        </div>

        <div
          style={{
            ...leadToolOpenStyle,
            color: palette.icon,
          }}
        >
          Open Tool →
        </div>
      </div>
    </Link>
  )
}

function HeroSignal({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? {
          border:
            'rgba(214,166,75,0.25)',
          bg:
            'linear-gradient(180deg, rgba(30,24,14,0.8), rgba(12,10,6,0.9))',
          text: '#d6a64b',
        }
      : tone === 'ice'
        ? {
            border:
              'rgba(147,197,253,0.22)',
            bg:
              'linear-gradient(180deg, rgba(16,22,30,0.8), rgba(6,10,14,0.9))',
            text: '#93c5fd',
          }
        : {
            border:
              'rgba(74,222,128,0.22)',
            bg:
              'linear-gradient(180deg, rgba(14,28,18,0.8), rgba(6,12,8,0.9))',
            text: '#4ade80',
          }

  return (
    <div
      style={{
        ...heroSignalStyle,
        borderColor:
          palette.border,
        background:
          palette.bg,
      }}
    >
      <div
        style={
          infoLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          ...heroValueStyle,
          color: palette.text,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function InfoTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? {
          border:
            'rgba(214,166,75,0.18)',
          bg:
            'rgba(214,166,75,0.05)',
          text: '#f0ca7e',
        }
      : tone === 'ice'
        ? {
            border:
              'rgba(147,197,253,0.18)',
            bg:
              'rgba(147,197,253,0.05)',
            text: '#dcecff',
          }
        : {
            border:
              'rgba(74,222,128,0.18)',
            bg:
              'rgba(74,222,128,0.05)',
            text: '#bbf7d0',
          }

  return (
    <div
      style={{
        ...infoTileStyle,
        borderColor:
          palette.border,
        background:
          palette.bg,
      }}
    >
      <div
        style={
          infoLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          ...infoValueStyle,
          color: palette.text,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ContactCard({
  label,
  value,
  tone,
  href,
}: {
  label: string
  value: string
  tone: 'gold' | 'ice' | 'green'
  href?: string
}) {
  const palette =
    tone === 'gold'
      ? {
          border:
            'rgba(214,166,75,0.2)',
          bg:
            'rgba(214,166,75,0.05)',
          text: '#f0ca7e',
        }
      : tone === 'ice'
        ? {
            border:
              'rgba(147,197,253,0.2)',
            bg:
              'rgba(147,197,253,0.05)',
            text: '#dcecff',
          }
        : {
            border:
              'rgba(74,222,128,0.2)',
            bg:
              'rgba(74,222,128,0.05)',
            text: '#bbf7d0',
          }

  const content = (
    <>
      <div
        style={
          infoLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          ...contactValueStyle,
          color: palette.text,
        }}
      >
        {value}
      </div>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        style={{
          ...contactCardStyle,
          borderColor:
            palette.border,
          background:
            palette.bg,
        }}
      >
        {content}
      </a>
    )
  }

  return (
    <div
      style={{
        ...contactCardStyle,
        borderColor:
          palette.border,
        background:
          palette.bg,
      }}
    >
      {content}
    </div>
  )
}

const workspaceSelectStyle: CSSProperties =
  {
    minHeight: 32,
    padding: '0 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    outline: 'none',
    cursor: 'pointer',
    border:
      '1px solid rgba(214,166,75,0.4)',
    background:
      'rgba(214,166,75,0.12)',
    color: '#e0b84f',
  }

const optionStyle: CSSProperties = {
  background: '#121212',
  color: '#ffffff',
}

const pageGridStyle: CSSProperties =
  {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
    gap: 18,
    alignItems: 'start',
  }

const leftRailStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
  minWidth: 0,
}

const rightRailStyle: CSSProperties =
  {
    minWidth: 0,
  }

const heroSignalGridStyle: CSSProperties =
  {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
  }

const propertyGridStyle: CSSProperties =
  {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
  }

const contactGridStyle: CSSProperties =
  {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
  }

const toolGridStyle: CSSProperties =
  {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10,
  }

const strengthSummaryStyle: CSSProperties =
  {
    display: 'grid',
    gap: 12,
  }

const strengthHeroStyle: CSSProperties =
  {
    borderRadius: 16,
    border:
      '1px solid rgba(214,166,75,0.24)',
    background:
      'linear-gradient(135deg, rgba(31,25,14,0.9), rgba(8,7,4,0.98))',
    padding: 18,
    display: 'grid',
    gap: 7,
  }

const strengthHeroLabelStyle: CSSProperties =
  {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color:
      'rgba(255,255,255,0.45)',
  }

const strengthHeroScoreStyle: CSSProperties =
  {
    fontSize: 42,
    lineHeight: 1,
    fontWeight: 900,
    color: '#d6a64b',
  }

const strengthHeroDescriptionStyle: CSSProperties =
  {
    fontSize: 12,
    lineHeight: 1.5,
    color:
      'rgba(255,255,255,0.58)',
    maxWidth: 620,
  }

const strengthRowsStyle: CSSProperties =
  {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 10,
  }

const strengthRowStyle: CSSProperties =
  {
    borderRadius: 12,
    border:
      '1px solid rgba(255,255,255,0.07)',
    background:
      'rgba(255,255,255,0.025)',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  }

const strengthRowLabelStyle: CSSProperties =
  {
    fontSize: 12,
    fontWeight: 750,
    color: '#ffffff',
  }

const strengthRowStatusStyle: CSSProperties =
  {
    marginTop: 3,
    fontSize: 10,
    color:
      'rgba(255,255,255,0.4)',
  }

const strengthRowScoreStyle: CSSProperties =
  {
    fontSize: 24,
    fontWeight: 900,
  }

const leadToolLinkStyle: CSSProperties =
  {
    textDecoration: 'none',
    color: 'inherit',
    borderRadius: 14,
    border:
      '1px solid transparent',
    padding: 13,
    display: 'grid',
    gridTemplateColumns:
      '38px minmax(0,1fr)',
    gap: 11,
    minWidth: 0,
  }

const leadToolIconStyle: CSSProperties =
  {
    width: 38,
    height: 38,
    borderRadius: 10,
    border:
      '1px solid transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 17,
    fontWeight: 900,
  }

const leadToolContentStyle: CSSProperties =
  {
    minWidth: 0,
    display: 'grid',
    gap: 5,
  }

const leadToolTitleStyle: CSSProperties =
  {
    fontSize: 13,
    fontWeight: 800,
    color: '#ffffff',
  }

const leadToolDescriptionStyle: CSSProperties =
  {
    fontSize: 10.5,
    lineHeight: 1.45,
    color:
      'rgba(255,255,255,0.48)',
  }

const leadToolOpenStyle: CSSProperties =
  {
    fontSize: 10,
    fontWeight: 800,
    marginTop: 3,
  }

const contactCardStyle: CSSProperties =
  {
    textDecoration: 'none',
    color: 'inherit',
    borderRadius: 12,
    border:
      '1px solid transparent',
    padding: '12px 13px',
    display: 'grid',
    gap: 5,
  }

const contactValueStyle: CSSProperties =
  {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  }

const heroSignalStyle: CSSProperties =
  {
    borderRadius: 14,
    border:
      '1px solid transparent',
    padding: '12px 14px',
    display: 'grid',
    gap: 4,
    backdropFilter:
      'blur(12px)',
    WebkitBackdropFilter:
      'blur(12px)',
  }

const infoTileStyle: CSSProperties =
  {
    borderRadius: 12,
    border:
      '1px solid transparent',
    padding: '10px 12px',
    display: 'grid',
    gap: 4,
  }

const infoLabelStyle: CSSProperties =
  {
    fontSize: 9.5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color:
      'rgba(255,255,255,0.42)',
  }

const heroValueStyle: CSSProperties =
  {
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.01em',
  }

const infoValueStyle: CSSProperties =
  {
    fontSize: 13,
    fontWeight: 650,
    lineHeight: 1.35,
  }

const loadingBoxStyle: CSSProperties =
  {
    minHeight: 180,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  }

const spinnerStyle: CSSProperties =
  {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border:
      '2px solid rgba(214, 166, 75, 0.2)',
    borderTopColor: '#d6a64b',
    animation:
      'spin 0.8s linear infinite',
  }

const typeBadgeStyle: CSSProperties =
  {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 8,
    border:
      '1px solid rgba(214,166,75,0.3)',
    background:
      'rgba(214,166,75,0.1)',
    color: '#d6a64b',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }