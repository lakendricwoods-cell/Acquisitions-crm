'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ComponentType } from 'react'
import { useSearchParams } from 'next/navigation'

import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import WorkspaceCanvas from '@/components/workspace-canvas'

import { supabase } from '@/lib/supabase'
import { getToolConfig, type ToolSlug } from './tool-config'

/* =========================================================
   TYPES
========================================================= */

type Lead = {
  id: string
  property_address_1?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  county?: string | null
  owner_name?: string | null
  property_type?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  square_feet?: number | null
  year_built?: number | null
  apn?: string | null
  lead_type?: string | null
  house_value?: number | null
  estimated_value?: number | null
  market_value?: number | null
  equity_amount?: number | null
  mortgage_balance?: number | null
  last_sale_amount?: number | null
  default_amount?: number | null
}

type NumberInputProps = {
  label: string
  value: number
  onChange: (value: number) => void
  prefix?: string
  suffix?: string
}

type ToolProps = {
  lead: Lead | null
}

/* =========================================================
   COMPS TYPES
========================================================= */

type LeadOption = {
  id: string
  property_address_1?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  square_feet?: number | null
  year_built?: number | null
}

type CompRow = {
  id: string
  salePrice: string
  sqft: string
  beds: string
  baths: string
  year: string
}

type CompResult = {
  arv: number
  averagePricePerSqft: number
  weightedPricePerSqft: number
  compCount: number
}

/* =========================================================
   HELPERS
========================================================= */

function money(value: number) {
  if (!Number.isFinite(value)) return '$0'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function number(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

function leadValue(lead: Lead | null) {
  return (
    lead?.estimated_value ??
    lead?.house_value ??
    lead?.market_value ??
    0
  )
}

function copyText(text: string) {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard
  ) {
    void navigator.clipboard.writeText(text)
  }
}

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

/* =========================================================
   BASIC INPUTS
========================================================= */

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: NumberInputProps) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>

      <div style={inputWrapStyle}>
        {prefix && (
          <span style={prefixStyle}>{prefix}</span>
        )}

        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => {
            const parsed = Number(event.target.value)

            onChange(
              Number.isFinite(parsed) ? parsed : 0
            )
          }}
          style={inputStyle}
        />

        {suffix && (
          <span style={prefixStyle}>{suffix}</span>
        )}
      </div>
    </label>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  )
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={inputStyle}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

/* =========================================================
   RESULT CARD
========================================================= */

function ResultCard({
  label,
  value,
  tone = 'gold',
}: {
  label: string
  value: string
  tone?: 'gold' | 'green' | 'blue'
}) {
  const palette =
    tone === 'gold'
      ? {
          border: 'rgba(214,166,75,0.24)',
          bg: 'rgba(214,166,75,0.06)',
          text: '#d6a64b',
        }
      : tone === 'green'
        ? {
            border: 'rgba(74,222,128,0.22)',
            bg: 'rgba(74,222,128,0.05)',
            text: '#4ade80',
          }
        : {
            border: 'rgba(147,197,253,0.22)',
            bg: 'rgba(147,197,253,0.05)',
            text: '#93c5fd',
          }

  return (
    <div
      style={{
        ...resultCardStyle,
        borderColor: palette.border,
        background: palette.bg,
      }}
    >
      <div style={fieldLabelStyle}>{label}</div>

      <div
        style={{
          ...resultValueStyle,
          color: palette.text,
        }}
      >
        {value}
      </div>
    </div>
  )
}

/* =========================================================
   PROPERTY SNAPSHOT
========================================================= */

function PropertySnapshot({
  lead,
}: {
  lead: Lead
}) {
  const value = leadValue(lead)

  return (
    <SectionCard
      title={
        lead.property_address_1 ||
        'Subject Property'
      }
      subtitle={[
        lead.city,
        lead.state,
        lead.zip,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <div style={leadGridStyle}>
        <ResultCard
          label="Estimated Value"
          value={money(value)}
          tone="gold"
        />

        <ResultCard
          label="Equity"
          value={money(
            lead.equity_amount ?? 0
          )}
          tone="green"
        />

        <ResultCard
          label="Mortgage"
          value={money(
            lead.mortgage_balance ?? 0
          )}
          tone="blue"
        />

        <ResultCard
          label="Square Feet"
          value={number(
            lead.square_feet ?? 0
          )}
          tone="blue"
        />

        <ResultCard
          label="Bedrooms"
          value={String(
            lead.bedrooms ?? 0
          )}
          tone="gold"
        />

        <ResultCard
          label="Bathrooms"
          value={String(
            lead.bathrooms ?? 0
          )}
          tone="gold"
        />
      </div>
    </SectionCard>
  )
}

/* =========================================================
   TOOL HEADER
========================================================= */

function ToolHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div style={toolHeaderStyle}>
      <div style={eyebrowStyle}>
        FOUNDATION ACQUISITIONS LLC
      </div>

      <h1 style={toolTitleStyle}>{title}</h1>

      <p style={toolDescriptionStyle}>
        {description}
      </p>
    </div>
  )
}

/* =========================================================
   ASSIGNMENT CONTRACT
========================================================= */

function AssignmentContractTool({
  lead,
}: ToolProps) {
  const [assignor, setAssignor] = useState('')
  const [assignee, setAssignee] = useState('')

  const [purchasePrice, setPurchasePrice] =
    useState(
      lead?.last_sale_amount ??
        leadValue(lead)
    )

  const [assignmentFee, setAssignmentFee] =
    useState(20000)

  const [earnestMoney, setEarnestMoney] =
    useState(5000)

  const [closingDate, setClosingDate] =
    useState('')

  const assignmentPrice =
    purchasePrice + assignmentFee

  const totalConsideration =
    assignmentPrice + earnestMoney

  const summary = [
    'ASSIGNMENT DEAL SUMMARY',
    '',
    `Property: ${
      lead?.property_address_1 || '—'
    }`,
    `Assignor: ${assignor || '—'}`,
    `Assignee: ${assignee || '—'}`,
    `Original Purchase Price: ${money(
      purchasePrice
    )}`,
    `Assignment Fee: ${money(
      assignmentFee
    )}`,
    `Assignment Price: ${money(
      assignmentPrice
    )}`,
    `Earnest Money: ${money(
      earnestMoney
    )}`,
    `Closing Date: ${
      closingDate || '—'
    }`,
  ].join('\n')

  return (
    <div style={toolGridStyle}>
      <SectionCard
        title="Assignment Terms"
        subtitle="Enter the parties and financial terms."
      >
        <div style={formGridStyle}>
          <TextInput
            label="Assignor"
            value={assignor}
            onChange={setAssignor}
            placeholder="Assignor name"
          />

          <TextInput
            label="Assignee"
            value={assignee}
            onChange={setAssignee}
            placeholder="Buyer / assignee"
          />

          <NumberInput
            label="Original Purchase Price"
            value={purchasePrice}
            onChange={setPurchasePrice}
            prefix="$"
          />

          <NumberInput
            label="Assignment Fee"
            value={assignmentFee}
            onChange={setAssignmentFee}
            prefix="$"
          />

          <NumberInput
            label="Earnest Money"
            value={earnestMoney}
            onChange={setEarnestMoney}
            prefix="$"
          />

          <TextInput
            label="Closing Date"
            value={closingDate}
            onChange={setClosingDate}
            placeholder="MM/DD/YYYY"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Assignment Analysis"
        subtitle="Calculated deal economics."
      >
        <div style={resultGridStyle}>
          <ResultCard
            label="Original Contract"
            value={money(purchasePrice)}
          />

          <ResultCard
            label="Assignment Fee"
            value={money(assignmentFee)}
            tone="green"
          />

          <ResultCard
            label="Assignment Price"
            value={money(
              assignmentPrice
            )}
            tone="gold"
          />

          <ResultCard
            label="Earnest Money"
            value={money(earnestMoney)}
            tone="blue"
          />

          <ResultCard
            label="Total Consideration"
            value={money(
              totalConsideration
            )}
            tone="green"
          />
        </div>

        <div style={outputBoxStyle}>
          <strong>Deal Summary</strong>

          <p>
            {assignor || 'Assignor'} intends
            to assign the purchase agreement to{' '}
            {assignee || 'Assignee'}.
          </p>

          <p>
            Assignment fee:{' '}
            {money(assignmentFee)}.
          </p>

          <p>
            Assignment price:{' '}
            {money(assignmentPrice)}.
          </p>
        </div>

        <div style={actionRowStyle}>
          <ActionButton
            tone="gold"
            onClick={() =>
              copyText(summary)
            }
          >
            Copy Deal Summary
          </ActionButton>
        </div>
      </SectionCard>
    </div>
  )
}

