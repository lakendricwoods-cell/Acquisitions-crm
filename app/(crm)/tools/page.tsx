'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'

interface ToolCardData {
  title: string
  tag: string
  description: string
  href: string
}

const TOOLS: ToolCardData[] = [
  {
    title: 'Comparable Sales Analyzer',
    tag: 'Interactive Workspace',
    description: 'Underwrite After Repair Value (ARV) and calculate price per sqft using live property data streams.',
    href: '/tools/comps-analyzer',
  },
  {
    title: 'Wholesale Calculator',
    tag: 'Financial Calculator',
    description: 'Calculate Maximum Allowable Offer (MAO), repair estimates, wholesale fees, and net profit margins.',
    href: '/tools/wholesale-calculator',
  },
  {
    title: 'Contract Generator',
    tag: 'Document Suite',
    description: 'Generate legally binding purchase agreements, assignment contracts, and seller addendums instantly.',
    href: '/tools/contract-generator',
  },
  {
    title: 'Script Generator',
    tag: 'Utility Suite',
    description: 'Create and customize cold calling, SMS, and direct-to-seller acquisition scripts tailored to motivated leads.',
    href: '/tools/script-generator',
  },
  {
    title: 'Marketing ROI Calculator',
    tag: 'Analytics Engine',
    description: 'Forecast campaign profitability, direct mail response rates, cost-per-lead, and projected deal pipelines.',
    href: '/tools/marketing-roi',
  },
  {
    title: 'Dispositions Blast',
    tag: 'Buyer Network',
    description: 'Format buyer list blasts, property flyers, and assignment details for cash buyer broadcasting.',
    href: '/tools/dispositions-blast',
  },
]

export default function ToolsHubPage() {
  return (
    <PageShell
      title="Acquisitions & Dispo Utilities"
      subtitle="Complete centralized terminal for real estate underwriting, analytics, and documentation."
    >
      <SectionCard
        title="Acquisitions Tool Suite"
        subtitle="Select a workspace terminal to launch automated underwriting and deal modeling tools."
      >
        <div style={toolsGridStyle}>
          {TOOLS.map((tool, idx) => (
            <div key={idx} style={toolCardStyle}>
              <div style={toolCardHeaderStyle}>
                <h3 style={toolTitleStyle}>{tool.title}</h3>
                <span style={toolTagStyle}>{tool.tag}</span>
              </div>

              <p style={toolDescriptionStyle}>{tool.description}</p>

              <div style={toolActionWrapStyle}>
                <Link href={tool.href} style={{ textDecoration: 'none', width: '100%' }}>
                  <ActionButton tone="gold" style={{ width: '100%', justifyContent: 'center' }}>
                    Launch Tool Terminal →
                  </ActionButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

const toolsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
}

const toolCardStyle: CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: 'linear-gradient(180deg, rgba(20,16,8,0.7), rgba(6,5,2,0.95))',
  border: '1px solid rgba(214, 166, 75, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 14,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

const toolCardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 10,
}

const toolTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 750,
  color: '#ffffff',
  margin: 0,
  lineHeight: 1.25,
}

const toolTagStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '3px 8px',
  borderRadius: 6,
  background: 'rgba(214, 166, 75, 0.1)',
  border: '1px solid rgba(214, 166, 75, 0.25)',
  color: '#d6a64b',
  whiteSpace: 'nowrap',
}

const toolDescriptionStyle: CSSProperties = {
  fontSize: 12.5,
  color: 'rgba(255, 255, 255, 0.6)',
  lineHeight: 1.45,
  margin: 0,
}

const toolActionWrapStyle: CSSProperties = {
  paddingTop: 4,
}
