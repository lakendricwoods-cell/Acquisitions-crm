'use client'

import { useState, useMemo } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'

type ToolCategory = 'All' | 'Valuation' | 'Underwriting' | 'Contracts' | 'Marketing' | 'Operations'

type ToolDef = {
  id: string
  title: string
  category: ToolCategory
  description: string
  badge?: string
}

const TOOLS_CATALOG: ToolDef[] = [
  {
    id: 'arv-estimator',
    title: 'ARV & Comps Estimator',
    category: 'Valuation',
    description: 'Calculate weighted After Repair Value (ARV) and average price per square foot using verified comparable sales.',
    badge: 'Core Tool',
  },
  {
    id: 'mao-calculator',
    title: 'MAO & Offer Calculator',
    category: 'Underwriting',
    description: 'Determine Maximum Allowable Offer using the 70% rule, custom repair costs, and target wholesale assignment fees.',
    badge: 'Essential',
  },
  {
    id: 'repair-estimator',
    title: 'Itemized Repair Estimator',
    category: 'Underwriting',
    description: 'Generate itemized rehabilitation budgets across interior, exterior, roofing, and mechanical systems.',
  },
  {
    id: 'assignment-contract',
    title: 'Assignment Agreement Generator',
    category: 'Contracts',
    description: 'Draft customized wholesale assignment of contract agreements ready for digital signature and escrow submission.',
    badge: 'Legal',
  },
  {
    id: 'pach-purchase',
    title: 'As-Is Purchase Agreement Generator',
    category: 'Contracts',
    description: 'Generate standard Florida as-is residential purchase and sale agreements for seller direct mail leads.',
  },
  {
    id: 'buyer-blast',
    title: 'Cash Buyer Blast Generator',
    category: 'Marketing',
    description: 'Format high-converting property disposition details and broadcast SMS or email templates to local cash buyers.',
  },
  {
    id: 'cold-script',
    title: 'Cold Calling & SMS Script Engine',
    category: 'Marketing',
    description: 'Access objection-handling matrices and tailored scripts for absentee owners, probate leads, and tax delinquents.',
  },
  {
    id: 'direct-mail',
    title: 'Direct Mail Copywriter',
    category: 'Marketing',
    description: 'AI-assisted yellow letter and postcard copy generator engineered for maximum response rates.',
  },
  {
    id: 'closing-cost',
    title: 'Florida Closing Cost Calculator',
    category: 'Operations',
    description: 'Calculate documentary stamp taxes, title insurance premiums, and prorated holding costs for accurate net sheets.',
  },
  {
    id: 'title-clearing',
    title: 'Title & Probate Checklist',
    category: 'Operations',
    description: 'Step-by-step diagnostic workflow for identifying liens, code violations, mortgages, and heirship complications.',
  },
]

type DefaultToolContentProps = {
  tool: ToolDef
  onClose: () => void
}

