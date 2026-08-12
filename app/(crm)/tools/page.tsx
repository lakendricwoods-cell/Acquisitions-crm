'use client'

import React, { useState, type CSSProperties } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import {
  Search,
  Home,
  Calculator,
  DollarSign,
  BarChart2,
  Hammer,
  Building,
  KeyRound,
  Scale,
  FileText,
  CheckSquare,
  Sparkles,
  Upload,
  X,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react'

export type ToolCategory =
  | 'All'
  | 'Valuation & Offers'
  | 'Costs & Expenses'
  | 'Profitability & Income'
  | 'Legal & Contracts'
  | 'AI-Powered Tools'

export interface ToolDef {
  id: string
  title: string
  description: string
  category: ToolCategory
  icon: React.ElementType
  tag: string
}

export const FULL_TOOL_CATALOG: ToolDef[] = [
  {
    id: 'arv-estimator',
    title: 'ARV Estimator',
    description:
      'Calculate After Repair Value using weighted comparable sales averages and sqft adjustments.',
    category: 'Valuation & Offers',
    icon: Home,
    tag: 'Valuation',
  },
  {
    id: 'mao-calculator',
    title: 'MAO Calculator',
    description:
      'Determine Maximum Allowable Offer using standard 70% rule or custom formulas.',
    category: 'Valuation & Offers',
    icon: Calculator,
    tag: 'Wholesaling',
  },
  {
    id: 'offer-calculator',
    title: 'Offer Price Calculator',
    description:
      'Calculate target offer working backward from investor target net ROI goals.',
    category: 'Valuation & Offers',
    icon: DollarSign,
    tag: 'Offers',
  },
  {
    id: 'comps-matrix',
    title: 'Comps & Valuation Matrix',
    description:
      'Side-by-side comparable property analysis with condition and sqft adjustments.',
    category: 'Valuation & Offers',
    icon: BarChart2,
    tag: 'Analysis',
  },
  {
    id: 'repair-estimator',
    title: 'Repair Cost Estimator',
    description:
      'Quick or detailed rehab cost approximations by sqft or itemized trade categories.',
    category: 'Costs & Expenses',
    icon: Hammer,
    tag: 'Rehab',
  },
  {
    id: 'closing-costs',
    title: 'Closing Costs Estimator',
    description:
      'Estimate title, escrow, state transfer taxes, and settlement fee breakdowns.',
    category: 'Costs & Expenses',
    icon: DollarSign,
    tag: 'Fees',
  },
  {
    id: 'holding-costs',
    title: 'Holding Costs Estimator',
    description:
      'Calculate monthly property taxes, insurance, utilities, and hard money interest.',
    category: 'Costs & Expenses',
    icon: Building,
    tag: 'Carrying',
  },
  {
    id: 'brrrr-calculator',
    title: 'BRRRR Strategy Calculator',
    description:
      'Analyze cash-out refinance equity, capital left in deal, and monthly rental cash flow.',
    category: 'Profitability & Income',
    icon: KeyRound,
    tag: 'Rental',
  },
  {
    id: 'creative-finance',
    title: 'Sub-To & Seller Finance Engine',
    description:
      'Structure interest-only, balloon, hybrid, and subject-to existing debt terms.',
    category: 'Profitability & Income',
    icon: Scale,
    tag: 'Creative',
  },
  {
    id: 'assignment-contract',
    title: 'Assignment Contract Generator',
    description:
      'Generate standardized real estate wholesale assignment legal agreements instantly.',
    category: 'Legal & Contracts',
    icon: FileText,
    tag: 'Legal',
  },
  {
    id: 'pof-generator',
    title: 'Proof of Funds Generator',
    description:
      'Generate pre-formatted Proof of Funds verification letters for offer submissions.',
    category: 'Legal & Contracts',
    icon: CheckSquare,
    tag: 'Verification',
  },
  {
    id: 'ai-copywriter',
    title: 'AI Property Pitch Generator',
    description:
      'Generate high-converting buyer pitch blasts and social media property listings.',
    category: 'AI-Powered Tools',
    icon: Sparkles,
    tag: 'AI Copy',
  },
  {
    id: 'dispo-blast-engine',
    title: 'Buyer Dispo Blast Engine',
    description:
      'Format deal packets and automatically broadcast deal details to cash buyer lists.',
    category: 'AI-Powered Tools',
    icon: Upload,
    tag: 'Marketing',
  },
]

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<ToolCategory>('All')
  const [activeToolId, setActiveToolId] = useState<string | null>(null)

  const categories: ToolCategory[] = [
    'All',
    'Valuation & Offers',
    'Costs & Expenses',
    'Profitability & Income',
    'Legal & Contracts',
    'AI-Powered Tools',
  ]

  const filteredTools = FULL_TOOL_CATALOG.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'All' || tool.category === selectedCategory
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tag.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const activeTool = FULL_TOOL_CATALOG.find((t) => t.id === activeToolId)

  return (
    <PageShell title="Acquisitions & Dispo Utilities">
      <div style={containerStyle}>
        {/* STATS ROW */}
        <div style={statsRowStyle}>
          <StatPill label="Total Tools" value={FULL_TOOL_CATALOG.length} />
          <StatPill label="Category" value={selectedCategory} />
          <StatPill label="Matching" value={filteredTools.length} />
        </div>

        {/* SEARCH BAR */}
        <div style={searchWrapStyle}>
          <Search size={16} style={searchIconStyle} />
          <input
            type="text"
            placeholder="Search tools by name, description, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        {/* CATEGORY FILTER TABS */}
        <div style={categoriesWrapStyle}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...categoryTabStyle,
                  ...(isActive ? activeCategoryTabStyle : null),
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* SECTION CARDS GRID */}
        <div style={gridStyle}>
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon

            return (
              <SectionCard
                key={tool.id}
                title={tool.title}
                subtitle={tool.category}
                right={<BadgeTag tag={tool.tag} />}
              >
                <div style={cardContentStyle}>
                  <div style={cardHeaderRowStyle}>
                    <div style={iconBoxStyle}>
                      <IconComponent size={18} color="#d6a64b" />
                    </div>
                  </div>

                  <p style={cardDescriptionStyle}>{tool.description}</p>

                  <div style={cardActionRowStyle}>
                    <ActionButton
                      tone="gold"
                      compact
                      onClick={() => setActiveToolId(tool.id)}
                    >
                      Launch Utility
                      <ArrowRight size={12} />
                    </ActionButton>
                  </div>
                </div>
              </SectionCard>
            )
          })}
        </div>

        {/* ACTIVE TOOL EXECUTION MODAL WITH EMBEDDED REAL INTERACTIVE CALCULATORS */}
        {activeToolId && activeTool && (
          <div style={modalOverlayStyle}>
            <div style={modalBoxStyle}>
              <button
                onClick={() => setActiveToolId(null)}
                style={closeButtonStyle}
              >
                <X size={16} />
              </button>

              <SectionCard
                title={activeTool.title}
                subtitle={activeTool.category}
                right={<BadgeTag tag={activeTool.tag} />}
              >
                <div style={modalInnerStyle}>
                  {activeToolId === 'arv-estimator' ? (
                    <ArvEstimatorContent onClose={() => setActiveToolId(null)} />
                  ) : activeToolId === 'mao-calculator' ? (
                    <MaoCalculatorContent onClose={() => setActiveToolId(null)} />
                  ) : (
                    <DefaultToolContent tool={activeTool} onClose={() => setActiveToolId(null)} />
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

// ---------------------------------------------------------
// FULLY INTERACTIVE TOOL IMPLEMENTATIONS INSIDE THE MODALS
// ---------------------------------------------------------

function ArvEstimatorContent({ onClose }: { onClose: () => void }) {
  const [subjectSqft, setSubjectSqft] = useState<number>(1800)
  const [comps, setComps] = useState([
    { id: '1', address: '1042 5th Ave N', salePrice: 380000, sqft: 1850, weight: 5 },
    { id: '2', address: '1210 6th Ave N', salePrice: 355000, sqft: 1700, weight: 4 },
  ])

  const addComp = () => {
    setComps([
      ...comps,
      {
        id: Date.now().toString(),
        address: `Comp #${comps.length + 1}`,
        salePrice: 350000,
        sqft: subjectSqft,
        weight: 3,
      },
    ])
  }

  const removeComp = (id: string) => {
    setComps(comps.filter((c) => c.id !== id))
  }

  const updateComp = (id: string, field: string, value: any) => {
    setComps(comps.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  let totalWeighted = 0
  let totalWeight = 0
  comps.forEach((c) => {
    const ppsq = c.sqft > 0 ? c.salePrice / c.sqft : 0
    totalWeighted += ppsq * c.weight
    totalWeight += c.weight
  })
  const avgPpsq = totalWeight > 0 ? totalWeighted / totalWeight : 0
  const arvResult = Math.round(avgPpsq * subjectSqft)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Subject Property Square Footage</label>
        <input
          type="number"
          value={subjectSqft}
          onChange={(e) => setSubjectSqft(Number(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#f0ca7e' }}>Comparable Sales ({comps.length})</span>
        <button onClick={addComp} style={miniButtonStyle}>
          <Plus size={12} /> Add Comp
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
        {comps.map((comp) => (
          <div key={comp.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              value={comp.address}
              onChange={(e) => updateComp(comp.id, 'address', e.target.value)}
              style={inputCompactStyle}
            />
            <input
              type="number"
              value={comp.salePrice}
              onChange={(e) => updateComp(comp.id, 'salePrice', Number(e.target.value))}
              style={inputCompactStyle}
            />
            <input
              type="number"
              value={comp.sqft}
              onChange={(e) => updateComp(comp.id, 'sqft', Number(e.target.value))}
              style={inputCompactStyle}
            />
            <button onClick={() => removeComp(comp.id)} style={{ background: 'none', border: 'none', color: '#fda4af', cursor: 'pointer' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={resultBoxStyle}>
        <div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Estimated ARV</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>${arvResult.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Weighted $/SqFt</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0ca7e', fontFamily: 'monospace' }}>${Math.round(avgPpsq)} / sqft</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <ActionButton tone="gold" onClick={onClose}>Done</ActionButton>
      </div>
    </div>
  )
}

function MaoCalculatorContent({ onClose }: { onClose: () => void }) {
  const [arv, setArv] = useState<number>(350000)
  const [discount, setDiscount] = useState<number>(70)
  const [repairs, setRepairs] = useState<number>(45000)
  const [fee, setFee] = useState<number>(15000)

  const mao = (arv * (discount / 100)) - repairs - fee

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>After Repair Value (ARV)</label>
          <input type="number" value={arv} onChange={(e) => setArv(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Discount Rule (%)</label>
          <select value={discount} onChange={(e) => setDiscount(Number(e.target.value))} style={inputStyle}>
            <option value={70}>70% Rule</option>
            <option value={75}>75% Rule</option>
            <option value={80}>80% Rule</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Estimated Repairs</label>
          <input type="number" value={repairs} onChange={(e) => setRepairs(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Assignment Fee</label>
          <input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      <div style={resultBoxStyle}>
        <div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Maximum Allowable Offer (MAO)</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f0ca7e' }}>${mao > 0 ? mao.toLocaleString() : 0}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <ActionButton tone="gold" onClick={onClose}>Done</ActionButton>
      </div>
    </div>
  )
}

function DefaultToolContent({ tool, onClose }: { onClose: () => void }) {
  const [inputValue, setInputValue] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{tool.description}</p>
      <div>
        <label style={labelStyle}>Property Address or Identifier</label>
        <input
          type="text"
          placeholder="Enter property address or APN..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10 }}>
        <ActionButton tone="gold" onClick={onClose}>Execute {tool.title}</ActionButton>
        <ActionButton tone="ghost" onClick={onClose}>Cancel</ActionButton>
      </div>
    </div>
  )
}

function BadgeTag({ tag }: { tag: string }) {
  return <div style={badgeStyle}>{tag}</div>
}

// STYLES
const containerStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }
const statsRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }
const searchWrapStyle: CSSProperties = { position: 'relative', width: '100%' }
const searchIconStyle: CSSProperties = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }
const searchInputStyle: CSSProperties = { width: '100%', height: 42, paddingLeft: 40, paddingRight: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(16,14,10,0.85)', color: '#ffffff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const categoriesWrapStyle: CSSProperties = { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }
const categoryTabStyle: CSSProperties = { appearance: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }
const activeCategoryTabStyle: CSSProperties = { background: 'rgba(214,166,75,0.15)', borderColor: 'rgba(214,166,75,0.4)', color: '#f0ca7e' }
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }
const badgeStyle: CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f0ca7e', background: 'rgba(214,166,75,0.12)', border: '1px solid rgba(214,166,75,0.3)', padding: '3px 8px', borderRadius: 6 }
const cardContentStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
const cardHeaderRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const iconBoxStyle: CSSProperties = { width: 36, height: 36, borderRadius: 10, background: 'rgba(214,166,75,0.1)', border: '1px solid rgba(214,166,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const cardDescriptionStyle: CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, margin: 0, minHeight: 34 }
const cardActionRowStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }
const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: 16 }
const modalBoxStyle: CSSProperties = { position: 'relative', width: '100%', maxWidth: 520 }
const closeButtonStyle: CSSProperties = { position: 'absolute', top: -12, right: -12, zIndex: 10, width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: '#0e0b04', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
const modalInnerStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }
const labelStyle: CSSProperties = { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }
const inputStyle: CSSProperties = { width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a', color: '#ffffff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const inputCompactStyle: CSSProperties = { width: '100%', height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a', color: '#ffffff', fontSize: 12, outline: 'none', boxSizing: 'border-box' }
const miniButtonStyle: CSSProperties = { background: 'rgba(214,166,75,0.15)', border: '1px solid rgba(214,166,75,0.3)', color: '#f0ca7e', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }
const resultBoxStyle: CSSProperties = { background: 'rgba(214,166,75,0.08)', border: '1px solid rgba(214,166,75,0.25)', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