/* =========================================================
   BUYER BLAST
========================================================= */

function BuyerBlastTool({
  lead,
}: ToolProps) {
  const [buyerName, setBuyerName] =
    useState('')

  const [buyerEmail, setBuyerEmail] =
    useState('')

  const [buyerPhone, setBuyerPhone] =
    useState('')

  const [strategy, setStrategy] =
    useState('Fix & Flip')

  const [minPrice, setMinPrice] =
    useState(0)

  const [maxPrice, setMaxPrice] =
    useState(leadValue(lead))

  const [area, setArea] =
    useState(lead?.city ?? '')

  const [propertyType, setPropertyType] =
    useState(
      lead?.property_type ??
        'Single Family'
    )

  const [message, setMessage] =
    useState('')

  const propertyValue =
    leadValue(lead)

  const matchScore = useMemo(() => {
    let score = 50

    if (
      maxPrice >= propertyValue &&
      maxPrice > 0
    ) {
      score += 20
    }

    if (
      minPrice <= propertyValue
    ) {
      score += 10
    }

    if (
      area &&
      lead?.city?.toLowerCase() ===
        area.toLowerCase()
    ) {
      score += 10
    }

    if (strategy) {
      score += 10
    }

    return Math.min(score, 100)
  }, [
    maxPrice,
    minPrice,
    area,
    propertyValue,
    strategy,
    lead,
  ])

  function generateBlast() {
    const address =
      lead?.property_address_1 ||
      'off-market property'

    const city =
      lead?.city ||
      area ||
      'the target market'

    setMessage(
      [
        `OFF-MARKET OPPORTUNITY — ${address}`,
        '',
        `Location: ${city}`,
        `Property Type: ${propertyType}`,
        `Estimated Value: ${
          propertyValue
            ? money(propertyValue)
            : 'Available upon request'
        }`,
        `Strategy: ${strategy}`,
        '',
        `Looking for a buyer interested in ${strategy.toLowerCase()} opportunities in ${city}.`,
        '',
        `If this fits your buy box, reply with your interest and I can provide additional deal information.`,
        '',
        'Foundation Acquisitions LLC',
      ].join('\n')
    )
  }

  return (
    <div style={toolGridStyle}>
      <SectionCard
        title="Buyer Buy Box"
        subtitle="Enter the buyer's acquisition criteria."
      >
        <div style={formGridStyle}>
          <TextInput
            label="Buyer Name"
            value={buyerName}
            onChange={setBuyerName}
          />

          <TextInput
            label="Buyer Email"
            value={buyerEmail}
            onChange={setBuyerEmail}
          />

          <TextInput
            label="Buyer Phone"
            value={buyerPhone}
            onChange={setBuyerPhone}
          />

          <SelectInput
            label="Property Type"
            value={propertyType}
            onChange={setPropertyType}
            options={[
              'Single Family',
              'Multi Family',
              'Townhouse',
              'Condo',
              'Land',
              'Other',
            ]}
          />

          <SelectInput
            label="Strategy"
            value={strategy}
            onChange={setStrategy}
            options={[
              'Fix & Flip',
              'Buy & Hold',
              'BRRRR',
              'Cash Buyer',
              'Rental',
              'New Construction',
              'Land',
            ]}
          />

          <NumberInput
            label="Minimum Price"
            value={minPrice}
            onChange={setMinPrice}
            prefix="$"
          />

          <NumberInput
            label="Maximum Price"
            value={maxPrice}
            onChange={setMaxPrice}
            prefix="$"
          />

          <TextInput
            label="Target Area"
            value={area}
            onChange={setArea}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Buyer Match"
        subtitle="Estimated fit between the buyer and current deal."
      >
        <div style={resultGridStyle}>
          <ResultCard
            label="Match Score"
            value={`${matchScore}/100`}
            tone={
              matchScore >= 80
                ? 'green'
                : 'gold'
            }
          />

          <ResultCard
            label="Deal Value"
            value={money(propertyValue)}
          />

          <ResultCard
            label="Buyer Max"
            value={money(maxPrice)}
            tone="blue"
          />
        </div>

        <div style={actionRowStyle}>
          <ActionButton
            tone="gold"
            onClick={generateBlast}
          >
            Generate Buyer Blast
          </ActionButton>
        </div>

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Generated buyer outreach will appear here..."
          style={textareaStyle}
        />

        {message && (
          <div style={actionRowStyle}>
            <ActionButton
              tone="ghost"
              onClick={() =>
                copyText(message)
              }
            >
              Copy Outreach
            </ActionButton>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* =========================================================
   CLOSING COST
========================================================= */

function ClosingCostTool({
  lead,
}: ToolProps) {
  const [purchasePrice, setPurchasePrice] =
    useState(leadValue(lead))

  const [title, setTitle] =
    useState(1500)

  const [recording, setRecording] =
    useState(100)

  const [transferTax, setTransferTax] =
    useState(0)

  const [propertyTax, setPropertyTax] =
    useState(0)

  const [insurance, setInsurance] =
    useState(0)

  const [inspection, setInspection] =
    useState(500)

  const [other, setOther] =
    useState(0)

  const total =
    title +
    recording +
    transferTax +
    propertyTax +
    insurance +
    inspection +
    other

  const cashRequired =
    purchasePrice + total

  const costPercent =
    purchasePrice > 0
      ? (total / purchasePrice) * 100
      : 0

  return (
    <div style={toolGridStyle}>
      <SectionCard
        title="Transaction Inputs"
        subtitle="Estimate acquisition-side closing expenses."
      >
        <div style={formGridStyle}>
          <NumberInput
            label="Purchase Price"
            value={purchasePrice}
            onChange={setPurchasePrice}
            prefix="$"
          />

          <NumberInput
            label="Title / Settlement"
            value={title}
            onChange={setTitle}
            prefix="$"
          />

          <NumberInput
            label="Recording"
            value={recording}
            onChange={setRecording}
            prefix="$"
          />

          <NumberInput
            label="Transfer Tax"
            value={transferTax}
            onChange={setTransferTax}
            prefix="$"
          />

          <NumberInput
            label="Property Tax / Proration"
            value={propertyTax}
            onChange={setPropertyTax}
            prefix="$"
          />

          <NumberInput
            label="Insurance"
            value={insurance}
            onChange={setInsurance}
            prefix="$"
          />

          <NumberInput
            label="Inspection"
            value={inspection}
            onChange={setInspection}
            prefix="$"
          />

          <NumberInput
            label="Other Costs"
            value={other}
            onChange={setOther}
            prefix="$"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Closing Analysis"
        subtitle="Projected transaction economics."
      >
        <div style={resultGridStyle}>
          <ResultCard
            label="Purchase Price"
            value={money(
              purchasePrice
            )}
          />

          <ResultCard
            label="Closing Costs"
            value={money(total)}
            tone="gold"
          />

          <ResultCard
            label="Cash Required"
            value={money(
              cashRequired
            )}
            tone="green"
          />

          <ResultCard
            label="Cost %"
            value={`${costPercent.toFixed(
              2
            )}%`}
            tone="blue"
          />
        </div>
      </SectionCard>
    </div>
  )
}

/* =========================================================
   COMPS ANALYZER
========================================================= */

function CompsAnalyzerTool({
  lead: _lead,
}: ToolProps) {
  const [leadSearch, setLeadSearch] = useState('')
  const [leadResults, setLeadResults] = useState<LeadOption[]>([])
  const [selectedLead, setSelectedLead] =
    useState<LeadOption | null>(null)
  const [loadingLeads, setLoadingLeads] =
    useState(false)

  const [subjectAddress, setSubjectAddress] =
    useState('')

  const [subjectBeds, setSubjectBeds] =
    useState('')

  const [subjectBaths, setSubjectBaths] =
    useState('')

  const [subjectSqft, setSubjectSqft] =
    useState('')

  const [subjectYear, setSubjectYear] =
    useState('')

  const [comps, setComps] =
    useState<CompRow[]>([
      {
        id: createId(),
        salePrice: '',
        sqft: '',
        beds: '',
        baths: '',
        year: '',
      },
      {
        id: createId(),
        salePrice: '',
        sqft: '',
        beds: '',
        baths: '',
        year: '',
      },
      {
        id: createId(),
        salePrice: '',
        sqft: '',
        beds: '',
        baths: '',
        year: '',
      },
    ])

  const [result, setResult] =
    useState<CompResult | null>(null)

  async function searchLeads(value: string) {
    setLeadSearch(value)

    const search = value.trim()

    if (!search) {
      setLeadResults([])
      setLoadingLeads(false)
      return
    }

    setLoadingLeads(true)

    /*
     * Escape PostgREST wildcard characters so
     * user searches do not accidentally alter
     * the ilike pattern.
     */
    const safeSearch = search
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/,/g, '\\,')

    const { data, error } = await supabase
      .from('leads')
      .select(
        `
          id,
          property_address_1,
          city,
          state,
          zip,
          bedrooms,
          bathrooms,
          square_feet,
          year_built
        `
      )
      .or(
        `property_address_1.ilike.%${safeSearch}%,city.ilike.%${safeSearch}%,zip.ilike.%${safeSearch}%`
      )
      .order(
        'property_address_1',
        { ascending: true }
      )
      .limit(10)

    if (error) {
      console.error(
        'Lead search error:',
        error
      )

      setLeadResults([])
      setLoadingLeads(false)
      return
    }

    setLeadResults(
      (data || []) as LeadOption[]
    )

    setLoadingLeads(false)
  }

  function selectLead(
    selected: LeadOption
  ) {
    setSelectedLead(selected)

    setLeadSearch(
      [
        selected.property_address_1,
        selected.city,
        selected.state,
      ]
        .filter(Boolean)
        .join(', ')
    )

    setLeadResults([])

    setSubjectAddress(
      [
        selected.property_address_1,
        selected.city,
        selected.state,
        selected.zip,
      ]
        .filter(Boolean)
        .join(', ')
    )

    setSubjectBeds(
      selected.bedrooms !== null &&
        selected.bedrooms !== undefined
        ? String(selected.bedrooms)
        : ''
    )

    setSubjectBaths(
      selected.bathrooms !== null &&
        selected.bathrooms !== undefined
        ? String(selected.bathrooms)
        : ''
    )

    setSubjectSqft(
      selected.square_feet !== null &&
        selected.square_feet !== undefined
        ? String(selected.square_feet)
        : ''
    )

    setSubjectYear(
      selected.year_built !== null &&
        selected.year_built !== undefined
        ? String(selected.year_built)
        : ''
    )

    setResult(null)
  }

  function clearSelectedLead() {
    setSelectedLead(null)
    setLeadSearch('')
    setLeadResults([])
  }

  function updateComp(
    id: string,
    field: keyof Omit<CompRow, 'id'>,
    value: string
  ) {
    setComps((current) =>
      current.map((comp) =>
        comp.id === id
          ? {
              ...comp,
              [field]: value,
            }
          : comp
      )
    )

    setResult(null)
  }

  function addComp() {
    setComps((current) => [
      ...current,
      {
        id: createId(),
        salePrice: '',
        sqft: '',
        beds: '',
        baths: '',
        year: '',
      },
    ])

    setResult(null)
  }

  function removeComp(id: string) {
    setComps((current) =>
      current.filter(
        (comp) => comp.id !== id
      )
    )

    setResult(null)
  }

  function calculateComps() {
    const subject = {
      beds:
        Number(subjectBeds) || 0,
      baths:
        Number(subjectBaths) || 0,
      sqft:
        Number(subjectSqft) || 0,
      year:
        Number(subjectYear) || 0,
    }

    const validComps = comps
      .map((comp) => ({
        salePrice:
          Number(comp.salePrice) || 0,
        sqft:
          Number(comp.sqft) || 0,
        beds:
          Number(comp.beds) || 0,
        baths:
          Number(comp.baths) || 0,
        year:
          Number(comp.year) || 0,
      }))
      .filter(
        (comp) =>
          comp.salePrice > 0 &&
          comp.sqft > 0
      )

    if (!validComps.length) {
      window.alert(
        'Add at least one comp with a sale price and square footage.'
      )
      return
    }

    const pricePerSqft =
      validComps.map(
        (comp) =>
          comp.salePrice /
          comp.sqft
      )

    const averagePricePerSqft =
      pricePerSqft.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      pricePerSqft.length

    /*
     * Weight comps based on similarity
     * to the subject.
     *
     * Beds and baths are included.
     * Distance/miles is NOT required.
     */
    const weightedComps =
      validComps.map((comp) => {
        let weight = 1

        if (
          subject.beds &&
          comp.beds
        ) {
          const bedDifference =
            Math.abs(
              subject.beds -
                comp.beds
            )

          if (
            bedDifference === 0
          ) {
            weight += 2
          } else if (
            bedDifference === 1
          ) {
            weight += 1
          }
        }

        if (
          subject.baths &&
          comp.baths
        ) {
          const bathDifference =
            Math.abs(
              subject.baths -
                comp.baths
            )

          if (
            bathDifference === 0
          ) {
            weight += 1.5
          } else if (
            bathDifference <= 0.5
          ) {
            weight += 0.75
          }
        }

        if (
          subject.sqft &&
          comp.sqft
        ) {
          const sqftDifference =
            Math.abs(
              subject.sqft -
                comp.sqft
            ) /
            subject.sqft

          if (
            sqftDifference <= 0.1
          ) {
            weight += 2
          } else if (
            sqftDifference <= 0.2
          ) {
            weight += 1
          }
        }

        if (
          subject.year &&
          comp.year
        ) {
          const ageDifference =
            Math.abs(
              subject.year -
                comp.year
            )

          if (
            ageDifference <= 5
          ) {
            weight += 1
          } else if (
            ageDifference <= 15
          ) {
            weight += 0.5
          }
        }

        return {
          ...comp,
          pricePerSqft:
            comp.salePrice /
            comp.sqft,
          weight,
        }
      })

    const totalWeight =
      weightedComps.reduce(
        (sum, comp) =>
          sum + comp.weight,
        0
      )

    const weightedPricePerSqft =
      totalWeight > 0
        ? weightedComps.reduce(
            (sum, comp) =>
              sum +
              comp.pricePerSqft *
                comp.weight,
            0
          ) / totalWeight
        : averagePricePerSqft

    const arv =
      subject.sqft > 0
        ? weightedPricePerSqft *
          subject.sqft
        : validComps.reduce(
            (sum, comp) =>
              sum +
              comp.salePrice,
            0
          ) /
          validComps.length

    setResult({
      arv,
      averagePricePerSqft,
      weightedPricePerSqft,
      compCount:
        validComps.length,
    })
  }

  return (
    <div style={compsWorkspaceStyle}>
      <SectionCard
        title="Subject Property"
        subtitle="Choose a property from your Leads or enter the subject property manually."
      >
        <div
          style={
            compsSubjectSectionStyle
          }
        >
          <div
            style={
              leadSearchWrapStyle
            }
          >
            <label
              style={
                workspaceLabelStyle
              }
            >
              Choose From Leads
            </label>

            <input
              value={leadSearch}
              onChange={(event) =>
                void searchLeads(
                  event.target.value
                )
              }
              placeholder="Search address, city, or ZIP..."
              style={
                workspaceInputStyle
              }
              autoComplete="off"
            />

            {loadingLeads && (
              <div
                style={
                  leadSearchStatusStyle
                }
              >
                Searching leads...
              </div>
            )}

            {!loadingLeads &&
              leadSearch.trim() &&
              leadResults.length === 0 &&
              !selectedLead && (
                <div
                  style={
                    leadSearchStatusStyle
                  }
                >
                  No matching leads found.
                </div>
              )}

            {leadResults.length >
              0 && (
              <div
                style={
                  leadResultsStyle
                }
              >
                {leadResults.map(
                  (leadOption) => (
                    <button
                      key={
                        leadOption.id
                      }
                      type="button"
                      onClick={() =>
                        selectLead(
                          leadOption
                        )
                      }
                      style={
                        leadResultButtonStyle
                      }
                    >
                      <div
                        style={
                          leadResultAddressStyle
                        }
                      >
                        {leadOption.property_address_1 ||
                          'Unknown Address'}
                      </div>

                      <div
                        style={
                          leadResultMetaStyle
                        }
                      >
                        {[
                          leadOption.city,
                          leadOption.state,
                          leadOption.zip,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            ', '
                          )}

                        {leadOption.bedrooms !==
                          null &&
                          leadOption.bedrooms !==
                            undefined && (
                            <>
                              {' '}
                              ·{' '}
                              {
                                leadOption.bedrooms
                              }{' '}
                              bd
                            </>
                          )}

                        {leadOption.bathrooms !==
                          null &&
                          leadOption.bathrooms !==
                            undefined && (
                            <>
                              {' '}
                              ·{' '}
                              {
                                leadOption.bathrooms
                              }{' '}
                              ba
                            </>
                          )}

                        {leadOption.square_feet !==
                          null &&
                          leadOption.square_feet !==
                            undefined && (
                            <>
                              {' '}
                              ·{' '}
                              {leadOption.square_feet.toLocaleString()}{' '}
                              sf
                            </>
                          )}
                      </div>
                    </button>
                  )
                )}
              </div>
            )}

            {selectedLead && (
              <div
                style={
                  selectedLeadStyle
                }
              >
                <div
                  style={{
                    display:
                      'grid',
                    gap: 3,
                  }}
                >
                  <span>
                    Selected Lead
                  </span>

                  <strong>
                    {selectedLead.property_address_1 ||
                      'Selected Property'}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={
                    clearSelectedLead
                  }
                  style={
                    clearLeadButtonStyle
                  }
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div
            style={
              subjectGridStyle
            }
          >
            <WorkspaceField
              label="Subject Address"
              value={subjectAddress}
              onChange={
                setSubjectAddress
              }
              placeholder="123 Main St"
            />

            <WorkspaceField
              label="Beds"
              value={subjectBeds}
              onChange={
                setSubjectBeds
              }
              placeholder="3"
              type="number"
            />

            <WorkspaceField
              label="Baths"
              value={subjectBaths}
              onChange={
                setSubjectBaths
              }
              placeholder="2"
              type="number"
            />

            <WorkspaceField
              label="Square Feet"
              value={subjectSqft}
              onChange={
                setSubjectSqft
              }
              placeholder="1200"
              type="number"
            />

            <WorkspaceField
              label="Year Built"
              value={subjectYear}
              onChange={
                setSubjectYear
              }
              placeholder="1985"
              type="number"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Comparable Sales"
        subtitle="Enter the strongest comparable sales. Miles/distance is not required."
        actions={
          <ActionButton
            compact
            tone="gold"
            onClick={addComp}
          >
            + Add Comp
          </ActionButton>
        }
      >
        <div
          style={compListStyle}
        >
          {comps.map(
            (comp, index) => (
              <div
                key={comp.id}
                style={compRowStyle}
              >
                <div
                  style={
                    compHeaderStyle
                  }
                >
                  <div
                    style={
                      compNumberStyle
                    }
                  >
                    COMP {index + 1}
                  </div>

                  {comps.length >
                    1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeComp(
                          comp.id
                        )
                      }
                      style={
                        removeCompStyle
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  style={
                    compInputGridStyle
                  }
                >
                  <WorkspaceField
                    label="Sale Price"
                    value={
                      comp.salePrice
                    }
                    onChange={(
                      value
                    ) =>
                      updateComp(
                        comp.id,
                        'salePrice',
                        value
                      )
                    }
                    placeholder="250000"
                    type="number"
                  />

                  <WorkspaceField
                    label="Square Feet"
                    value={
                      comp.sqft
                    }
                    onChange={(
                      value
                    ) =>
                      updateComp(
                        comp.id,
                        'sqft',
                        value
                      )
                    }
                    placeholder="1200"
                    type="number"
                  />

                  <WorkspaceField
                    label="Beds"
                    value={
                      comp.beds
                    }
                    onChange={(
                      value
                    ) =>
                      updateComp(
                        comp.id,
                        'beds',
                        value
                      )
                    }
                    placeholder="3"
                    type="number"
                  />

                  <WorkspaceField
                    label="Baths"
                    value={
                      comp.baths
                    }
                    onChange={(
                      value
                    ) =>
                      updateComp(
                        comp.id,
                        'baths',
                        value
                      )
                    }
                    placeholder="2"
                    type="number"
                  />

                  <WorkspaceField
                    label="Year Built"
                    value={
                      comp.year
                    }
                    onChange={(
                      value
                    ) =>
                      updateComp(
                        comp.id,
                        'year',
                        value
                      )
                    }
                    placeholder="1985"
                    type="number"
                  />
                </div>
              </div>
            )
          )}
        </div>

        <div
          style={
            calculateWrapStyle
          }
        >
          <ActionButton
            tone="gold"
            onClick={
              calculateComps
            }
          >
            Calculate ARV
          </ActionButton>
        </div>
      </SectionCard>

      {result && (
        <SectionCard
          title="Comps Analysis"
          subtitle={`Calculated from ${result.compCount} comparable ${
            result.compCount === 1
              ? 'sale'
              : 'sales'
          }.`}
        >
          <div
            style={
              compsResultGridStyle
            }
          >
            <ResultCard
              label="Estimated ARV"
              value={money(
                result.arv
              )}
              tone="gold"
            />

            <ResultCard
              label="Average Price / SF"
              value={`$${result.averagePricePerSqft.toFixed(
                0
              )}`}
              tone="blue"
            />

            <ResultCard
              label="Weighted Price / SF"
              value={`$${result.weightedPricePerSqft.toFixed(
                0
              )}`}
              tone="green"
            />

            <ResultCard
              label="Comparable Sales"
              value={String(
                result.compCount
              )}
              tone="gold"
            />
          </div>
        </SectionCard>
      )}
    </div>
  )
}

/* =========================================================
   COMPS COMPONENT HELPERS
========================================================= */

function WorkspaceField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label
      style={
        workspaceFieldStyle
      }
    >
      <span
        style={
          workspaceLabelStyle
        }
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        style={
          workspaceInputStyle
        }
      />
    </label>
  )
}

/* =========================================================
   CONTRACT GENERATOR
========================================================= */

function ContractGeneratorTool({
  lead,
}: ToolProps) {
  const [buyer, setBuyer] =
    useState('')

  const [seller, setSeller] =
    useState(
      lead?.owner_name ?? ''
    )

  const [purchasePrice, setPurchasePrice] =
    useState(
      leadValue(lead)
    )

  const [earnestMoney, setEarnestMoney] =
    useState(5000)

  const [closingDate, setClosingDate] =
    useState('')

  const [financing, setFinancing] =
    useState('Cash')

  const [contingencies, setContingencies] =
    useState(
      'Inspection and due diligence'
    )

  const [generated, setGenerated] =
    useState('')

  function generate() {
    setGenerated(
      [
        'PURCHASE AGREEMENT TERM SUMMARY',
        '',
        `Buyer: ${buyer || '—'}`,
        `Seller: ${seller || '—'}`,
        `Property: ${
          lead?.property_address_1 ||
          '—'
        }`,
        `Purchase Price: ${money(
          purchasePrice
        )}`,
        `Earnest Money: ${money(
          earnestMoney
        )}`,
        `Closing Date: ${
          closingDate || '—'
        }`,
        `Financing: ${financing}`,
        `Contingencies: ${contingencies}`,
        '',
        'This generated output is a deal-term summary and should be reviewed against the applicable contract form and legal requirements before execution.',
      ].join('\n')
    )
  }

  return (
    <div style={toolGridStyle}>
      <SectionCard
        title="Contract Terms"
        subtitle="Build the purchase agreement data set."
      >
        <div
          style={
            formGridStyle
          }
        >
          <TextInput
            label="Buyer"
            value={buyer}
            onChange={setBuyer}
          />

          <TextInput
            label="Seller"
            value={seller}
            onChange={setSeller}
          />

          <NumberInput
            label="Purchase Price"
            value={
              purchasePrice
            }
            onChange={
              setPurchasePrice
            }
            prefix="$"
          />

          <NumberInput
            label="Earnest Money"
            value={
              earnestMoney
            }
            onChange={
              setEarnestMoney
            }
            prefix="$"
          />

          <TextInput
            label="Closing Date"
            value={
              closingDate
            }
            onChange={
              setClosingDate
            }
          />

          <SelectInput
            label="Financing"
            value={financing}
            onChange={
              setFinancing
            }
            options={[
              'Cash',
              'Conventional',
              'Hard Money',
              'Private Money',
              'Seller Financing',
              'Other',
            ]}
          />
        </div>

        <div
          style={{
            marginTop: 12,
          }}
        >
          <label
            style={
              fieldStyle
            }
          >
            <span
              style={
                fieldLabelStyle
              }
            >
              Contingencies
            </span>

            <textarea
              value={
                contingencies
              }
              onChange={(
                event
              ) =>
                setContingencies(
                  event.target
                    .value
                )
              }
              style={
                textareaStyle
              }
            />
          </label>
        </div>

        <div
          style={
            actionRowStyle
          }
        >
          <ActionButton
            tone="gold"
            onClick={
              generate
            }
          >
            Generate Term Summary
          </ActionButton>
        </div>
      </SectionCard>

      <SectionCard
        title="Generated Contract Data"
        subtitle="Structured deal information."
      >
        <textarea
          value={
            generated
          }
          onChange={(
            event
          ) =>
            setGenerated(
              event.target
                .value
            )
          }
          placeholder="Your generated contract terms will appear here..."
          style={{
            ...textareaStyle,
            minHeight: 330,
          }}
        />

        {generated && (
          <div
            style={
              actionRowStyle
            }
          >
            <ActionButton
              tone="ghost"
              onClick={() =>
                copyText(
                  generated
                )
              }
            >
              Copy Contract Data
            </ActionButton>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* =========================================================
   MARKETING ROI
========================================================= */

function MarketingROITool({
  lead: _lead,
}: ToolProps) {
  const [spend, setSpend] =
    useState(0)

  const [leads, setLeads] =
    useState(0)

  const [contacts, setContacts] =
    useState(0)

  const [appointments, setAppointments] =
    useState(0)

  const [offers, setOffers] =
    useState(0)

  const [contracts, setContracts] =
    useState(0)

  const [closings, setClosings] =
    useState(0)

  const [revenue, setRevenue] =
    useState(0)

  const costPerLead =
    leads > 0
      ? spend / leads
      : 0

  const costPerContract =
    contracts > 0
      ? spend / contracts
      : 0

  const conversionRate =
    leads > 0
      ? (closings / leads) *
        100
      : 0

  const roi =
    spend > 0
      ? ((revenue - spend) /
          spend) *
        100
      : 0

  const roas =
    spend > 0
      ? revenue / spend
      : 0

  return (
    <div
      style={
        toolGridStyle
      }
    >
      <SectionCard
        title="Marketing Funnel"
        subtitle="Enter campaign performance."
      >
        <div
          style={
            formGridStyle
          }
        >
          <NumberInput
            label="Marketing Spend"
            value={spend}
            onChange={
              setSpend
            }
            prefix="$"
          />

          <NumberInput
            label="Leads"
            value={leads}
            onChange={
              setLeads
            }
          />

          <NumberInput
            label="Contacts"
            value={contacts}
            onChange={
              setContacts
            }
          />

          <NumberInput
            label="Appointments"
            value={
              appointments
            }
            onChange={
              setAppointments
            }
          />

          <NumberInput
            label="Offers"
            value={offers}
            onChange={
              setOffers
            }
          />

          <NumberInput
            label="Contracts"
            value={
              contracts
            }
            onChange={
              setContracts
            }
          />

          <NumberInput
            label="Closings"
            value={
              closings
            }
            onChange={
              setClosings
            }
          />

          <NumberInput
            label="Revenue"
            value={
              revenue
            }
            onChange={
              setRevenue
            }
            prefix="$"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Marketing Performance"
        subtitle="Calculated campaign economics."
      >
        <div
          style={
            resultGridStyle
          }
        >
          <ResultCard
            label="Cost Per Lead"
            value={money(
              costPerLead
            )}
            tone="gold"
          />

          <ResultCard
            label="Cost Per Contract"
            value={money(
              costPerContract
            )}
            tone="blue"
          />

          <ResultCard
            label="Lead → Close"
            value={`${conversionRate.toFixed(
              2
            )}%`}
            tone="green"
          />

          <ResultCard
            label="ROI"
            value={`${roi.toFixed(
              2
            )}%`}
            tone={
              roi >= 0
                ? 'green'
                : 'gold'
            }
          />

          <ResultCard
            label="ROAS"
            value={`${roas.toFixed(
              2
            )}x`}
            tone="green"
          />
        </div>
      </SectionCard>
    </div>
  )
}

/* =========================================================
   REPAIR ESTIMATOR
========================================================= */

function RepairEstimatorTool({
  lead,
}: ToolProps) {
  const [roof, setRoof] =
    useState(0)

  const [hvac, setHvac] =
    useState(0)

  const [plumbing, setPlumbing] =
    useState(0)

  const [electrical, setElectrical] =
    useState(0)

  const [kitchen, setKitchen] =
    useState(0)

  const [bathrooms, setBathrooms] =
    useState(0)

  const [flooring, setFlooring] =
    useState(0)

  const [paint, setPaint] =
    useState(0)

  const [landscaping, setLandscaping] =
    useState(0)

  const [other, setOther] =
    useState(0)

  const [contingency, setContingency] =
    useState(10)

  const base =
    roof +
    hvac +
    plumbing +
    electrical +
    kitchen +
    bathrooms +
    flooring +
    paint +
    landscaping +
    other

  const contingencyAmount =
    base *
    (contingency / 100)

  const total =
    base +
    contingencyAmount

  const repairLevel =
    total === 0
      ? 'Not Estimated'
      : total < 25000
        ? 'Light'
        : total < 60000
          ? 'Moderate'
          : total < 100000
            ? 'Heavy'
            : 'Major Rehab'

  const summary = [
    'REPAIR ESTIMATE',
    '',
    `Property: ${
      lead?.property_address_1 ||
      'Standalone Estimate'
    }`,
    `Base Repairs: ${money(
      base
    )}`,
    `Contingency: ${money(
      contingencyAmount
    )}`,
    `Total Repairs: ${money(
      total
    )}`,
    `Repair Level: ${repairLevel}`,
  ].join('\n')

  return (
    <div
      style={
        toolGridStyle
      }
    >
      <SectionCard
        title="Repair Budget"
        subtitle="Enter estimated costs by category."
      >
        <div
          style={
            formGridStyle
          }
        >
          <NumberInput
            label="Roof"
            value={roof}
            onChange={
              setRoof
            }
            prefix="$"
          />

          <NumberInput
            label="HVAC"
            value={hvac}
            onChange={
              setHvac
            }
            prefix="$"
          />

          <NumberInput
            label="Plumbing"
            value={plumbing}
            onChange={
              setPlumbing
            }
            prefix="$"
          />

          <NumberInput
            label="Electrical"
            value={
              electrical
            }
            onChange={
              setElectrical
            }
            prefix="$"
          />

          <NumberInput
            label="Kitchen"
            value={kitchen}
            onChange={
              setKitchen
            }
            prefix="$"
          />

          <NumberInput
            label="Bathrooms"
            value={
              bathrooms
            }
            onChange={
              setBathrooms
            }
            prefix="$"
          />

          <NumberInput
            label="Flooring"
            value={
              flooring
            }
            onChange={
              setFlooring
            }
            prefix="$"
          />

          <NumberInput
            label="Paint"
            value={paint}
            onChange={
              setPaint
            }
            prefix="$"
          />

          <NumberInput
            label="Landscaping"
            value={
              landscaping
            }
            onChange={
              setLandscaping
            }
            prefix="$"
          />

          <NumberInput
            label="Other"
            value={other}
            onChange={
              setOther
            }
            prefix="$"
          />

          <NumberInput
            label="Contingency"
            value={
              contingency
            }
            onChange={
              setContingency
            }
            suffix="%"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Repair Analysis"
        subtitle="Projected renovation budget."
      >
        <div
          style={
            resultGridStyle
          }
        >
          <ResultCard
            label="Base Repairs"
            value={money(
              base
            )}
            tone="gold"
          />

          <ResultCard
            label="Contingency"
            value={money(
              contingencyAmount
            )}
            tone="blue"
          />

          <ResultCard
            label="Total Repairs"
            value={money(
              total
            )}
            tone="green"
          />

          <ResultCard
            label="Repair Level"
            value={
              repairLevel
            }
            tone="gold"
          />
        </div>

        <div
          style={
            actionRowStyle
          }
        >
          <ActionButton
            tone="ghost"
            onClick={() =>
              copyText(
                summary
              )
            }
          >
            Copy Repair Summary
          </ActionButton>
        </div>
      </SectionCard>
    </div>
  )
}

/* =========================================================
   SCRIPT GENERATOR
========================================================= */

function ScriptGeneratorTool({
  lead,
}: ToolProps) {
  const [leadType, setLeadType] =
    useState(
      lead?.lead_type ||
        'Distressed Seller'
    )

  const [motivation, setMotivation] =
    useState(
      'Needs a simple and convenient sale'
    )

  const [condition, setCondition] =
    useState('Unknown')

  const [objective, setObjective] =
    useState(
      'Qualify the seller and determine whether an offer makes sense'
    )

  const [objection, setObjection] =
    useState(
      'I need to think about it'
    )

  const [script, setScript] =
    useState('')

  function generateScript() {
    setScript(
      [
        'SELLER CONVERSATION SCRIPT',
        '',
        `Lead Type: ${leadType}`,
        `Motivation: ${motivation}`,
        `Property Condition: ${condition}`,
        '',
        'OPENING',
        '“Hi, this is Foundation Acquisitions. I’m reaching out about the property. I wanted to see if you had a few minutes to talk about it.”',
        '',
        'DISCOVERY',
        '1. What are you looking to do with the property?',
        '2. What has you considering selling?',
        '3. How quickly would you ideally like to move?',
        '4. What condition is the property currently in?',
        '5. Is there a mortgage or other obligation on the property?',
        '6. What would make the sale worthwhile for you?',
        '',
        'OBJECTIVE',
        objective,
        '',
        'OBJECTION',
        `Seller: “${objection}.”`,
        '',
        'RESPONSE',
        '“Absolutely. I understand. My goal is not to pressure you. I just want to understand what would make sense for you and determine whether we can put together an option worth considering.”',
        '',
        'OFFER TRANSITION',
        '“Based on what you have told me, would you be open to hearing what we could potentially offer?”',
        '',
        'FOLLOW UP',
        'Confirm the next step, preferred contact method, and specific follow-up date/time.',
      ].join('\n')
    )
  }

  return (
    <div
      style={
        toolGridStyle
      }
    >
      <SectionCard
        title="Conversation Inputs"
        subtitle="Customize the script to the seller situation."
      >
        <div
          style={
            formGridStyle
          }
        >
          <SelectInput
            label="Lead Type"
            value={
              leadType
            }
            onChange={
              setLeadType
            }
            options={[
              'Distressed Seller',
              'Absentee Owner',
              'Tax Delinquent',
              'Foreclosure',
              'Probate',
              'Vacant',
              'High Equity',
              'Unknown',
            ]}
          />

          <SelectInput
            label="Property Condition"
            value={
              condition
            }
            onChange={
              setCondition
            }
            options={[
              'Unknown',
              'Excellent',
              'Good',
              'Average',
              'Needs Repairs',
              'Major Rehab',
            ]}
          />
        </div>

        <div
          style={{
            marginTop: 12,
          }}
        >
          <TextInput
            label="Motivation"
            value={
              motivation
            }
            onChange={
              setMotivation
            }
          />
        </div>

        <div
          style={{
            marginTop: 12,
          }}
        >
          <TextInput
            label="Call Objective"
            value={
              objective
            }
            onChange={
              setObjective
            }
          />
        </div>

        <div
          style={{
            marginTop: 12,
          }}
        >
          <TextInput
            label="Likely Objection"
            value={
              objection
            }
            onChange={
              setObjection
            }
          />
        </div>

        <div
          style={
            actionRowStyle
          }
        >
          <ActionButton
            tone="gold"
            onClick={
              generateScript
            }
          >
            Generate Script
          </ActionButton>
        </div>
      </SectionCard>

      <SectionCard
        title="Generated Script"
        subtitle="Editable conversation framework."
      >
        <textarea
          value={
            script
          }
          onChange={(
            event
          ) =>
            setScript(
              event.target
                .value
            )
          }
          placeholder="Your script will appear here..."
          style={{
            ...textareaStyle,
            minHeight: 500,
          }}
        />

        {script && (
          <div
            style={
              actionRowStyle
            }
          >
            <ActionButton
              tone="ghost"
              onClick={() =>
                copyText(
                  script
                )
              }
            >
              Copy Script
            </ActionButton>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* =========================================================
   TOOL REGISTRY
========================================================= */

const TOOL_COMPONENTS: Record<
  ToolSlug,
  ComponentType<ToolProps>
> = {
  'assignment-contract':
    AssignmentContractTool,

  'buyer-blast':
    BuyerBlastTool,

  'closing-cost':
    ClosingCostTool,

  'comps-analyzer':
    CompsAnalyzerTool,

  'contract-generator':
    ContractGeneratorTool,

  'marketing-roi':
    MarketingROITool,

  'repair-estimator':
    RepairEstimatorTool,

  'script-generator':
    ScriptGeneratorTool,
}

/* =========================================================
   TOOL WORKSPACE CONTENT
========================================================= */

function ToolWorkspaceContent({
  slug,
}: {
  slug: ToolSlug
}) {
  const searchParams =
    useSearchParams()

  const leadId =
    searchParams.get(
      'leadId'
    )

  const config =
    getToolConfig(slug)

  const [
    lead,
    setLead,
  ] = useState<Lead | null>(
    null
  )

  const [
    loadingLead,
    setLoadingLead,
  ] = useState(
    Boolean(leadId)
  )

  const [
    leadError,
    setLeadError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    let cancelled = false

    async function loadLead() {
      if (!leadId) {
        setLoadingLead(false)
        return
      }

      setLoadingLead(true)
      setLeadError(null)

      const {
        data,
        error,
      } = await supabase
        .from('leads')
        .select('*')
        .eq(
          'id',
          leadId
        )
        .single()

      if (cancelled) return

      if (error) {
        console.error(
          'Tool lead load error:',
          error
        )

        setLead(null)

        setLeadError(
          'The property information could not be loaded. The tool can still be used manually.'
        )
      } else {
        setLead(
          data as Lead
        )
      }

      setLoadingLead(false)
    }

    void loadLead()

    return () => {
      cancelled = true
    }
  }, [leadId])

  if (!config) {
    return (
      <PageShell
        title="Tool Not Found"
        subtitle="The requested acquisition tool does not exist."
      >
        <SectionCard title="Unknown Tool">
          <Link href="/tools">
            <ActionButton tone="gold">
              Back to Tools
            </ActionButton>
          </Link>
        </SectionCard>
      </PageShell>
    )
  }

  if (loadingLead) {
    return (
      <PageShell
        title={
          config.name
        }
        subtitle="Loading property workspace..."
      >
        <SectionCard title="Loading">
          <div
            style={
              loadingStyle
            }
          >
            Loading property intelligence...
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  const ToolComponent =
    TOOL_COMPONENTS[
      slug
    ]

  if (!ToolComponent) {
    return (
      <PageShell
        title="Tool Error"
        subtitle="This tool is not registered correctly."
      >
        <SectionCard title="Configuration Error">
          <p
            style={
              errorTextStyle
            }
          >
            The tool exists in the
            configuration but does not
            have a workspace component.
          </p>

          <Link href="/tools">
            <ActionButton tone="gold">
              Back to Tools
            </ActionButton>
          </Link>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={
        config.name
      }
      subtitle={
        config.description
      }
      actions={
        <>
          <Link href="/tools">
            <ActionButton
              compact
              tone="ghost"
            >
              Tools
            </ActionButton>
          </Link>

          {leadId && (
            <Link
              href={`/leads/${leadId}`}
            >
              <ActionButton
                compact
                tone="gold"
              >
                Lead Workspace
              </ActionButton>
            </Link>
          )}
        </>
      }
    >
      <div
        style={
          pageStyle
        }
      >
        <ToolHeader
          title={
            config.name
          }
          description={
            config.longDescription
          }
        />

        {leadError && (
          <div
            style={
              warningBoxStyle
            }
          >
            {leadError}
          </div>
        )}

        {lead && (
          <PropertySnapshot
            lead={lead}
          />
        )}

        <ToolComponent
          lead={lead}
        />

        {leadId && (
          <div
            style={
              workspaceSectionStyle
            }
          >
            <WorkspaceCanvas
              leadId={
                leadId
              }
              leadTitle={
                lead?.property_address_1 ||
                config.name
              }
            />
          </div>
        )}
      </div>
    </PageShell>
  )
}

/* =========================================================
   SUSPENSE WRAPPER
========================================================= */

export default function ToolWorkspace({
  slug,
}: {
  slug: ToolSlug
}) {
  return (
    <Suspense
      fallback={
        <PageShell
          title="Loading Tool"
          subtitle="Preparing your acquisition workspace..."
        >
          <SectionCard title="Loading">
            <div
              style={
                loadingStyle
              }
            >
              Loading tool workspace...
            </div>
          </SectionCard>
        </PageShell>
      }
    >
      <ToolWorkspaceContent
        slug={slug}
      />
    </Suspense>
  )
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
  width: '100%',
  minWidth: 0,
}

const toolGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1.2fr) minmax(300px, 0.8fr)',
  gap: 18,
  alignItems: 'start',
  width: '100%',
  minWidth: 0,
}

const toolHeaderStyle: CSSProperties = {
  borderRadius: 16,
  border:
    '1px solid rgba(214,166,75,0.15)',
  background:
    'linear-gradient(180deg, rgba(24,20,12,0.72), rgba(7,7,6,0.92))',
  padding: 18,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(214,166,75,0.72)',
}

const toolTitleStyle: CSSProperties = {
  margin: '5px 0 4px',
  fontSize: 24,
  fontWeight: 850,
  color: '#fff',
}

const toolDescriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.55,
  color: 'rgba(255,255,255,0.48)',
  maxWidth: 720,
}

const leadGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
}

const formGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  minWidth: 0,
}

const fieldLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.4)',
}

const inputWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minHeight: 40,
  borderRadius: 10,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.025)',
  overflow: 'hidden',
}

const prefixStyle: CSSProperties = {
  padding: '0 8px',
  color: 'rgba(255,255,255,0.38)',
  fontSize: 12,
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  boxSizing: 'border-box',
  borderRadius: 10,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.025)',
  color: '#fff',
  padding: '0 11px',
  outline: 'none',
  fontSize: 12,
}

const resultGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(145px, 1fr))',
  gap: 10,
}

const resultCardStyle: CSSProperties = {
  minHeight: 74,
  borderRadius: 12,
  border: '1px solid transparent',
  padding: '12px 13px',
  display: 'grid',
  alignContent: 'center',
  gap: 5,
}

const resultValueStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 850,
  lineHeight: 1.1,
}

const outputBoxStyle: CSSProperties = {
  marginTop: 14,
  borderRadius: 12,
  border:
    '1px solid rgba(255,255,255,0.07)',
  background:
    'rgba(0,0,0,0.25)',
  padding: 14,
  color: 'rgba(255,255,255,0.62)',
  fontSize: 12,
  lineHeight: 1.55,
}

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 220,
  boxSizing: 'border-box',
  resize: 'vertical',
  borderRadius: 12,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(0,0,0,0.25)',
  color: '#fff',
  padding: 13,
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: 12,
  lineHeight: 1.55,
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 14,
}

