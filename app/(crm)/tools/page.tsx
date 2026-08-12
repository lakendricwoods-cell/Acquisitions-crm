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

        {/* ACTIVE TOOL EXECUTION MODAL */}
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
                  <p style={modalDescriptionStyle}>{activeTool.description}</p>

                  <div style={modalPlaceholderStyle}>
                    <div style={iconBoxStyle}>
                      {React.createElement(activeTool.icon, {
                        size: 24,
                        color: '#d6a64b',
                      })}
                    </div>
                    <span style={modalNoticeStyle}>
                      Utility Engine Ready (`{activeTool.id}`)
                    </span>
                  </div>

                  <div style={modalActionsStyle}>
                    <ActionButton tone="gold" onClick={() => setActiveToolId(null)}>
                      Run Analysis
                    </ActionButton>
                    <ActionButton
                      tone="ghost"
                      onClick={() => setActiveToolId(null)}
                    >
                      Close Engine
                    </ActionButton>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

function BadgeTag({ tag }: { tag: string }) {
  return <div style={badgeStyle}>{tag}</div>
}

// INLINE STYLES MATCHING THE UI DESIGN SYSTEM
const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  width: '100%',
}

const statsRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 12,
}

const searchWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
}

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'rgba(255,255,255,0.4)',
}

const searchInputStyle: CSSProperties = {
  width: '100%',
  height: 42,
  paddingLeft: 40,
  paddingRight: 16,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(16,14,10,0.85)',
  color: '#ffffff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

const categoriesWrapStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 4,
}

const categoryTabStyle: CSSProperties = {
  appearance: 'none',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.6)',
  padding: '6px 14px',
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const activeCategoryTabStyle: CSSProperties = {
  background: 'rgba(214,166,75,0.15)',
  borderColor: 'rgba(214,166,75,0.4)',
  color: '#f0ca7e',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
}

const badgeStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#f0ca7e',
  background: 'rgba(214,166,75,0.12)',
  border: '1px solid rgba(214,166,75,0.3)',
  padding: '3px 8px',
  borderRadius: 6,
}

const cardContentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const cardHeaderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const iconBoxStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'rgba(214,166,75,0.1)',
  border: '1px solid rgba(214,166,75,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const cardDescriptionStyle: CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.6)',
  lineHeight: 1.4,
  margin: 0,
  minHeight: 34,
}

const cardActionRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: 8,
  borderTop: '1px solid rgba(255,255,255,0.06)',
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

const modalBoxStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: 480,
}

const closeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: -12,
  right: -12,
  zIndex: 10,
  width: 28,
  height: 28,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.15)',
  background: '#0e0b04',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const modalInnerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  paddingTop: 8,
}

const modalDescriptionStyle: CSSProperties = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.7)',
  lineHeight: 1.5,
  margin: 0,
}

const modalPlaceholderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: '24px 16px',
  borderRadius: 12,
  border: '1px dashed rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.02)',
}

const modalNoticeStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.5)',
  fontFamily: 'monospace',
}

const modalActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'flex-end',
}