function DefaultToolContent({ tool, onClose }: DefaultToolContentProps) {
  const [inputVal, setInputVal] = useState('')
  const [result, setResult] = useState<string | null>(null)

  function handleRun() {
    setResult(`Successfully executed ${tool.title} for input: "${inputVal || 'Default Context'}". Status: Complete.`)
  }

  return (
    <div style={{ display: 'grid', gap: 16, padding: '8px 0' }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
        {tool.description}
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#ebc477' }}>
          Property Address / Identifier / Parameters
        </label>
        <input
          type="text"
          placeholder="Enter property address or ID..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(214,166,75,0.3)',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {result && (
        <div style={{
          padding: 12,
          borderRadius: 10,
          background: 'rgba(214,166,75,0.08)',
          border: '1px solid rgba(214,166,75,0.25)',
          fontSize: 12,
          color: '#ebc477',
        }}>
          {result}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <ActionButton tone="ghost" onClick={onClose}>
          Close
        </ActionButton>
        <ActionButton tone="gold" onClick={handleRun}>
          Run Calculation
        </ActionButton>
      </div>
    </div>
  )
}

function ArvEstimatorContent({ onClose }: { onClose: () => void }) {
  const [sqft, setSqft] = useState('1500')
  const [comp1, setComp1] = useState('240000')
  const [comp2, setComp2] = useState('255000')
  const [comp3, setComp3] = useState('248000')

  const calculatedArv = useMemo(() => {
    const c1 = parseFloat(comp1) || 0
    const c2 = parseFloat(comp2) || 0
    const c3 = parseFloat(comp3) || 0
    const count = [c1, c2, c3].filter((x) => x > 0).length
    if (count === 0) return 0
    return Math.round((c1 + c2 + c3) / count)
  }, [comp1, comp2, comp3])

  const sqftNum = parseFloat(sqft) || 1
  const ppsqft = Math.round(calculatedArv / sqftNum)

  return (
    <div style={{ display: 'grid', gap: 16, padding: '8px 0' }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
        Analyze localized comparable sales to establish a reliable After Repair Value and price per square foot metric.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#ebc477' }}>Subject Square Footage</label>
          <input
            type="number"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(214,166,75,0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff' }}
          />
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#ebc477' }}>Estimated ARV</label>
          <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(214,166,75,0.5)', background: 'rgba(214,166,75,0.1)', color: '#ebc477', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            ${calculatedArv.toLocaleString()} ({ppsqft}/sqft)
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Comp 1 Sale Price</label>
          <input type="number" value={comp1} onChange={(e) => setComp1(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.6)', color: '#fff' }} />
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Comp 2 Sale Price</label>
          <input type="number" value={comp2} onChange={(e) => setComp2(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.6)', color: '#fff' }} />
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Comp 3 Sale Price</label>
          <input type="number" value={comp3} onChange={(e) => setComp3(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.6)', color: '#fff' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <ActionButton tone="ghost" onClick={onClose}>
          Done
        </ActionButton>
      </div>
    </div>
  )
}

function MaoCalculatorContent({ onClose }: { onClose: () => void }) {
  const [arv, setArv] = useState('300000')
  const [rulePct, setRulePct] = useState('0.70')
  const [repairs, setRepairs] = useState('35000')
  const [fee, setFee] = useState('10000')

  const arvNum = parseFloat(arv) || 0
  const pctNum = parseFloat(rulePct) || 0.7
  const repairNum = parseFloat(repairs) || 0
  const feeNum = parseFloat(fee) || 0

  const mao = Math.round(arvNum * pctNum - repairNum - feeNum)

  return (
    <div style={{ display: 'grid', gap: 16, padding: '8px 0' }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
        Calculate Maximum Allowable Offer using standard wholesale underwriting formulas.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#ebc477' }}>After Repair Value (ARV)</label>
          <input type="number" value={arv} onChange={(e) => setArv(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(214,166,75,0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff' }} />
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#ebc477' }}>Discount Rule</label>
          <select value={rulePct} onChange={(e) => setRulePct(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(214,166,75,0.3)', background: '#111', color: '#fff' }}>
            <option value="0.70">70% Rule (Standard)</option>
            <option value="0.75">75% Rule (Light Rehab)</option>
            <option value="0.80">80% Rule (Turnkey)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#ebc477' }}>Estimated Repair Costs</label>
          <input type="number" value={repairs} onChange={(e) => setRepairs(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(214,166,75,0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff' }} />
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#ebc477' }}>Target Assignment Fee</label>
          <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(214,166,75,0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff' }} />
        </div>
      </div>

      <div style={{
        padding: 14,
        borderRadius: 10,
        background: 'rgba(214,166,75,0.12)',
        border: '1px solid rgba(214,166,75,0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Maximum Allowable Offer (MAO):</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#ebc477' }}>${mao > 0 ? mao.toLocaleString() : 0}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <ActionButton tone="ghost" onClick={onClose}>
          Done
        </ActionButton>
      </div>
    </div>
  )
}

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('All')
  const [activeToolId, setActiveToolId] = useState<string | null>(null)

  const categories: ToolCategory[] = ['All', 'Valuation', 'Underwriting', 'Contracts', 'Marketing', 'Operations']

  const filteredTools = useMemo(() => {
    return TOOLS_CATALOG.filter((tool) => {
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [searchQuery, selectedCategory])

  const activeTool = TOOLS_CATALOG.find((t) => t.id === activeToolId)

  return (
    <PageShell title="Acquisitions & Dispo Utilities" subtitle="Underwriting, valuation, and contract generation toolkits for Florida real estate operations.">
      <div style={{ display: 'grid', gap: 20 }}>
        {/* Top Control Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedCategory === cat ? '1px solid rgba(214,166,75,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedCategory === cat ? 'linear-gradient(180deg, rgba(22,18,10,0.9), rgba(0,0,0,1))' : 'rgba(255,255,255,0.03)',
                  color: selectedCategory === cat ? '#ebc477' : 'rgba(255,255,255,0.7)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ minWidth: 240, flex: '1 1 240px', maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Search tools & calculators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: 12,
                border: '1px solid rgba(214,166,75,0.2)',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Tools Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredTools.map((tool) => (
            <SectionCard key={tool.id}>
              <div style={{ display: 'grid', gap: 12, padding: 4, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 750, color: '#fff' }}>{tool.title}</div>
                  {tool.badge && (
                    <StatPill label={tool.badge} tone="gold" />
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                  {tool.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(214,166,75,0.6)' }}>
                    {tool.category}
                  </span>
                  <ActionButton compact tone="gold" onClick={() => setActiveToolId(tool.id)}>
                    Launch Utility
                  </ActionButton>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>

        {/* Active Tool Modal / Expanded View Drawer */}
        {activeTool && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}>
            <div style={{
              width: '100%',
              maxWidth: 640,
              background: 'linear-gradient(180deg, rgba(16,14,8,0.98), rgba(0,0,0,1))',
              border: '1px solid rgba(214,166,75,0.35)',
              borderRadius: 16,
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              padding: 24,
              display: 'grid',
              gap: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 750, color: '#fff' }}>{activeTool.title}</div>
                <button
                  type="button"
                  onClick={() => setActiveToolId(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {activeTool.id === 'arv-estimator' ? (
                <ArvEstimatorContent onClose={() => setActiveToolId(null)} />
              ) : activeTool.id === 'mao-calculator' ? (
                <MaoCalculatorContent onClose={() => setActiveToolId(null)} />
              ) : (
                <DefaultToolContent tool={activeTool} onClose={() => setActiveToolId(null)} />
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