const tableStyle: CSSProperties = {
  width: '100%',
  minWidth: 680,
  borderCollapse: 'collapse',
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '9px 10px',
  borderBottom:
    '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.4)',
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const tdStyle: CSSProperties = {
  padding: '9px 10px',
  borderBottom:
    '1px solid rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 11,
}

const tableInputStyle: CSSProperties = {
  width: 100,
  minHeight: 34,
  boxSizing: 'border-box',
  borderRadius: 7,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.025)',
  color: '#fff',
  padding: '0 8px',
  outline: 'none',
  fontSize: 11,
}

const workspaceSectionStyle: CSSProperties = {
  minWidth: 0,
}

const loadingStyle: CSSProperties = {
  minHeight: 180,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,0.45)',
  fontSize: 13,
}

const warningBoxStyle: CSSProperties = {
  borderRadius: 12,
  border:
    '1px solid rgba(214,166,75,0.25)',
  background:
    'rgba(214,166,75,0.06)',
  color: 'rgba(255,255,255,0.65)',
  padding: 12,
  fontSize: 12,
  lineHeight: 1.5,
}

const errorTextStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: 13,
  lineHeight: 1.5,
}

/* =========================================================
   COMPS STYLES
========================================================= */

const compsWorkspaceStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const compsSubjectSectionStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
}

const leadSearchWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  gap: 7,
}

const workspaceFieldStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
}

const workspaceLabelStyle: CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.45)',
}

const workspaceInputStyle: CSSProperties = {
  width: '100%',
  minHeight: 40,
  boxSizing: 'border-box',
  borderRadius: 10,
  border:
    '1px solid rgba(255,255,255,0.09)',
  background:
    'rgba(255,255,255,0.035)',
  color: '#fff',
  padding: '0 11px',
  outline: 'none',
  fontSize: 12,
}

const leadSearchStatusStyle: CSSProperties = {
  position: 'absolute',
  top: 64,
  left: 0,
  right: 0,
  zIndex: 20,
  padding: 10,
  borderRadius: 10,
  background: '#111',
  border:
    '1px solid rgba(255,255,255,0.08)',
  color:
    'rgba(255,255,255,0.45)',
  fontSize: 11,
}

const leadResultsStyle: CSSProperties = {
  position: 'absolute',
  top: 64,
  left: 0,
  right: 0,
  zIndex: 30,
  display: 'grid',
  gap: 1,
  overflow: 'hidden',
  borderRadius: 12,
  border:
    '1px solid rgba(214,166,75,0.22)',
  background: '#11100d',
  boxShadow:
    '0 18px 40px rgba(0,0,0,0.45)',
}

