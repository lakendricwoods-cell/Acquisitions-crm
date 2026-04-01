'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
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
  market_value?: number | null
  estimated_value?: number | null
  arv?: number | null
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}`
}

function getStrength(lead: LeadRow) {
  let score = 35
  if (lead.owner_name) score += 20
  if (firstNonEmpty(lead.owner_phone_primary, lead.phone1)) score += 20
  if (lead.arv || lead.estimated_value || lead.market_value) score += 15
  if (firstNonEmpty(lead.property_address_1, lead.property_address)) score += 10
  return Math.min(100, score)
}

function getContact(lead: LeadRow) {
  let score = 20
  if (lead.owner_name) score += 30
  if (firstNonEmpty(lead.owner_phone_primary, lead.phone1)) score += 50
  return Math.min(100, score)
}

function getMarket(lead: LeadRow) {
  let score = 25
  if (lead.market_value || lead.estimated_value) score += 35
  if (lead.arv) score += 30
  if (firstNonEmpty(lead.city, lead.property_city)) score += 10
  return Math.min(100, score)
}

function getMotivation() {
  return 70
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return rows.filter((lead) => {
      const haystack = [
        firstNonEmpty(lead.property_address_1, lead.property_address),
        lead.owner_name,
        firstNonEmpty(lead.city, lead.property_city),
        firstNonEmpty(lead.owner_phone_primary, lead.phone1),
        firstNonEmpty(lead.status, lead.stage),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return !q || haystack.includes(q)
    })
  }, [rows, query])

  return (
    <PageShell
      title="Leads"
      subtitle="Mobile lead list built for portrait view."
      actions={
        <>
          <StatPill label="Total" value={rows.length} />
          <StatPill label="Visible" value={filtered.length} />
        </>
      }
    >
      <SectionCard
        title="Lead Control Center"
        subtitle="Search and open leads without zooming."
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
        ) : filtered.length === 0 ? (
          <div className="crm-muted">No leads found.</div>
        ) : (
          <div style={listStyle}>
            {filtered.map((lead) => {
              const address =
                firstNonEmpty(lead.property_address_1, lead.property_address) || 'Unknown property'
              const location =
                [
                  firstNonEmpty(lead.city, lead.property_city),
                  firstNonEmpty(lead.state, lead.property_state),
                  firstNonEmpty(lead.zip, lead.property_zip),
                ]
                  .filter(Boolean)
                  .join(', ') || 'Location pending'

              const phone = firstNonEmpty(lead.owner_phone_primary, lead.phone1) || 'No phone'
              const stage = firstNonEmpty(lead.status, lead.stage) || 'New Lead'

              return (
                <Link key={lead.id} href={`/leads/${lead.id}`} style={cardLinkStyle}>
                  <article style={cardStyle}>
                    <div style={topRowStyle}>
                      <div style={addressWrapStyle}>
                        <div style={addressStyle}>{address}</div>
                        <div style={subStyle}>{location}</div>
                      </div>

                      <span style={stageBadgeStyle}>{stage}</span>
                    </div>

                    <div style={ownerRowStyle}>
                      <div style={labelStyle}>Owner</div>
                      <div style={valueStyle}>{lead.owner_name || 'Unknown owner'}</div>
                    </div>

                    <div style={ownerRowStyle}>
                      <div style={labelStyle}>Contact</div>
                      <div style={valueStyle}>{phone}</div>
                    </div>

                    <div style={metricGridStyle}>
                      <Metric label="Strength" value={getStrength(lead)} tone="gold" />
                      <Metric label="Motivation" value={getMotivation()} tone="gold" />
                      <Metric label="Contact" value={getContact(lead)} tone="blue" />
                      <Metric label="Market" value={getMarket(lead)} tone="green" />
                    </div>

                    <div style={bottomGridStyle}>
                      <MiniStat
                        label="Price"
                        value={formatMoney(lead.market_value ?? lead.estimated_value ?? null)}
                      />
                      <MiniStat
                        label="ARV"
                        value={formatMoney(lead.arv ?? null)}
                      />
                    </div>

                    <div style={actionRowStyle}>
                      <span style={openTextStyle}>Open Workspace</span>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'gold' | 'blue' | 'green'
}) {
  const toneMap = {
    gold: {
      border: 'rgba(214,166,75,0.28)',
      bg: 'rgba(214,166,75,0.10)',
      color: '#e7bf6a',
    },
    blue: {
      border: 'rgba(90,150,255,0.22)',
      bg: 'rgba(90,150,255,0.08)',
      color: '#93b9ff',
    },
    green: {
      border: 'rgba(34,197,94,0.24)',
      bg: 'rgba(34,197,94,0.08)',
      color: '#7ce39f',
    },
  }[tone]

  return (
    <div
      style={{
        ...metricStyle,
        borderColor: toneMap.border,
        background: toneMap.bg,
      }}
    >
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...metricValueStyle, color: toneMap.color }}>{value}</div>
    </div>
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={miniStatStyle}>
      <div style={miniLabelStyle}>{label}</div>
      <div style={miniValueStyle}>{value}</div>
    </div>
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

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(6,6,6,0.98), rgba(0,0,0,1))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.02), 0 0 12px rgba(214,166,75,0.05)',
}

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const addressWrapStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: 4,
  flex: 1,
}

const addressStyle: CSSProperties = {
  fontSize: 22,
  lineHeight: 1.04,
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '-0.03em',
  wordBreak: 'break-word',
}

const subStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  color: 'rgba(255,255,255,0.52)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const stageBadgeStyle: CSSProperties = {
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(61,110,255,0.12)',
  border: '1px solid rgba(61,110,255,0.28)',
  color: '#76a1ff',
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
}

const ownerRowStyle: CSSProperties = {
  display: 'grid',
  gap: 3,
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.38)',
}

const valueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 650,
  color: '#ffffff',
  lineHeight: 1.25,
  wordBreak: 'break-word',
}

const metricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const metricStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const metricLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.45)',
}

const metricValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
}

const bottomGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const miniStatStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
}

const miniLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.40)',
}

const miniValueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 750,
  color: '#ffffff',
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: 2,
}

const openTextStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#e0b84f',
}