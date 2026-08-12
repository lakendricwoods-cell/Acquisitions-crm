'use client'

import { useRouter } from 'next/navigation'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'

export default function ToolsDashboard() {
  const router = useRouter()

  const tools = [
    {
      id: 'comps',
      title: 'Comparable Sales Analyzer',
      description: 'Underwrite After Repair Value (ARV) and calculate price per sqft using live property data streams.',
      route: '/tools/comps-analyzer',
      badge: 'Interactive Workspace',
    },
    {
      id: 'wholesale',
      title: 'Wholesale Calculator',
      description: 'Calculate Maximum Allowable Offer (MAO), repair estimates, wholesale fees, and net profit margins.',
      route: '/tools/wholesale-calc',
      badge: 'Financial Calculator',
    },
    {
      id: 'contracts',
      title: 'Contract Generator',
      description: 'Generate legally binding purchase agreements, assignment contracts, and seller addendums instantly.',
      route: '/tools/contracts',
      badge: 'Document Suite',
    },
    {
      id: 'scripts',
      title: 'Script Generator',
      description: 'Create and customize cold calling, SMS, and direct-to-seller acquisition scripts tailored to motivated leads.',
      route: '/tools/script-generator',
      badge: 'Utility Suite',
    },
    {
      id: 'marketing-roi',
      title: 'Marketing ROI Calculator',
      description: 'Forecast campaign profitability, direct mail response rates, cost-per-lead, and projected deal pipelines.',
      route: '/tools/marketing-roi',
      badge: 'Analytics Engine',
    },
    {
      id: 'dispositions',
      title: 'Dispositions Blast',
      description: 'Format buyer list blasts, property flyers, and assignment details for cash buyer broadcasting.',
      route: '/tools/dispositions',
      badge: 'Buyer Network',
    },
  ]

  return (
    <PageShell 
      title="Acquisitions Tool Suite" 
      subtitle="Complete centralized terminal for real estate underwriting, analytics, and documentation."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {tools.map((tool) => (
          <SectionCard key={tool.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', justifyContent: 'space-between' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#ebc477', fontSize: 18, fontWeight: 700, margin: 0 }}>
                    {tool.title}
                  </h3>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(214,166,75,0.15)', color: '#ebc477', fontWeight: 600 }}>
                    {tool.badge}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#aaa', margin: 0, lineHeight: 1.5 }}>
                  {tool.description}
                </p>
              </div>

              <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <ActionButton tone="gold" onClick={() => router.push(tool.route)}>
                  Launch Tool Terminal ↗
                </ActionButton>
              </div>

            </div>
          </SectionCard>
        ))}
      </div>
    </PageShell>
  )
}