const leadResultButtonStyle: CSSProperties = {
  appearance: 'none',
  border: 0,
  borderBottom:
    '1px solid rgba(255,255,255,0.06)',
  background: 'transparent',
  color: '#fff',
  textAlign: 'left',
  padding: '11px 13px',
  cursor: 'pointer',
}

const leadResultAddressStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 750,
  color: '#fff',
}

const leadResultMetaStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 10.5,
  color:
    'rgba(255,255,255,0.45)',
}

const selectedLeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '9px 11px',
  borderRadius: 10,
  border:
    '1px solid rgba(74,222,128,0.18)',
  background:
    'rgba(74,222,128,0.05)',
  color: '#4ade80',
  fontSize: 10,
}

const clearLeadButtonStyle: CSSProperties = {
  border:
    '1px solid rgba(255,255,255,0.1)',
  background:
    'rgba(255,255,255,0.03)',
  color:
    'rgba(255,255,255,0.55)',
  borderRadius: 7,
  padding: '5px 8px',
  fontSize: 10,
  cursor: 'pointer',
}

const subjectGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(145px, 1fr))',
  gap: 10,
}

const compListStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
}

const compRowStyle: CSSProperties = {
  padding: 13,
  borderRadius: 13,
  border:
    '1px solid rgba(255,255,255,0.07)',
  background:
    'rgba(255,255,255,0.02)',
}

const compHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 11,
}

const compNumberStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#d6a64b',
}

const removeCompStyle: CSSProperties = {
  border: 0,
  background: 'transparent',
  color:
    'rgba(255,255,255,0.35)',
  fontSize: 10,
  cursor: 'pointer',
}

const compInputGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(125px, 1fr))',
  gap: 9,
}

const calculateWrapStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 14,
}

const compsResultGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
}