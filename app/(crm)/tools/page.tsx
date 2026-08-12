'use client'

import { useRouter } from 'next/navigation'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'

// We keep the import, but ensure the component doesn't contain hidden modal logic
import CompsAnalyzerPage from './comps-analyzer/page' 

export default function ToolsDashboard() {
  const router = useRouter()

  return (
    <PageShell 
      title="Acquisitions Tool Suite" 
      subtitle="Manage your real estate underwriting, marketing ROI, and contract generation."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* The Analyzer is now rendered directly in the flow */}
        <section style={{ width: '100%' }}>
          <CompsAnalyzerPage />
        </section>

        {/* Secondary Tools Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          <SectionCard>
            <h3 style={{ color: '#ebc477' }}>Script Generator</h3>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '8px 0 16px' }}>
              Generate and upload acquisition scripts.
            </p>
            <ActionButton tone="gold" onClick={() => router.push('/tools/script-generator')}>
              Open Scripts
            </ActionButton>
          </SectionCard>

          <SectionCard>
            <h3 style={{ color: '#ebc477' }}>Marketing ROI</h3>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '8px 0 16px' }}>
              Forecast campaign profitability.
            </p>
            <ActionButton tone="gold" onClick={() => router.push('/tools/marketing-roi')}>
              Open ROI Calc
            </ActionButton>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}
