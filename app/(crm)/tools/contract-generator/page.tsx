'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'

export default function ContractGeneratorPage() {
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Contract Form States
  const [sellerName, setSellerName] = useState('')
  const [buyerEntity, setBuyerEntity] = useState('Foundation Acquisitions LLC')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('200000')
  const [earnestMoney, setEarnestMoney] = useState('1000')
  const [inspectionDays, setInspectionDays] = useState('14')
  const [closingDays, setClosingDays] = useState('30')
  const [titleCompany, setTitleCompany] = useState('First American Title')

  const formattedPrice = useMemo(() => {
    const num = parseFloat(purchasePrice) || 0
    return num.toLocaleString()
  }, [purchasePrice])

  const formattedEmd = useMemo(() => {
    const num = parseFloat(earnestMoney) || 0
    return num.toLocaleString()
  }, [earnestMoney])

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true)
    setTimeout(() => {
      setIsGeneratingPdf(false)
      // Simulating client-side PDF blob generation and automatic file download trigger
      const element = document.createElement('a')
      const file = new Blob([
        `RESIDENTIAL PURCHASE AND SALE AGREEMENT (AS-IS)\n\n` +
        `Seller: ${sellerName || '[Seller Name]'}\n` +
        `Buyer: ${buyerEntity}\n` +
        `Property: ${propertyAddress || '[Property Address]'}\n` +
        `Purchase Price: $${formattedPrice}\n` +
        `Earnest Money: $${formattedEmd}\n` +
        `Inspection Period: ${inspectionDays} Days\n` +
        `Closing Days: ${closingDays} Days\n` +
        `Title Company: ${titleCompany}`
      ], { type: 'application/pdf' })
      element.href = URL.createObjectURL(file)
      element.download = `Purchase_Agreement_${(propertyAddress || 'Contract').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }, 1000)
  }

  return (
    <PageShell title="Purchase & Sale Agreement Generator" subtitle="Draft binding as-is residential real estate purchase and sale contracts and export instantly to PDF.">
      <SectionCard>
        <div style={{ display: 'grid', gap: 20, maxWidth: 680 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Seller Full Name(s)</label>
              <input 
                type="text" 
                placeholder="e.g. John & Mary Doe" 
                value={sellerName} 
                onChange={(e) => setSellerName(e.target.value)} 
                style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Buyer Entity (Assignor)</label>
              <input 
                type="text" 
                value={buyerEntity} 
                onChange={(e) => setBuyerEntity(e.target.value)} 
                style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Subject Property Address</label>
            <input 
              type="text" 
              placeholder="e.g. 1247 18th Ave N, St. Petersburg, FL 33704" 
              value={propertyAddress} 
              onChange={(e) => setPropertyAddress(e.target.value)} 
              style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Purchase Price ($)</label>
              <input 
                type="number" 
                value={purchasePrice} 
                onChange={(e) => setPurchasePrice(e.target.value)} 
                style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#ebc477', fontWeight: 600 }}>Earnest Money Deposit (EMD)</label>
              <input 
                type="number" 
                value={earnestMoney} 
                onChange={(e) => setEarnestMoney(e.target.value)} 
                style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(214,166,75,0.3)', color: '#fff', fontSize: 14 }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <ActionButton tone="gold" onClick={() => setIsDrawerOpen(true)}>Preview Full Contract ↗</ActionButton>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <ActionButton tone="ghost" onClick={() => router.push('/tools')}>Back to Tools</ActionButton>
            <ActionButton tone="gold" onClick={handleDownloadPdf}>
              {isGeneratingPdf ? 'Compiling PDF...' : 'Download Contract PDF 📄'}
            </ActionButton>
          </div>

        </div>
      </SectionCard>

      {/* Contract Preview Slide-out Drawer */}
      {isDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 720, background: '#0a0a0a', borderLeft: '1px solid rgba(214,166,75,0.35)', padding: 32, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 24, overflowY: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(214,166,75,0.2)', paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, color: '#ebc477', fontWeight: 700, margin: 0 }}>Contract Document Preview</h2>
                <p style={{ fontSize: 13, color: '#aaa', margin: '4px 0 0' }}>Florida As-Is Residential Purchase & Sale Agreement</p>
              </div>
              <ActionButton tone="ghost" onClick={() => setIsDrawerOpen(false)}>Close ✕</ActionButton>
            </div>

            {/* Contract Legal Text Document Body */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(214,166,75,0.2)', borderRadius: 12, padding: 24, display: 'grid', gap: 16, fontFamily: 'serif', color: '#ddd', fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 15, color: '#ebc477', marginBottom: 8 }}>
                RESIDENTIAL PURCHASE AND SALE AGREEMENT (AS-IS)
              </div>

              <p>
                This Agreement is entered into by and between <strong style={{ color: '#fff' }}>{sellerName || '[Seller Name]'}</strong> (hereinafter referred to as "Seller") and <strong style={{ color: '#fff' }}>{buyerEntity}</strong> (hereinafter referred to as "Buyer"), for the real property located at <strong style={{ color: '#fff' }}>{propertyAddress || '[Property Address]'}</strong>.
              </p>

              <div>
                <strong>1. PURCHASE PRICE:</strong> The total purchase price shall be <strong style={{ color: '#ebc477' }}>${formattedPrice}</strong>, payable by Buyer in cash or readily available funds at closing.
              </div>

              <div>
                <strong>2. EARNEST MONEY DEPOSIT:</strong> Buyer shall deliver an earnest money deposit in the amount of <strong style={{ color: '#ebc477' }}>${formattedEmd}</strong> to <strong style={{ color: '#fff' }}>{titleCompany}</strong> within 3 business days of effective date.
              </div>

              <div>
                <strong>3. INSPECTION PERIOD:</strong> Buyer shall have an inspection period of <strong style={{ color: '#fff' }}>{inspectionDays}</strong> calendar days from the effective date to conduct physical inspections and terminate this agreement at Buyer's sole discretion.
              </div>

              <div>
                <strong>4. CLOSING DATE:</strong> Closing shall take place on or before <strong style={{ color: '#fff' }}>{closingDays}</strong> days from effective date through designated closing agent.
              </div>

              <div>
                <strong>5. ASSIGNABILITY:</strong> Buyer reserves the absolute right to assign this agreement to a third party without prior consent or release of liability.
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ borderTop: '1px solid rgba(214,166,75,0.2)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#888' }}>Ready for Export</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <ActionButton tone="ghost" onClick={() => setIsDrawerOpen(false)}>Close Preview</ActionButton>
                <ActionButton tone="gold" onClick={handleDownloadPdf}>Download PDF</ActionButton>
              </div>
            </div>

          </div>
        </div>
      )}
    </PageShell>
  )
}
