'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'next/navigation'

import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import StatPill from '@/components/ui/stat-pill'
import WorkspaceCanvas from '@/components/workspace-canvas'

import { supabase } from '@/lib/supabase'
import { getToolConfig, type ToolSlug } from './tool-config'

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
        {prefix && <span style={prefixStyle}>{prefix}</span>}

        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => {
            const parsed = Number(event.target.value)
            onChange(Number.isFinite(parsed) ? parsed : 0)
          }}
          style={inputStyle}
        />

        {suffix && <span style={prefixStyle}>{suffix}</span>}
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
        onChange={(event) => onChange(event.target.value)}
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
        onChange={(event) => onChange(event.target.value)}
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
      <div style={{ ...resultValueStyle, color: palette.text }}>
        {value}
      </div>
    </div>
  )
}

function ToolHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div style={toolHeaderStyle}>
      <div>
        <div style={eyebrowStyle}>Foundation Acquisitions LLC</div>
        <h1 style={toolTitleStyle}>{title}</h1>
        <p style={toolDescriptionStyle}>{description}</p>
      </div>
    </div>
  )
}

export default function ToolWorkspace({
  slug,
}: {
  slug: ToolSlug
}) {
  const searchParams = useSearchParams()

  const leadId = searchParams.get('leadId')
  const config = getToolConfig(slug)

  const [lead, setLead] = useState<Lead | null>(null)
  const [loadingLead, setLoadingLead] = useState(Boolean(leadId))

  useEffect(() => {
    async function loadLead() {
      if (!leadId) {
        setLoadingLead(false)
        return
      }

      setLoadingLead(true)

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) {
        console.error(error)
        setLead(null)
      } else {
        setLead(data as Lead)
      }

      setLoadingLead(false)
    }

    void loadLead()
  }, [leadId])

  if (!config) {
    return (
      <PageShell
        title="Tool Not Found"
        subtitle="The requested acquisition tool does not exist."
      >
        <SectionCard title="Unknown Tool">
          <Link href="/tools">
            <ActionButton tone="gold">Back to Tools</ActionButton>
          </Link>
        </SectionCard>
      </PageShell>
    )
  }

  if (loadingLead) {
    return (
      <PageShell
        title={config.name}
        subtitle="Loading property workspace..."
      >
        <SectionCard title="Loading">
          <div style={loadingStyle}>
            Loading lead intelligence...
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  const address = lead
    ? [
        lead.property_address_1,
        lead.city,
        lead.state,
        lead.zip,
      ]
        .filter(Boolean)
        .join(', ')
    : 'Standalone analysis'

  return (
    <PageShell
      title={config.name}
      subtitle={config.description}
      actions={
        <>
          <Link href="/tools">
            <ActionButton compact tone="ice">
              Tools
            </ActionButton>
          </Link>

          {leadId && (
            <Link href={`/leads/${leadId}`}>
              <ActionButton compact tone="gold">
                Lead Workspace
              </ActionButton>
            </Link>
          )}
        </>
      }
    >
      <div style={pageStyle}>
        <ToolHeader
          title={config.name}
          description={config.longDescription}
        />

        {lead && (
          <SectionCard
            title={lead.property_address_1 || 'Subject Property'}
            subtitle={address}
            actions={
              <div style={leadBadgeStyle}>
                {lead.lead_type || 'Lead'}
              </div>
            }
          >
            <div style={leadGridStyle}>
              <ResultCard
                label="Estimated Value"
                value={money(
                  lead.estimated_value ??
                    lead.house_value ??
                    lead.market_value ??
                    0
                )}
                tone="gold"
              />

              <ResultCard
                label="Equity"
                value={money(lead.equity_amount ?? 0)}
                tone="green"
              />

              <ResultCard
                label="Mortgage"
                value={money(lead.mortgage_balance ?? 0)}
                tone="blue"
              />

              <ResultCard
                label="Square Feet"
                value={number(lead.square_feet ?? 0)}
                tone="blue"
              />
            </div>
          </SectionCard>
        )}

        {slug === 'assignment-contract' && (
          <AssignmentContractTool lead={lead} />
        )}

        {slug === 'buyer-blast' && (
          <BuyerBlastTool lead={lead} />
        )}

        {slug === 'closing-cost' && (
          <ClosingCostTool lead={lead} />
        )}

        {slug === 'comps-analyzer' && (
          <CompsAnalyzerTool lead={lead} />
        )}

        {slug === 'contract-generator' && (
          <ContractGeneratorTool lead={lead} />
        )}

        {slug === 'marketing-roi' && (
          <MarketingROITool />
        )}

        {slug === 'repair-estimator' && (
          <RepairEstimatorTool />
        )}

        {slug === 'script-generator' && (
          <ScriptGeneratorTool lead={lead} />
        )}

        {leadId && (
          <div style={workspaceSectionStyle}>
            <WorkspaceCanvas
              leadId={leadId}
              leadTitle={lead?.property_address_1 || config.name}
            />
          </div>
        )}
      </div>
    </PageShell>
  )
}

/* =========================================================
   ASSIGNMENT CONTRACT
========================================================= */

function AssignmentContractTool({
  lead,
}: {
  lead: Lead | null
}) {
  const [assignor, setAssignor] = useState('')
  const [assignee, setAssignee] = useState('')
  const [purchasePrice, setPurchasePrice] = useState(
    lead?.last_sale_amount ?? 0
  )
  const [assignmentFee, setAssignmentFee] = useState(20000)
  const [earnestMoney, setEarnestMoney] = useState(5000)
  const [closingDate, setClosingDate] = useState('')

  const assignmentPrice = purchasePrice + assignmentFee
  const totalConsideration = assignmentPrice + earnestMoney

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
        subtitle="Calculated deal terms."
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
            value={money(assignmentPrice)}
            tone="gold"
          />

          <ResultCard
            label="Earnest Money"
            value={money(earnestMoney)}
            tone="blue"
          />

          <ResultCard
            label="Total Consideration"
            value={money(totalConsideration)}
            tone="green"
          />
        </div>

        <div style={outputBoxStyle}>
          <strong>Deal Summary</strong>

          <p>
            {assignor || 'Assignor'} intends to assign the purchase
            agreement to {assignee || 'Assignee'} for an assignment fee
            of {money(assignmentFee)}.
          </p>

          <p>
            Original contract price: {money(purchasePrice)}.
          </p>

          <p>
            Assignment price: {money(assignmentPrice)}.
          </p>

          {closingDate && (
            <p>Target closing date: {closingDate}.</p>
          )}
        </div>

        <div style={actionRowStyle}>
          <ActionButton
            tone="gold"
            onClick={() => {
              const text = [
                'ASSIGNMENT DEAL SUMMARY',
                `Assignor: ${assignor || '—'}`,
                `Assignee: ${assignee || '—'}`,
                `Original Purchase Price: ${money(purchasePrice)}`,
                `Assignment Fee: ${money(assignmentFee)}`,
                `Assignment Price: ${money(assignmentPrice)}`,
                `Earnest Money: ${money(earnestMoney)}`,
                `Closing Date: ${closingDate || '—'}`,
              ].join('\n')

              navigator.clipboard?.writeText(text)
            }}
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
}: {
  lead: Lead | null
}) {
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [strategy, setStrategy] = useState('Fix & Flip')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(
    lead?.estimated_value ?? lead?.house_value ?? 0
  )
  const [area, setArea] = useState(lead?.city ?? '')
  const [message, setMessage] = useState('')

  const propertyValue =
    lead?.estimated_value ??
    lead?.house_value ??
    lead?.market_value ??
    0

  const matchScore = useMemo(() => {
    let score = 50

    if (maxPrice >= propertyValue && maxPrice > 0) score += 20
    if (minPrice <= propertyValue) score += 10
    if (area && lead?.city?.toLowerCase() === area.toLowerCase()) score += 10
    if (strategy) score += 10

    return Math.min(score, 100)
  }, [maxPrice, minPrice, area, propertyValue, strategy, lead])

  function generateBlast() {
    const address =
      lead?.property_address_1 || 'off-market property'

    const city =
      lead?.city || area || 'the target market'

    const price = propertyValue
      ? money(propertyValue)
      : 'price available upon request'

    setMessage(
      [
        `OFF-MARKET OPPORTUNITY — ${address}`,
        '',
        `Location: ${city}`,
        `Estimated Value: ${price}`,
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
        title="Buyer Criteria"
        subtitle="Enter a buyer's acquisition preferences."
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
            tone={matchScore >= 80 ? 'green' : 'gold'}
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
          <ActionButton tone="gold" onClick={generateBlast}>
            Generate Buyer Blast
          </ActionButton>
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Generated buyer outreach will appear here..."
          style={textareaStyle}
        />
      </SectionCard>
    </div>
  )
}

/* =========================================================
   CLOSING COST
========================================================= */

function ClosingCostTool({
  lead,
}: {
  lead: Lead | null
}) {
  const [purchasePrice, setPurchasePrice] = useState(
    lead?.estimated_value ?? lead?.house_value ?? 0
  )

  const [title, setTitle] = useState(1500)
  const [recording, setRecording] = useState(100)
  const [transferTax, setTransferTax] = useState(0)
  const [propertyTax, setPropertyTax] = useState(0)
  const [insurance, setInsurance] = useState(0)
  const [inspection, setInspection] = useState(500)
  const [other, setOther] = useState(0)

  const total =
    title +
    recording +
    transferTax +
    propertyTax +
    insurance +
    inspection +
    other

  const cashRequired = purchasePrice + total

  return (
    <div style={toolGridStyle}>
      <SectionCard
        title="Transaction Inputs"
        subtitle="Estimate buyer-side closing expenses."
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
            label="Other"
            value={other}
            onChange={setOther}
            prefix="$"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Closing Analysis"
        subtitle="Projected transaction cost."
      >
        <div style={resultGridStyle}>
          <ResultCard
            label="Purchase Price"
            value={money(purchasePrice)}
          />

          <ResultCard
            label="Closing Costs"
            value={money(total)}
            tone="gold"
          />

          <ResultCard
            label="Cash Required"
            value={money(cashRequired)}
            tone="green"
          />

          <ResultCard
            label="Cost %"
            value={
              purchasePrice
                ? `${((total / purchasePrice) * 100).toFixed(2)}%`
                : '0%'
            }
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

type Comp = {
  id: number
  salePrice: number
  sqft: number
  distance: number
  ageMonths: number
}

function CompsAnalyzerTool({
  lead,
}: {
  lead: Lead | null
}) {
  const subjectSqft = lead?.square_feet ?? 0

  const [comps, setComps] = useState<Comp[]>([
    {
      id: 1,
      salePrice: 0,
      sqft: subjectSqft,
      distance: 0,
      ageMonths: 0,
    },
    {
      id: 2,
      salePrice: 0,
      sqft: subjectSqft,
      distance: 0,
      ageMonths: 0,
    },
    {
      id: 3,
      salePrice: 0,
      sqft: subjectSqft,
      distance: 0,
      ageMonths: 0,
    },
  ])

  const calculated = comps.filter(
    (comp) => comp.salePrice > 0 && comp.sqft > 0
  )

  const averagePrice =
    calculated.length > 0
      ? calculated.reduce((sum, comp) => sum + comp.salePrice, 0) /
        calculated.length
      : 0

  const averagePricePerSqft =
    calculated.length > 0
      ? calculated.reduce(
          (sum, comp) => sum + comp.salePrice / comp.sqft,
          0
        ) / calculated.length
      : 0

  const weightedArv =
    subjectSqft > 0
      ? subjectSqft * averagePricePerSqft
      : averagePrice

  const confidence =
    calculated.length >= 3
      ? 'High'
      : calculated.length === 2
        ? 'Moderate'
        : calculated.length === 1
          ? 'Low'
          : 'Insufficient'

  function updateComp(
    id: number,
    key: keyof Comp,
    value: number
  ) {
    setComps((current) =>
      current.map((comp) =>
        comp.id === id
          ? {
              ...comp,
              [key]: value,
            }
          : comp
      )
    )
  }

  return (
    <div style={toolGridStyle}>
      <SectionCard
        title="Comparable Sales"
        subtitle="Enter comparable sales to estimate ARV."
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Comp</th>
                <th style={thStyle}>Sale Price</th>
                <th style={thStyle}>Sq Ft</th>
                <th style={thStyle}>Miles</th>
                <th style={thStyle}>Age</th>
                <th style={thStyle}>$/SF</th>
              </tr>
            </thead>

            <tbody>
              {comps.map((comp) => (
                <tr key={comp.id}>
                  <td style={tdStyle}>Comp {comp.id}</td>

                  <td style={tdStyle}>
                    <input
                      type="number"
                      value={comp.salePrice}
                      onChange={(event) =>
                        updateComp(
                          comp.id,
                          'salePrice',
                          Number(event.target.value) || 0
                        )
                      }
                      style={tableInputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="number"
                      value={comp.sqft}
                      onChange={(event) =>
                        updateComp(
                          comp.id,
                          'sqft',
                          Number(event.target.value) || 0
                        )
                      }
                      style={tableInputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="number"
                      step="0.1"
                      value={comp.distance}
                      onChange={(event) =>
                        updateComp(
                          comp.id,
                          'distance',
                          Number(event.target.value) || 0
                        )
                      }
                      style={tableInputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="number"
                      value={comp.ageMonths}
                      onChange={(event) =>
                        updateComp(
                          comp.id,
                          'ageMonths',
                          Number(event.target.value) || 0
                        )
                      }
                      style={tableInputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    {comp.salePrice && comp.sqft
                      ? money(comp.salePrice / comp.sqft)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={actionRowStyle}>
          <ActionButton
            tone="gold"
            onClick={() =>
              setComps((current) => [
                ...current,
                {
                  id: current.length + 1,
                  salePrice: 0,
                  sqft: subjectSqft,
                  distance: 0,
                  ageMonths: 0,
                },
              ])
            }
          >
            + Add Comp
          </ActionButton>
        </div>
      </SectionCard>

      <SectionCard
        title="ARV Analysis"
        subtitle="Weighted using average comparable price per square foot."
      >
        <div style={resultGridStyle}>
          <ResultCard
            label="Valid Comps"
            value={String(calculated.length)}
            tone="blue"
          />

          <ResultCard
            label="Average Sale Price"
            value={money(averagePrice)}
          />

          <ResultCard
            label="Average $/SF"
            value={`$${averagePricePerSqft.toFixed(2)}`}
            tone="blue"
          />

          <ResultCard
            label="Estimated ARV"
            value={money(weightedArv)}
            tone="green"
          />

          <ResultCard
            label="Confidence"
            value={confidence}
            tone={confidence === 'High' ? 'green' : 'gold'}
          />
        </div>
      </SectionCard>
    </div>
  )
}

/* =========================================================
   CONTRACT GENERATOR
========================================================= */

function ContractGeneratorTool({
  lead,
}: {
  lead: Lead | null
}) {
  const [buyer, setBuyer] = useState('')
  const [seller, setSeller] = useState(lead?.owner_name ?? '')
  const [purchasePrice, setPurchasePrice] = useState(
    lead?.estimated_value ?? lead?.house_value ?? 0
  )
  const [earnestMoney, setEarnestMoney] = useState(5000)
  const [closingDate, setClosingDate] = useState('')
  const [financing, setFinancing] = useState('Cash')
  const [contingencies, setContingencies] = useState(
    'Inspection and due diligence'
  )
  const [generated, setGenerated] = useState('')

  function generate() {
    setGenerated(
      [
        'PURCHASE AGREEMENT TERM SUMMARY',
        '',
        `Buyer: ${buyer || '—'}`,
        `Seller: ${seller || '—'}`,
        `Property: ${lead?.property_address_1 || '—'}`,
        `Purchase Price: ${money(purchasePrice)}`,
        `Earnest Money: ${money(earnestMoney)}`,
        `Closing Date: ${closingDate || '—'}`,
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
        <div style={formGridStyle}>
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
            value={purchasePrice}
            onChange={setPurchasePrice}
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
          />

          <SelectInput
            label="Financing"
            value={financing}
            onChange={setFinancing}
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

        <div style={{ marginTop: 12 }}>
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Contingencies</span>

            <textarea
              value={contingencies}
              onChange={(event) =>
                setContingencies(event.target.value)
              }
              style={textareaStyle}
            />
          </label>
        </div>

        <div style={actionRowStyle}>
          <ActionButton tone="gold" onClick={generate}>
            Generate Term Summary
          </ActionButton>
        </div>
      </SectionCard>

      <SectionCard
        title="Generated Contract Data"
        subtitle="Structured deal information."
      >
        <textarea
          value={generated}
          onChange={(event) => setGenerated(event.target.value)}
          placeholder="Your generated contract terms will appear here..."
          style={{
            ...textareaStyle,
            minHeight: 330,
          }}
        />
      </SectionCard>
    </div>
  )
}

/* =========================================================
   MARKETING ROI
========================================================= */

function MarketingROITool() {
  const [spend, setSpend] = useState(0)
  const [leads, setLeads] = useState(0)
  const [contacts, setContacts] = useState(0)
  const [appointments, setAppointments] = useState(0)
  const [offers, setOffers] = useState(0)
  const [contracts, setContracts] = useState(0)
  const [closings, setClosings] = useState(0)
  const [revenue, setRevenue] = useState(0)

  const costPerLead = leads ? spend / leads : 0
  const costPerContract = contracts ? spend / contracts : 0
  const conversionRate = leads ? (closings / leads) * 100 : 0
  const roi = spend ? ((revenue - spend) / spend) * 100 : 0
  const roas = spend ? revenue / spend : 0

  return (
    <div style={toolGridStyle}>
      <SectionCard
        title="Marketing Funnel"
        subtitle="Enter campaign performance."
      >
        <div style={formGridStyle}>
          <NumberInput
            label="Marketing Spend"
            value={spend}
            onChange={setSpend}
            prefix="$"
          />

          <NumberInput
            label="Leads"
            value={leads}
            onChange={setLeads}
          />

          <NumberInput
            label="Contacts"
            value={contacts}
            onChange={setContacts}
          />

          <NumberInput
            label="Appointments"
            value={appointments}
            onChange={setAppointments}
          />

          <NumberInput
            label="Offers"
            value={offers}
            onChange={setOffers}
          />

          <NumberInput
            label="Contracts"
            value={contracts}
            onChange={setContracts}
          />

          <NumberInput
            label="Closings"
            value={closings}
            onChange={setClosings}
          />

          <NumberInput
            label="Revenue"
            value={revenue}
            onChange={setRevenue}
            prefix="$"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Marketing Performance"
        subtitle="Calculated campaign economics."
      >
        <div style={resultGridStyle}>
          <ResultCard
            label="Cost Per Lead"
            value={money(costPerLead)}
            tone="gold"
          />

          <ResultCard
            label="Cost Per Contract"
            value={money(costPerContract)}
            tone="blue"
          />

          <ResultCard
            label="Lead → Close"
            value={`${conversionRate.toFixed(2)}%`}
            tone="green"
          />

          <ResultCard
            label="ROI"
            value={`${roi.toFixed(2)}%`}
            tone={roi >= 0 ? 'green' : 'gold'}
          />

          <ResultCard
            label="ROAS"
            value={`${roas.toFixed(2)}x`}
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

function RepairEstimatorTool() {
  const [roof, setRoof] = useState(0)
  const [hvac, setHvac] = useState(0)
  const [plumbing, setPlumbing] = useState(0)
  const [electrical, setElectrical] = useState(0)
  const [kitchen, setKitchen] = useState(0)
  const [bathrooms, setBathrooms] = useState(0)
  const [flooring, setFlooring] = useState(0)
  const [paint, setPaint] = useState(0)
  const [landscaping, setLandscaping] = useState(0)
  const [other, setOther] = useState(0)
  const [contingency, setContingency] = useState(10)

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

  const contingencyAmount = base * (contingency / 100)
  const total = base + contingencyAmount

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

  return (
    <div style={toolGridStyle}>
      <SectionCard
        title="Repair Budget"
        subtitle="Enter estimated costs by category."
      >
        <div style={formGridStyle}>
          <NumberInput
            label="Roof"
            value={roof}
            onChange={setRoof}
            prefix="$"
          />

          <NumberInput
            label="HVAC"
            value={hvac}
            onChange={setHvac}
            prefix="$"
          />

          <NumberInput
            label="Plumbing"
            value={plumbing}
            onChange={setPlumbing}
            prefix="$"
          />

          <NumberInput
            label="Electrical"
            value={electrical}
            onChange={setElectrical}
            prefix="$"
          />

          <NumberInput
            label="Kitchen"
            value={kitchen}
            onChange={setKitchen}
            prefix="$"
          />

          <NumberInput
            label="Bathrooms"
            value={bathrooms}
            onChange={setBathrooms}
            prefix="$"
          />

          <NumberInput
            label="Flooring"
            value={flooring}
            onChange={setFlooring}
            prefix="$"
          />

          <NumberInput
            label="Paint"
            value={paint}
            onChange={setPaint}
            prefix="$"
          />

          <NumberInput
            label="Landscaping"
            value={landscaping}
            onChange={setLandscaping}
            prefix="$"
          />

          <NumberInput
            label="Other"
            value={other}
            onChange={setOther}
            prefix="$"
          />

          <NumberInput
            label="Contingency"
            value={contingency}
            onChange={setContingency}
            suffix="%"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Repair Analysis"
        subtitle="Projected renovation budget."
      >
        <div style={resultGridStyle}>
          <ResultCard
            label="Base Repairs"
            value={money(base)}
            tone="gold"
          />

          <ResultCard
            label="Contingency"
            value={money(contingencyAmount)}
            tone="blue"
          />

          <ResultCard
            label="Total Repairs"
            value={money(total)}
            tone="green"
          />

          <ResultCard
            label="Repair Level"
            value={repairLevel}
            tone="gold"
          />
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
}: {
  lead: Lead | null
}) {
  const [leadType, setLeadType] = useState(
    lead?.lead_type || 'Distressed Seller'
  )

  const [motivation, setMotivation] = useState(
    'Needs a simple and convenient sale'
  )

  const [condition, setCondition] = useState(
    'Unknown'
  )

  const [objective, setObjective] = useState(
    'Qualify the seller and determine whether an offer makes sense'
  )

  const [objection, setObjection] = useState(
    'I need to think about it'
  )

  const [script, setScript] = useState('')

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
        `“Hi, this is Foundation Acquisitions. I’m reaching out about the property. I wanted to see if you had a few minutes to talk about it.”`,
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
    <div style={toolGridStyle}>
      <SectionCard
        title="Conversation Inputs"
        subtitle="Customize the script to the seller situation."
      >
        <div style={formGridStyle}>
          <SelectInput
            label="Lead Type"
            value={leadType}
            onChange={setLeadType}
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
            value={condition}
            onChange={setCondition}
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

        <div style={{ marginTop: 12 }}>
          <TextInput
            label="Motivation"
            value={motivation}
            onChange={setMotivation}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <TextInput
            label="Call Objective"
            value={objective}
            onChange={setObjective}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <TextInput
            label="Likely Objection"
            value={objection}
            onChange={setObjection}
          />
        </div>

        <div style={actionRowStyle}>
          <ActionButton tone="gold" onClick={generateScript}>
            Generate Script
          </ActionButton>
        </div>
      </SectionCard>

      <SectionCard
        title="Generated Script"
        subtitle="Editable conversation framework."
      >
        <textarea
          value={script}
          onChange={(event) => setScript(event.target.value)}
          placeholder="Your script will appear here..."
          style={{
            ...textareaStyle,
            minHeight: 500,
          }}
        />
      </SectionCard>
    </div>
  )
}

/* =========================================================
   SHARED STYLES
========================================================= */

const pageStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
}

const toolGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
  gap: 18,
  alignItems: 'start',
}

const toolHeaderStyle: CSSProperties = {
  borderRadius: 16,
  border: '1px solid rgba(214,166,75,0.15)',
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

const leadBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '5px 9px',
  borderRadius: 8,
  border: '1px solid rgba(214,166,75,0.25)',
  background: 'rgba(214,166,75,0.08)',
  color: '#d6a64b',
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
}

const leadGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 10,
}

const formGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
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
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  color: '#fff',
  padding: '0 11px',
  outline: 'none',
  fontSize: 12,
}

const resultGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
  border: '1px solid rgba(255,255,255,0.07)',
  background: 'rgba(0,0,0,0.25)',
  padding: 14,
  color: 'rgba(255,255,255,0.62)',
  fontSize: 12,
  lineHeight: 1.55,
}

const outputTextStyle: CSSProperties = {
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
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.25)',
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
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.4)',
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const tdStyle: CSSProperties = {
  padding: '9px 10px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 11,
}

const tableInputStyle: CSSProperties = {
  width: 100,
  minHeight: 34,
  boxSizing: 'border-box',
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
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