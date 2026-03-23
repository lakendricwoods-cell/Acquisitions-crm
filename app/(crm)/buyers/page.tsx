'use client'

import { useEffect, useMemo, useState } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import { supabase } from '@/lib/supabase'

type Buyer = {
  id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  company_name?: string | null
  buy_box?: string | null
  markets?: string | null
  preferred_property_types?: string | null
  proof_of_funds?: boolean | null
  contact_ready?: boolean | null
  disposition_score?: number | null
  notes?: string | null
  created_at?: string
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [markets, setMarkets] = useState('')
  const [buyBox, setBuyBox] = useState('')
  const [saving, setSaving] = useState(false)

  const loadBuyers = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load buyers:', error)
      setBuyers([])
      setLoading(false)
      return
    }

    setBuyers((data as Buyer[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadBuyers()
  }, [])

  const filteredBuyers = useMemo(() => {
    const q = query.trim().toLowerCase()

    return buyers.filter((buyer) => {
      const haystack = [
        buyer.full_name,
        buyer.company_name,
        buyer.email,
        buyer.phone,
        buyer.markets,
        buyer.buy_box,
        buyer.preferred_property_types,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return q.length === 0 || haystack.includes(q)
    })
  }, [buyers, query])

  const stats = useMemo(() => {
    return {
      total: buyers.length,
      ready: buyers.filter((b) => !!b.contact_ready).length,
      proof: buyers.filter((b) => !!b.proof_of_funds).length,
      strong: buyers.filter((b) => (b.disposition_score || 0) >= 70).length,
    }
  }, [buyers])

  const handleCreateBuyer = async () => {
    if (!name.trim()) {
      alert('Buyer name required')
      return
    }

    setSaving(true)

    const payload = {
      full_name: name.trim(),
      company_name: company.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      markets: markets.trim() || null,
      buy_box: buyBox.trim() || null,
      contact_ready: !!(phone.trim() || email.trim()),
      disposition_score: computeBuyerStrength({
        phone: phone.trim(),
        email: email.trim(),
        markets: markets.trim(),
        buy_box: buyBox.trim(),
      }),
    }

    const { error } = await supabase.from('buyers').insert(payload)

    setSaving(false)

    if (error) {
      console.error('Failed to add buyer:', error)
      alert(error.message)
      return
    }

    setName('')
    setCompany('')
    setPhone('')
    setEmail('')
    setMarkets('')
    setBuyBox('')
    await loadBuyers()
  }

  return (
    <PageShell
      title="Buyers"
      subtitle="Disposition desk for buyer quality, reachability, buy-box clarity, and readiness."
      actions={
        <>
          <StatPill label="All Buyers" value={stats.total} />
          <StatPill label="Contact Ready" value={stats.ready} />
          <StatPill label="Proof of Funds" value={stats.proof} />
          <StatPill label="Strong Buyers" value={stats.strong} />
        </>
      }
    >
      <div style={buyersGridStyle}>
        <div style={buyersLeftStyle}>
          <SectionCard
            title="Buyer Intake"
            subtitle="Build a real buyer bench, not just a contact list."
          >
            <div style={formGridStyle}>
              <Field label="Buyer Name">
                <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Company">
                <input value={company} onChange={(e) => setCompany(e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Phone">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Markets">
                <input value={markets} onChange={(e) => setMarkets(e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Buy Box">
                <textarea value={buyBox} onChange={(e) => setBuyBox(e.target.value)} style={textareaStyle} />
              </Field>
            </div>

            <div style={{ marginTop: 16 }}>
              <ActionButton tone="gold" onClick={handleCreateBuyer}>
                {saving ? 'Saving...' : 'Add Buyer'}
              </ActionButton>
            </div>
          </SectionCard>

          <SectionCard
            title="Buyer Intelligence"
            subtitle="Disposition-side strength should reflect contact readiness plus buy-box clarity."
          >
            <div style={buyerIntelligenceGridStyle}>
              <BuyerMiniCard title="Strong Buyers" value={stats.strong} tone="gold" />
              <BuyerMiniCard title="Incomplete" value={buyers.filter((b) => !b.buy_box || !b.markets).length} tone="amber" />
              <BuyerMiniCard title="Contact Ready" value={stats.ready} tone="ice" />
              <BuyerMiniCard title="Buy Box Ready" value={buyers.filter((b) => !!b.buy_box && !!b.markets).length} tone="green" />
            </div>
          </SectionCard>
        </div>

        <div style={buyersRightStyle}>
          <SectionCard
            title="Buyer Network"
            subtitle="Searchable list of buyers by disposition strength, market, and buy-box clarity."
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buyer, company, market, buy box..."
              style={inputStyle}
            />

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
              {loading ? (
                <div style={emptyStyle}>Loading buyers...</div>
              ) : filteredBuyers.length === 0 ? (
                <div style={emptyStyle}>No buyers found.</div>
              ) : (
                filteredBuyers.map((buyer) => {
                  const score = buyer.disposition_score || 0
                  const tone = buyerTone(score)

                  return (
                    <div
                      key={buyer.id}
                      style={{
                        ...buyerCardStyle,
                        borderColor: tone.border,
                        background: tone.bg,
                      }}
                    >
                      <div style={buyerCardHeaderStyle}>
                        <div>
                          <div style={buyerTitleStyle}>
                            {buyer.full_name || 'Unnamed buyer'}
                          </div>
                          <div style={buyerSubStyle}>
                            {buyer.company_name || 'No company'}
                          </div>
                        </div>

                        <div
                          style={{
                            ...buyerScoreStyle,
                            borderColor: tone.border,
                            color: tone.text,
                          }}
                        >
                          {score}
                        </div>
                      </div>

                      <div style={buyerMetaGridStyle}>
                        <Meta label="Phone" value={buyer.phone || 'Missing'} />
                        <Meta label="Email" value={buyer.email || 'Missing'} />
                        <Meta label="Markets" value={buyer.markets || 'Missing'} />
                        <Meta label="Buy Box" value={buyer.buy_box || 'Missing'} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={fieldLabelStyle}>{label}</div>
      {children}
    </div>
  )
}

function BuyerMiniCard({
  title,
  value,
  tone,
}: {
  title: string
  value: number
  tone: 'gold' | 'amber' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? { border: 'rgba(201,163,78,0.22)', bg: 'rgba(201,163,78,0.08)', text: '#f4ddaa' }
      : tone === 'amber'
        ? { border: 'rgba(245,158,11,0.22)', bg: 'rgba(245,158,11,0.08)', text: '#f3cf98' }
        : tone === 'ice'
          ? { border: 'rgba(147,197,253,0.22)', bg: 'rgba(147,197,253,0.08)', text: '#dcecff' }
          : { border: 'rgba(74,222,128,0.22)', bg: 'rgba(74,222,128,0.08)', text: '#cef8da' }

  return (
    <div
      style={{
        ...buyerMiniCardStyle,
        borderColor: palette.border,
        background: palette.bg,
      }}
    >
      <div style={fieldLabelStyle}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: palette.text }}>{value}</div>
    </div>
  )
}

function Meta({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={metaBlockStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  )
}

function computeBuyerStrength(input: {
  phone?: string
  email?: string
  markets?: string
  buy_box?: string
}) {
  let score = 0
  if (input.phone) score += 30
  if (input.email) score += 20
  if (input.markets) score += 25
  if (input.buy_box) score += 25
  return Math.min(100, score)
}

function buyerTone(score: number) {
  if (score >= 75) {
    return {
      border: 'rgba(201,163,78,0.22)',
      bg: 'rgba(201,163,78,0.08)',
      text: '#f4ddaa',
    }
  }

  if (score >= 50) {
    return {
      border: 'rgba(74,222,128,0.18)',
      bg: 'rgba(74,222,128,0.06)',
      text: '#cef8da',
    }
  }

  return {
    border: 'rgba(255,255,255,0.08)',
    bg: 'rgba(255,255,255,0.03)',
    text: 'rgba(255,255,255,0.8)',
  }
}

const buyersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '390px minmax(0, 1fr)',
  gap: 18,
  alignItems: 'start',
}

const buyersLeftStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

const buyersRightStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: 'rgba(255,255,255,0.44)',
}

const inputStyle: React.CSSProperties = {
  height: 46,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'white',
  padding: '0 12px',
}

const textareaStyle: React.CSSProperties = {
  minHeight: 100,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'white',
  padding: 12,
  resize: 'vertical',
}

const buyerIntelligenceGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}

const buyerMiniCardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: 14,
}

const buyerCardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 22,
  padding: 16,
}

const buyerCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
}

const buyerTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  color: 'rgba(255,255,255,0.94)',
  fontSize: 18,
}

const buyerSubStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.54)',
  fontSize: 13,
  marginTop: 4,
}

const buyerScoreStyle: React.CSSProperties = {
  minWidth: 56,
  height: 56,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  fontWeight: 800,
  background: 'rgba(255,255,255,0.04)',
}

const buyerMetaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginTop: 14,
}

const metaBlockStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: 10,
  background: 'rgba(255,255,255,0.04)',
}

const metaValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: 'rgba(255,255,255,0.84)',
  lineHeight: 1.4,
}

const emptyStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.03)',
  color: 'rgba(255,255,255,0.48)',
  textAlign: 'center',
}