'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ActionButton from '@/components/ui/action-button'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import WorkspaceCanvas from '@/components/workspace-canvas'
import { supabase } from '@/lib/supabase'
import { computeLeadScores } from '@/lib/intelligence/lead-score-v2'
import { resolveField, resolveNumericField } from '@/lib/resolve-field'
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
  phone?: string | null
  owner_email?: string | null
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
  deal_status?: string | null
  pipeline_stage?: string | null
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

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'

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
  if (value === null || value === undefined) return '—'
  return value ? positive : negative
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function toText(value: unknown) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()
  return text.length ? text : null
}

function toBoolean(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value

  const text = String(value).trim().toLowerCase()

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

function getNestedText(
  lead: LeadRecord,
  keys: string[]
) {
  const sources = [
    lead as Record<string, unknown>,
    (lead.lead_intelligence || {}) as Record<string, unknown>,
    (lead.raw_import_data || {}) as Record<string, unknown>,
    (lead.source_columns || {}) as Record<string, unknown>,
  ]

  for (const source of sources) {
    for (const key of keys) {
      const value = toText(source[key])
      if (value) return value
    }
  }

  return null
}

function getOwnerPhone(lead: LeadRecord) {
  return getNestedText(lead, [
    'owner_phone',
    'owner_phone_number',
    'phone',
    'phone_number',
    'primary_phone',
    'contact_phone',
    'mobile_phone',
    'telephone',
  ])
}

function getOwnerEmail(lead: LeadRecord) {
  return getNestedText(lead, [
    'owner_email',
    'email',
    'email_address',
    'owner_email_address',
    'primary_email',
    'contact_email',
  ])
}

function debugBedroomSource(lead: LeadRecord) {
  const checks = [
    ['lead.bedrooms', lead.bedrooms],
    [
      'lead.lead_intelligence.bedrooms',
      (lead.lead_intelligence as any)?.bedrooms,
    ],
    [
      'lead.raw_import_data.bedrooms',
      (lead.raw_import_data as any)?.bedrooms,
    ],
    [
      'lead.raw_import_data.beds',
      (lead.raw_import_data as any)?.beds,
    ],
    [
      'lead.raw_import_data.bedroom_count',
      (lead.raw_import_data as any)?.bedroom_count,
    ],
    [
      'lead.raw_import_data.nbr_beds',
      (lead.raw_import_data as any)?.nbr_beds,
    ],
    [
      'lead.source_columns.bedrooms',
      (lead.source_columns as any)?.bedrooms,
    ],
    [
      'lead.source_columns.beds',
      (lead.source_columns as any)?.beds,
    ],
  ]

  return (
    checks.find(
      ([, value]) =>
        value !== undefined && value !== null && value !== ''
    ) || null
  )
}

const TOOL_LINKS = [
  {
    slug: 'comps-analyzer',
    name: 'Comps Analyzer',
    description: 'Analyze sales and estimate ARV.',
    icon: '⌁',
    tone: 'gold',
  },
  {
    slug: 'repair-estimator',
    name: 'Repair Estimator',
    description: 'Build a renovation budget.',
    icon: '⌂',
    tone: 'gold',
  },
  {
    slug: 'closing-cost',
    name: 'Closing Costs',
    description: 'Estimate transaction costs.',
    icon: '$',
    tone: 'blue',
  },
  {
    slug: 'assignment-contract',
    name: 'Assignment',
    description: 'Build an assignment workspace.',
    icon: '▣',
    tone: 'gold',
  },
  {
    slug: 'contract-generator',
    name: 'Contract',
    description: 'Prepare purchase contract terms.',
    icon: '▤',
    tone: 'gold',
  },
  {
    slug: 'buyer-blast',
    name: 'Buyer Blast',
    description: 'Match and contact buyers.',
    icon: '◈',
    tone: 'green',
  },
  {
    slug: 'marketing-roi',
    name: 'Marketing ROI',
    description: 'Track marketing performance.',
    icon: '%',
    tone: 'green',
  },
  {
    slug: 'script-generator',
    name: 'Scripts',
    description: 'Create seller and buyer scripts.',
    icon: '✎',
    tone: 'blue',
  },
] as const

export default function LeadWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const leadId = String(params?.leadId || '')

  const [lead, setLead] = useState<LeadRecord | null>(null)
  const [loading, setLoading] = useState(true)

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
        console.error(error)
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
    if (!lead) return null

    const resolvedBeds =
      resolveNumericField(
        lead as any,
        FIELD_ALIASES.beds,
        null,
        {
          treatZeroAsMissing: true,
          min: 1,
        }
      ) ??
      toNumber(lead.bedrooms) ??
      toNumber((lead.lead_intelligence as any)?.bedrooms) ??
      toNumber((lead.raw_import_data as any)?.bedrooms) ??
      toNumber((lead.raw_import_data as any)?.beds) ??
      toNumber((lead.source_columns as any)?.bedrooms) ??
      toNumber((lead.source_columns as any)?.beds)

    const baths = resolveNumericField(
      lead as any,
      FIELD_ALIASES.baths,
      null,
      {
        treatZeroAsMissing: false,
        min: 0,
      }
    )

    const sqft = resolveNumericField(
      lead as any,
      FIELD_ALIASES.sqft,
      null,
      {
        treatZeroAsMissing: true,
        min: 1,
      }
    )

    const ownerName =
      toText(resolveField(lead as any, FIELD_ALIASES.ownerName)) ||
      toText((lead.lead_intelligence as any)?.owner_name) ||
      lead.owner_name

    const ownerPhone = getOwnerPhone(lead)
    const ownerEmail = getOwnerEmail(lead)

    const ownerOccupied =
      toBoolean(
        resolveField(lead as any, FIELD_ALIASES.ownerOccupied)
      ) ??
      toBoolean(
        (lead.lead_intelligence as any)?.owner_occupied
      ) ??
      lead.owner_occupied

    const lastSaleDate =
      toText(
        resolveField(
          lead as any,
          FIELD_ALIASES.lastSaleDate
        )
      ) ||
      toText(
        (lead.lead_intelligence as any)?.last_sale_date
      ) ||
      lead.last_sale_date

    const estimatedValue =
      toNumber(
        resolveField(
          lead as any,
          FIELD_ALIASES.estimatedValue
        )
      ) ??
      toNumber(
        (lead.lead_intelligence as any)?.house_value
      ) ??
      toNumber(
        (lead.lead_intelligence as any)?.estimated_value
      ) ??
      toNumber(
        (lead.lead_intelligence as any)?.market_value
      ) ??
      lead.house_value ??
      lead.estimated_value ??
      lead.market_value

    const ownershipYears = computeOwnershipYears({
      ...lead,
      last_sale_date: lastSaleDate,
    })

    const currentStage =
      lead.status ||
      lead.stage ||
      lead.lead_status ||
      lead.deal_status ||
      lead.pipeline_stage ||
      'new_lead'

    return {
      ...lead,
      stage: currentStage,
      bedrooms: resolvedBeds ?? null,
      bathrooms: baths ?? null,
      square_feet: sqft ?? null,
      owner_name: ownerName ?? null,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      owner_occupied: ownerOccupied,
      last_sale_date: lastSaleDate ?? null,
      ownership_length:
        ownershipYears ?? lead.ownership_length ?? null,
      resolved_value: estimatedValue ?? null,
      bed_debug_source: debugBedroomSource(lead),
    }
  }, [lead])

  const scores = useMemo(() => {
    if (!normalizedLead) return null
    return computeLeadScores(normalizedLead as any)
  }, [normalizedLead])

  async function handleUpdateStage(nextStage: string) {
    if (!leadId) return

    const payload = {
      status: nextStage,
      stage: nextStage,
      lead_status: nextStage,
      deal_status: nextStage,
      pipeline_stage: nextStage,
    }

    const { error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', leadId)

    if (error) {
      alert(`Failed to update stage: ${error.message}`)
      return
    }

    setLead((curr) =>
      curr ? { ...curr, ...payload } : null
    )
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
      alert(`Failed to delete lead: ${error.message}`)
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
                color: 'rgba(255,255,255,0.5)',
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

  if (!normalizedLead || !scores) {
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
      .join(', ') || 'No city/state/zip'

  const contactCount =
    Number(Boolean(normalizedLead.owner_phone)) +
    Number(Boolean(normalizedLead.owner_email))

  const contactStatus =
    contactCount === 2
      ? 'Phone + email available'
      : contactCount === 1
        ? 'One contact method available'
        : 'No phone or email found'

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
              onChange={(e) =>
                handleUpdateStage(e.target.value)
              }
              style={workspaceSelectStyle}
            >
              {STAGE_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  style={optionStyle}
                >
                  Stage: {opt.label}
                </option>
              ))}
            </select>

            <ActionButton
              compact
              tone="danger"
              onClick={handleDeleteLead}
            >
              Delete Lead
            </ActionButton>
          </div>

          <StatPill
            label="Strength"
            value={scores.overall.score}
          />

          <StatPill
            label="Motivation"
            value={scores.motivation.score}
          />

          <StatPill
            label="Contact"
            value={scores.contactability.score}
          />

          <StatPill
            label="Market"
            value={scores.marketability.score}
          />
        </>
      }
    >
      <div style={pageGridStyle}>
        <div style={leftRailStyle}>
          <SectionCard
            title={
              normalizedLead.property_address_1 ||
              'Unknown property'
            }
            subtitle={addressLine}
            actions={
              <span style={typeBadgeStyle}>
                {normalizedLead.lead_type || 'standard'}
              </span>
            }
          >
            <div style={heroSignalGridStyle}>
              <HeroSignal
                label="House Value"
                value={money(topValue)}
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
                  normalizedLead.last_sale_date || '—'
                }
                tone="ice"
              />

              <HeroSignal
                label="Owner"
                value={
                  normalizedLead.owner_name || '—'
                }
                tone="green"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Owner Contact"
            subtitle="Available contact information for the property owner."
          >
            <div style={contactGridStyle}>
              <ContactTile
                label="Owner"
                value={
                  normalizedLead.owner_name || '—'
                }
              />

              <ContactTile
                label="Phone"
                value={
                  normalizedLead.owner_phone ||
                  'Not available'
                }
                href={
                  normalizedLead.owner_phone
                    ? `tel:${normalizedLead.owner_phone}`
                    : undefined
                }
              />

              <ContactTile
                label="Email"
                value={
                  normalizedLead.owner_email ||
                  'Not available'
                }
                href={
                  normalizedLead.owner_email
                    ? `mailto:${normalizedLead.owner_email}`
                    : undefined
                }
              />

              <ContactTile
                label="Contact Status"
                value={contactStatus}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Property Signals"
            subtitle="Key property information used for underwriting and scoring."
          >
            <div style={propertyGridStyle}>
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
                value={normalizedLead.apn || '—'}
                tone="ice"
              />

              <InfoTile
                label="County"
                value={normalizedLead.county || '—'}
                tone="green"
              />

              <InfoTile
                label="Bedrooms"
                value={
                  normalizedLead.bedrooms !== null &&
                  normalizedLead.bedrooms !== undefined
                    ? String(normalizedLead.bedrooms)
                    : '—'
                }
                tone="gold"
              />

              <InfoTile
                label="Bathrooms"
                value={
                  normalizedLead.bathrooms !== null &&
                  normalizedLead.bathrooms !== undefined
                    ? String(normalizedLead.bathrooms)
                    : '—'
                }
                tone="gold"
              />

              <InfoTile
                label="Square Feet"
                value={
                  normalizedLead.square_feet
                    ? String(normalizedLead.square_feet)
                    : '—'
                }
                tone="ice"
              />

              <InfoTile
                label="Year Built"
                value={
                  normalizedLead.year_built
                    ? String(normalizedLead.year_built)
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
                  normalizedLead.vacant === true
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
                  normalizedLead.auction_date || '—'
                }
                tone="gold"
              />

              <InfoTile
                label="Lender"
                value={
                  normalizedLead.lender_name || '—'
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
                    .join(', ') || '—'
                }
                tone="green"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Lead Strength Summary"
            subtitle="A quick read on how actionable this lead is right now."
          >
            <div style={strengthSummaryStyle}>
              <div style={strengthMainStyle}>
                <div style={infoLabelStyle}>
                  OVERALL LEAD STRENGTH
                </div>

                <div style={strengthNumberStyle}>
                  {scores.overall.score}
                </div>

                <div style={strengthScaleStyle}>
                  Out of 100
                </div>
              </div>

              <div style={strengthDetailsStyle}>
                <StrengthRow
                  label="Motivation"
                  score={scores.motivation.score}
                  reason={scores.motivation.reason}
                />

                <StrengthRow
                  label="Contactability"
                  score={scores.contactability.score}
                  reason={scores.contactability.reason}
                />

                <StrengthRow
                  label="Marketability"
                  score={scores.marketability.score}
                  reason={scores.marketability.reason}
                />

                <div style={contactSummaryStyle}>
                  <span style={contactDotStyle} />
                  <span>{contactStatus}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={rightRailStyle}>
          <SectionCard
            title="Deal Tools"
            subtitle="Run analysis and build deal documents directly from this lead."
          >
            <div style={toolGridStyle}>
              {TOOL_LINKS.map((tool) => {
                const href =
                  tool.slug === 'comps-analyzer'
                    ? `/tools/${tool.slug}?leadId=${encodeURIComponent(
                        normalizedLead.id
                      )}`
                    : `/tools/${tool.slug}?leadId=${encodeURIComponent(
                        normalizedLead.id
                      )}`

                return (
                  <Link
                    key={tool.slug}
                    href={href}
                    style={toolLinkStyle}
                  >
                    <ToolButton
                      name={tool.name}
                      description={tool.description}
                      icon={tool.icon}
                      tone={tool.tone}
                    />
                  </Link>
                )
              })}
            </div>
          </SectionCard>

          <WorkspaceCanvas
            leadId={normalizedLead.id}
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
          border: 'rgba(214,166,75,0.25)',
          bg: 'linear-gradient(180deg, rgba(30,24,14,0.8), rgba(12,10,6,0.9))',
          text: '#d6a64b',
        }
      : tone === 'ice'
        ? {
            border: 'rgba(147,197,253,0.22)',
            bg: 'linear-gradient(180deg, rgba(16,22,30,0.8), rgba(6,10,14,0.9))',
            text: '#93c5fd',
          }
        : {
            border: 'rgba(74,222,128,0.22)',
            bg: 'linear-gradient(180deg, rgba(14,28,18,0.8), rgba(6,12,8,0.9))',
            text: '#4ade80',
          }

  return (
    <div
      style={{
        ...heroSignalStyle,
        borderColor: palette.border,
        background: palette.bg,
      }}
    >
      <div style={infoLabelStyle}>{label}</div>

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
          border: 'rgba(214,166,75,0.18)',
          bg: 'rgba(214,166,75,0.05)',
          text: '#f0ca7e',
        }
      : tone === 'ice'
        ? {
            border: 'rgba(147,197,253,0.18)',
            bg: 'rgba(147,197,253,0.05)',
            text: '#dcecff',
          }
        : {
            border: 'rgba(74,222,128,0.18)',
            bg: 'rgba(74,222,128,0.05)',
            text: '#bbf7d0',
          }

  return (
    <div
      style={{
        ...infoTileStyle,
        borderColor: palette.border,
        background: palette.bg,
      }}
    >
      <div style={infoLabelStyle}>{label}</div>

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

function ContactTile({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  const content = (
    <div style={contactTileStyle}>
      <div style={infoLabelStyle}>{label}</div>

      <div style={contactValueStyle}>
        {value}
      </div>
    </div>
  )

  if (!href) return content

  return (
    <a
      href={href}
      style={contactLinkStyle}
    >
      {content}
    </a>
  )
}

function StrengthRow({
  label,
  score,
  reason,
}: {
  label: string
  score: number
  reason?: string | null
}) {
  return (
    <div style={strengthRowStyle}>
      <div style={strengthRowTopStyle}>
        <span style={strengthRowLabelStyle}>
          {label}
        </span>

        <span style={strengthRowScoreStyle}>
          {score}
        </span>
      </div>

      <div style={strengthReasonStyle}>
        {reason || 'No explanation provided.'}
      </div>
    </div>
  )
}

function ToolButton({
  name,
  description,
  icon,
  tone,
}: {
  name: string
  description: string
  icon: string
  tone: 'gold' | 'green' | 'blue'
}) {
  const palette =
    tone === 'gold'
      ? {
          border: 'rgba(214,166,75,0.22)',
          background: 'rgba(214,166,75,0.055)',
          icon: '#d6a64b',
        }
      : tone === 'green'
        ? {
            border: 'rgba(74,222,128,0.2)',
            background: 'rgba(74,222,128,0.05)',
            icon: '#4ade80',
          }
        : {
            border: 'rgba(147,197,253,0.2)',
            background: 'rgba(147,197,253,0.05)',
            icon: '#93c5fd',
          }

  return (
    <div
      style={{
        ...toolButtonStyle,
        borderColor: palette.border,
        background: palette.background,
      }}
    >
      <div
        style={{
          ...toolIconStyle,
          color: palette.icon,
          borderColor: palette.border,
        }}
      >
        {icon}
      </div>

      <div style={toolTextStyle}>
        <div style={toolNameStyle}>{name}</div>

        <div style={toolDescriptionStyle}>
          {description}
        </div>
      </div>

      <div
        style={{
          ...toolArrowStyle,
          color: palette.icon,
        }}
      >
        →
      </div>
    </div>
  )
}

const workspaceSelectStyle: CSSProperties = {
  minHeight: 32,
  padding: '0 10px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  outline: 'none',
  cursor: 'pointer',
  border: '1px solid rgba(214,166,75,0.4)',
  background: 'rgba(214,166,75,0.12)',
  color: '#e0b84f',
}

const optionStyle: CSSProperties = {
  background: '#121212',
  color: '#ffffff',
}

const pageGridStyle: CSSProperties = {
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

const rightRailStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: 18,
}

const heroSignalGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 10,
}

const propertyGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
}

const contactGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
}

const contactTileStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(74,222,128,0.18)',
  background: 'rgba(74,222,128,0.045)',
  padding: '11px 12px',
  display: 'grid',
  gap: 5,
}

const contactLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const contactValueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.35,
  color: '#bbf7d0',
  wordBreak: 'break-word',
}

const strengthSummaryStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(140px, 0.45fr) minmax(0, 1fr)',
  gap: 16,
  alignItems: 'stretch',
}

const strengthMainStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(214,166,75,0.25)',
  background:
    'linear-gradient(180deg, rgba(31,25,14,0.92), rgba(8,7,4,0.98))',
  padding: 16,
  display: 'grid',
  alignContent: 'center',
  gap: 6,
}

const strengthNumberStyle: CSSProperties = {
  fontSize: 44,
  lineHeight: 1,
  fontWeight: 900,
  color: '#d6a64b',
  letterSpacing: '-0.04em',
}

const strengthScaleStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.38)',
}

const strengthDetailsStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const strengthRowStyle: CSSProperties = {
  borderRadius: 11,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.025)',
  padding: '9px 11px',
}

const strengthRowTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
}

const strengthRowLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: 'rgba(255,255,255,0.75)',
}

const strengthRowScoreStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: '#d6a64b',
}

const strengthReasonStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 10.5,
  lineHeight: 1.4,
  color: 'rgba(255,255,255,0.42)',
}

const contactSummaryStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  padding: '7px 2px',
  fontSize: 11,
  color: 'rgba(255,255,255,0.48)',
}

const contactDotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: '#4ade80',
  boxShadow: '0 0 10px rgba(74,222,128,0.35)',
}

const toolGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 9,
}

const toolLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const toolButtonStyle: CSSProperties = {
  minHeight: 74,
  borderRadius: 12,
  border: '1px solid transparent',
  padding: 10,
  display: 'grid',
  gridTemplateColumns: '34px minmax(0,1fr) auto',
  alignItems: 'center',
  gap: 9,
  transition:
    'transform 120ms ease, border-color 120ms ease',
}

const toolIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 9,
  border: '1px solid transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 15,
  fontWeight: 900,
}

const toolTextStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: 3,
}

const toolNameStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#fff',
}

const toolDescriptionStyle: CSSProperties = {
  fontSize: 10,
  lineHeight: 1.35,
  color: 'rgba(255,255,255,0.45)',
}

const toolArrowStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
}

const heroSignalStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid transparent',
  padding: '12px 14px',
  display: 'grid',
  gap: 4,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

const infoTileStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid transparent',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const typeBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 8,
  border: '1px solid rgba(214, 166, 75, 0.3)',
  background: 'rgba(214, 166, 75, 0.1)',
  color: '#d6a64b',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const infoLabelStyle: CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.42)',
}

const heroValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
}

const infoValueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 650,
  lineHeight: 1.35,
}

const loadingBoxStyle: CSSProperties = {
  minHeight: 180,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
}

const spinnerStyle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  border: '2px solid rgba(214, 166, 75, 0.2)',
  borderTopColor: '#d6a64b',
  animation: 'spin 0.8s linear infinite',
}