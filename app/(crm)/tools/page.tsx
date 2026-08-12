'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import { TOOL_CONFIGS, type ToolCategory } from './tool-config'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  deal: 'Deal Tools',
  analysis: 'Analysis',
  marketing: 'Marketing',
  documents: 'Documents',
  operations: 'Operations',
}

const CATEGORY_ORDER: ToolCategory[] = [
  'deal',
  'analysis',
  'marketing',
  'documents',
  'operations',
]

export default function ToolsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | ToolCategory>('all')

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase()

    return TOOL_CONFIGS.filter((tool) => {
      const matchesCategory =
        category === 'all' || tool.category === category

      const matchesSearch =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.shortName.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [search, category])

  return (
    <PageShell
      title="Tools"
      subtitle="Acquisition, underwriting, marketing, contracts, and deal intelligence."
      actions={
        <Link href="/leads">
          <ActionButton tone="gold">View Leads</ActionButton>
        </Link>
      }
    >
      <div style={pageStyle}>
        <SectionCard
          title="Acquisition Toolkit"
          subtitle="Select a tool to analyze, structure, or move a deal forward."
        >
          <div style={toolbarStyle}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tools..."
              style={searchStyle}
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as 'all' | ToolCategory)
              }
              style={selectStyle}
            >
              <option value="all">All Tools</option>

              {CATEGORY_ORDER.map((item) => (
                <option key={item} value={item}>
                  {CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>

        {CATEGORY_ORDER.map((currentCategory) => {
          const tools = filteredTools.filter(
            (tool) => tool.category === currentCategory
          )

          if (!tools.length) return null

          return (
            <section key={currentCategory}>
              <div style={categoryHeaderStyle}>
                <div>
                  <div style={categoryEyebrowStyle}>
                    {CATEGORY_LABELS[currentCategory]}
                  </div>
                  <h2 style={categoryTitleStyle}>
                    {CATEGORY_LABELS[currentCategory]}
                  </h2>
                </div>

                <div style={categoryCountStyle}>
                  {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                </div>
              </div>

              <div style={toolGridStyle}>
                {tools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )
        })}

        {!filteredTools.length && (
          <SectionCard
            title="No tools found"
            subtitle="Try another search or category."
          >
            <div style={emptyStyle}>
              No matching tools were found.
            </div>
          </SectionCard>
        )}
      </div>
    </PageShell>
  )
}

function ToolCard({
  tool,
}: {
  tool: (typeof TOOL_CONFIGS)[number]
}) {
  const accent =
    tool.accent === 'gold'
      ? {
          border: 'rgba(214,166,75,0.25)',
          background:
            'linear-gradient(180deg, rgba(31,25,14,0.92), rgba(8,7,4,0.98))',
          icon: '#d6a64b',
          glow: 'rgba(214,166,75,0.08)',
        }
      : tool.accent === 'green'
        ? {
            border: 'rgba(74,222,128,0.22)',
            background:
              'linear-gradient(180deg, rgba(13,28,18,0.92), rgba(5,10,7,0.98))',
            icon: '#4ade80',
            glow: 'rgba(74,222,128,0.08)',
          }
        : {
            border: 'rgba(147,197,253,0.22)',
            background:
              'linear-gradient(180deg, rgba(15,22,31,0.92), rgba(5,8,12,0.98))',
            icon: '#93c5fd',
            glow: 'rgba(147,197,253,0.08)',
          }

  return (
    <Link href={tool.href} style={cardLinkStyle}>
      <article
        style={{
          ...toolCardStyle,
          borderColor: accent.border,
          background: accent.background,
        }}
      >
        <div
          style={{
            ...toolIconStyle,
            color: accent.icon,
            borderColor: accent.border,
            background: accent.glow,
          }}
        >
          {tool.icon}
        </div>

        <div style={toolContentStyle}>
          <div style={toolNameStyle}>{tool.name}</div>

          <div style={toolDescriptionStyle}>
            {tool.description}
          </div>

          <div style={toolFooterStyle}>
            <span style={toolCategoryStyle}>
              {CATEGORY_LABELS[tool.category]}
            </span>

            <span
              style={{
                ...openStyle,
                color: accent.icon,
              }}
            >
              Open →
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

const pageStyle: CSSProperties = {
  display: 'grid',
  gap: 22,
}

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 180px',
  gap: 10,
}

const searchStyle: CSSProperties = {
  minHeight: 44,
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  color: '#fff',
  padding: '0 14px',
  outline: 'none',
  fontSize: 13,
}

const selectStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 12,
  border: '1px solid rgba(214,166,75,0.22)',
  background: '#11100d',
  color: '#fff',
  padding: '0 12px',
  outline: 'none',
  fontSize: 13,
}

const categoryHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'end',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 10,
}

const categoryEyebrowStyle: CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'rgba(214,166,75,0.7)',
  fontWeight: 800,
}

const categoryTitleStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 18,
  fontWeight: 800,
  color: '#fff',
}

const categoryCountStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: 11,
}

const toolGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 12,
  marginBottom: 8,
}

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const toolCardStyle: CSSProperties = {
  minHeight: 180,
  borderRadius: 16,
  border: '1px solid transparent',
  padding: 16,
  display: 'grid',
  gridTemplateColumns: '44px minmax(0,1fr)',
  gap: 14,
  boxSizing: 'border-box',
  transition: 'transform 120ms ease, border-color 120ms ease',
}

const toolIconStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: '1px solid transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 19,
  fontWeight: 900,
}

const toolContentStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  alignContent: 'start',
  gap: 8,
}

const toolNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: '#fff',
}

const toolDescriptionStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  color: 'rgba(255,255,255,0.52)',
}

const toolFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  marginTop: 12,
}

const toolCategoryStyle: CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.35)',
}

const openStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
}

const emptyStyle: CSSProperties = {
  padding: 30,
  textAlign: 'center',
  color: 'rgba(255,255,255,0.45)',
  fontSize: 13,
}