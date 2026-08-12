'use client'

import { useRouter } from 'next/navigation'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'

export default function ToolsDashboard() {
  const router = useRouter()

  return (
    <PageShell 
      title="Acquisitions Tool Suite" 
      subtitle="Manage your real estate underwriting, marketing ROI, and contract generation."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Comps Analyzer Card */}
        <SectionCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ color: '#ebc477', fontSize: 18, margin: 0 }}>Comparable Sales Analyzer</h3>
            <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
              Underwrite After Repair Value (ARV) with live data streams across Propwire, Zillow, and public records.
            </p>
            <div style={{ marginTop: 8 }}>
              <ActionButton tone="gold" onClick={() => router.push('/tools/comps-analyzer')}>
                Open Comps Terminal ↗
              </ActionButton>
            </div>
          </div>
        </SectionCard>

        {/* Script Generator Card */}
        <SectionCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ color: '#ebc477', fontSize: 18, margin: 0 }}>Script Generator</h3>
            <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
              Generate and customize dynamic cold calling and SMS acquisition scripts.
            </p>
            <div style={{ marginTop: 8 }}>
              <ActionButton tone="gold" onClick={() => router.push('/tools/script-generator')}>
                Open Scripts ↗
              </ActionButton>
            </div>
          </div>
        </SectionCard>

        {/* Marketing ROI Card */}
        <SectionCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ color: '#ebc477', fontSize: 18, margin: 0 }}>Marketing ROI</h3>
            <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
              Forecast direct mail and digital campaign profitability and cost-per-deal metrics.
            </p>
            <div style={{ marginTop: 8 }}>
              <ActionButton tone="gold" onClick={() => router.push('/tools/marketing-roi')}>
                Open ROI Calc ↗
              </ActionButton>
            </div>
          </div>
        </SectionCard>

      </div>
    </PageShell>
  )
}
