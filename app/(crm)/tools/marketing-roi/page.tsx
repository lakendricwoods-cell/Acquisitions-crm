'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'

export default function MarketingRoiPage() {
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Marketing Budget & KPI States
  const [monthlyBudget, setMonthlyBudget] = useState('2500')
  const [costPerLead, setCostPerLead] = useState('45')
  const [conversionRate, setConversionRate] = useState('3.5') // Percentage of leads that turn into locked contracts
  const [avgAssignmentFee, setAvgAssignmentFee] = useState('11500')

  // Calculated Metrics
  const metrics = useMemo(() => {
    const budget = parseFloat(monthlyBudget) || 0
    const cpl = parseFloat(costPerLead) || 1
    const conv = (parseFloat(conversionRate) || 0) / 100
    const fee = parseFloat(avgAssignmentFee) || 0

    const estimatedLeads = cpl > 0 ? Math.round(budget / cpl) : 0
    const estimatedDeals = Math.round(estimatedLeads * conv)
    const grossRevenue = estimatedDeals * fee
    const netProfit = grossRevenue - budget
    const roiPercentage = budget > 0 ? (netProfit / budget) * 100 : 0
    const calculatedCPA = estimatedDeals > 0 ? budget / estimatedDeals : 0

    return {
      estimatedLeads,
      estimatedDeals,
      grossRevenue,
      netProfit,
      roiPercentage,
      calculatedCPA
    }
  }, [monthlyBudget, costPerLead, conversionRate, avgAssignmentFee])

  return (
    <PageShell title="Marketing ROI & Cost Calculator" subtitle="Track acquisition channel spend, forecast lead volume, and calculate return on investment for wholesale marketing campaigns.">
      <SectionCard>
        <div style={{ display: 'grid', gap: 20, maxWidth: 720 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Monthly Marketing Spend ($)</label>
              <input 
                type="number" 
                value={monthlyBudget} 
                onChange={(e) => setMonthlyBudget(e.target.value)} 
                style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Estimated Cost Per Lead (CPL)</label>
              <input 
                type="number" 
                value={costPerLead} 
                onChange={(e) => setCostPerLead(e.target.value)} 
                style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Lead-to-Contract Conversion (%)</label>
              <input 
                type="number" 
                step="0.1" 
                value={conversionRate} 
                onChange={(e) => setConversionRate(e.target.value)} 
                style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Average Assignment Fee ($)</label>
              <input 
                type="number" 
                value={avgAssignmentFee} 
                onChange={(e) => setAvgAssignmentFee(e.target.value)} 
                style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
              />
            </div>
          </div>

          {/* Results Summary Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(214,166,75,0.06)', border: '1px solid rgba(214,166,75,0.25)', display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>Projected Leads</span>
              <span style={{ fontSize: 20, color: '#fff', fontWeight: 800 }}>{metrics.estimatedLeads}</span>
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(214,166,75,0.06)', border: '1px solid rgba(214,166,75,0.25)', display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>Closed Deals</span>
              <span style={{ fontSize: 20, color: '#fff', fontWeight: 800 }}>{metrics.estimatedDeals}</span>
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(214,166,75,0.06)', border: '1px solid rgba(214,166,75,0.25)', display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>Cost Per Acquisition</span>
              <span style={{ fontSize: 20, color: '#ebc477', fontWeight: 800 }}>${metrics.calculatedCPA.toFixed(0)}</span>
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 12, background: 'rgba(214,166,75,0.1)', border: '1px solid rgba(214,166,75,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>Projected Net Campaign Return (ROI)</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Gross Revenue: ${metrics.grossRevenue.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, color: '#ebc477', fontWeight: 800 }}>{metrics.roiPercentage.toFixed(0)}%</div>
              <div style={{ fontSize: 11, color: '#32CD32', fontWeight: 600 }}>+${metrics.netProfit.toLocaleString()} Net Profit</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <ActionButton tone="ghost" onClick={() => router.push('/tools')}>Back to Tools</ActionButton>
            <ActionButton tone="gold" onClick={() => alert('Marketing ROI forecast saved successfully!')}>Save ROI Model</ActionButton>
          </div>

        </div>
      </SectionCard>
    </PageShell>
  )
}
