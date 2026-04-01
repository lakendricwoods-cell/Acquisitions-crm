'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import MobileLeadCard, {
  type MobileLeadCardData,
} from '@/components/leads/mobile-lead-card'
import { supabase } from '@/lib/supabase'

type LeadRow = {
  id: string
  property_address_1?: string | null
  property_address?: string | null
  owner_name?: string | null
  owner_phone_primary?: string | null
  phone1?: string | null
  city?: string | null
  property_city?: string | null
  state?: string | null
  property_state?: string | null
  zip?: string | null
  property_zip?: string | null
  status?: string | null
  stage?: string | null
  arv?: number | null
  estimated_value?: number | null
  market_value?: number | null
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
}

function mapLeadToMobileCard(lead: LeadRow): MobileLeadCardData {
  return {
    id: lead.id,
    address:
      firstNonEmpty(lead.property_address_1, lead.property_address) || 'Unknown property',
    cityStateZip:
      [
        firstNonEmpty(lead.city, lead.property_city),
        firstNonEmpty(lead.state, lead.property_state),
        firstNonEmpty(lead.zip, lead.property_zip),
      ]
        .filter(Boolean)
        .join(', ') || 'Location pending',
    owner: lead.owner_name || 'Unknown owner',
    stage: firstNonEmpty(lead.status, lead.stage) || 'New Lead',
    strength: 82,
    motivation: 95,
    contact: firstNonEmpty(lead.owner_phone_primary, lead.phone1) ? 75 : 35,
    market: lead.arv || lead.estimated_value || lead.market_value ? 90 : 55,
    priceText: formatMoney(lead.market_value ?? lead.estimated_value ?? null),
    arvText: formatMoney(lead.arv ?? null),
    phoneText: firstNonEmpty(lead.owner_phone_primary, lead.phone1) || 'No phone',
  }
}

export default function LeadsMobile() {
  const [rows, setRows] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setRows([])
      } else {
        setRows((data as LeadRow[]) || [])
      }

      setLoading(false)
    }

    void load()
  }, [])

  const cards = useMemo(() => {
    return rows
      .map(mapLeadToMobileCard)
      .filter((lead) => {
        const q = query.trim().toLowerCase()
        if (!q) return true

        const haystack = [
          lead.address,
          lead.cityStateZip,
          lead.owner,
          lead.phoneText,
          lead.stage,
        ]
          .join(' ')
          .toLowerCase()

        return haystack.includes(q)
      })
  }, [rows, query])

  return (
    <PageShell
      title="Leads"
      subtitle="Portrait mobile lead list built for fast scanning and one-tap workspace access."
      actions={
        <>
          <StatPill label="Total" value={rows.length} />
          <StatPill label="Visible" value={cards.length} />
        </>
      }
    >
      <SectionCard
        title="Lead Control Center"
        subtitle="Search and open leads without using the desktop table on phone."
      >
        <div style={toolbarStyle}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="crm-input"
            placeholder="Search address, owner, phone, city..."
            style={searchStyle}
          />
        </div>

        {loading ? (
          <div className="crm-muted">Loading leads...</div>
        ) : cards.length === 0 ? (
          <div className="crm-muted">No leads found.</div>
        ) : (
          <div style={listStyle}>
            {cards.map((lead) => (
              <MobileLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const searchStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
}

const listStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}