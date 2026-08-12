'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'

// Importing your new Comps Analyzer logic
import CompsAnalyzerPage from './comps-analyzer/page' 

export default function ToolsDashboard() {
  const router = useRouter()

  return (
    <PageShell title="Acquisitions Tool Suite" subtitle="Manage your real estate underwriting, marketing ROI, and contract generation.">
      <div style={{ display: 'grid', gap: 24 }}>
        
        {/* Main Integrated Comps & ARV Workspace */}
        <CompsAnalyzerPage />

        {/* Other Tools Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <SectionCard>
            <h3 style={{ color: '#ebc477' }}>Script Generator</h3>
            <p style={{ fontSize: 13, color: '#aaa', margin: '8px 0 16px' }}>Generate and upload acquisition scripts.</p>
            <ActionButton tone="gold" onClick={() => router.push('/tools/script-generator')}>Open Scripts</ActionButton>
          </SectionCard>

          <SectionCard>
            <h3 style={{ color: '#ebc477' }}>Marketing ROI</h3>
            <p style={{ fontSize: 13, color: '#aaa', margin: '8px 0 16px' }}>Forecast campaign profitability.</p>
            <ActionButton tone="gold" onClick={() => router.push('/tools/marketing-roi')}>Open ROI Calc</ActionButton>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}
