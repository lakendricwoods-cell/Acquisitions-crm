'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import ActionButton from '@/components/ui/action-button'

type CanvasBlock = {
  id: string
  lead_id: string
  type: string
  title: string | null
  content: Record<string, any> | null
  color: string | null
  x: number
  y: number
  width: number
  height: number
  block_order: number | null
}

type LeadSnapshot = {
  id: string
  property_address_1?: string | null
  owner_name?: string | null
  lead_type?: string | null
  house_value?: number | null
  estimated_value?: number | null
  market_value?: number | null
  equity_amount?: number | null
  equity_percent?: number | null
  mortgage_balance?: number | null
  last_sale_amount?: number | null
  last_sale_date?: string | null
  default_amount?: number | null
  auction_date?: string | null
  property_type?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  square_feet?: number | null
  year_built?: number | null
  owner_occupied?: boolean | null
  vacant?: boolean | null
  notes_summary?: string | null
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function num(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function percent(value: number) {
  return `${Math.round(value)}%`
}

function createSignalBlockContent(lead: LeadSnapshot) {
  const houseValue = lead.house_value ?? lead.estimated_value ?? lead.market_value ?? null

  return {
    signals: [
      { label: 'Lead Type', value: lead.lead_type || 'standard' },
      { label: 'House Value', value: money(houseValue) },
      { label: 'Equity', value: money(lead.equity_amount) },
      { label: 'Equity %', value: lead.equity_percent ? percent(lead.equity_percent) : '—' },
      { label: 'Mortgage', value: money(lead.mortgage_balance) },
      { label: 'Last Money In', value: money(lead.last_sale_amount) },
      { label: 'Auction Date', value: lead.auction_date || '—' },
      { label: 'Default Amount', value: money(lead.default_amount) },
      { label: 'Occupancy', value: lead.owner_occupied === null ? '—' : lead.owner_occupied ? 'Owner Occupied' : 'Not Owner Occupied' },
      { label: 'Vacant', value: lead.vacant === null ? '—' : lead.vacant ? 'Yes' : 'No' },
      { label: 'Property Type', value: lead.property_type || '—' },
      {
        label: 'Specs',
        value: `${lead.bedrooms ?? '—'} bd · ${lead.bathrooms ?? '—'} ba · ${lead.square_feet ?? '—'} sf`,
      },
    ],
  }
}

function createDealAnalysisContent(lead: LeadSnapshot) {
  const arv = num(lead.house_value ?? lead.estimated_value ?? lead.market_value)
  const repairs = 0
  const assignmentFee = 10000
  const buyPercent = 0.7
  const mao = arv ? Math.round(arv * buyPercent - repairs - assignmentFee) : 0

  return {
    arv,
    repairs,
    assignmentFee,
    buyPercent: 70,
    mao,
    sellerPrice: 0,
    investorPrice: mao + assignmentFee,
    spread: assignmentFee,
    notes: '',
  }
}

function recomputeDealAnalysis(content: Record<string, any>) {
  const arv = num(content.arv)
  const repairs = num(content.repairs)
  const assignmentFee = num(content.assignmentFee)
  const buyPercent = num(content.buyPercent) || 70
  const sellerPrice = num(content.sellerPrice)

  const mao = arv ? Math.round(arv * (buyPercent / 100) - repairs - assignmentFee) : 0
  const investorPrice = sellerPrice && assignmentFee ? sellerPrice + assignmentFee : mao + assignmentFee
  const spread = investorPrice - sellerPrice

  return {
    ...content,
    arv,
    repairs,
    assignmentFee,
    buyPercent,
    mao,
    sellerPrice,
    investorPrice,
    spread,
  }
}

export default function WorkspaceCanvas({
  leadId,
  leadTitle,
}: {
  leadId: string
  leadTitle: string
}) {
  const [blocks, setBlocks] = useState<CanvasBlock[]>([])
  const [lead, setLead] = useState<LeadSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadCanvas()
  }, [leadId])

  async function loadCanvas() {
    setLoading(true)

    const [leadRes, blocksRes] = await Promise.all([
      supabase
        .from('leads')
        .select(`
          id,
          property_address_1,
          owner_name,
          lead_type,
          house_value,
          estimated_value,
          market_value,
          equity_amount,
          equity_percent,
          mortgage_balance,
          last_sale_amount,
          last_sale_date,
          default_amount,
          auction_date,
          property_type,
          bedrooms,
          bathrooms,
          square_feet,
          year_built,
          owner_occupied,
          vacant,
          notes_summary
        `)
        .eq('id', leadId)
        .single(),
      supabase
        .from('lead_canvas_blocks')
        .select('*')
        .eq('lead_id', leadId)
        .order('block_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ])

    if (!leadRes.error) {
      setLead(leadRes.data as LeadSnapshot)
    }

    if (!blocksRes.error) {
      setBlocks((blocksRes.data || []) as CanvasBlock[])
    }

    setLoading(false)
  }

  const nextOrder = useMemo(() => {
    if (!blocks.length) return 1
    return Math.max(...blocks.map((block) => block.block_order || 0)) + 1
  }, [blocks])

  async function createBlock(
    type: 'note' | 'signals' | 'deal-analysis'
  ) {
    if (!lead) return

    let title = 'Note'
    let color = 'gold'
    let content: Record<string, any> = { text: '' }

    if (type === 'signals') {
      title = 'Imported Signal Block'
      color = 'ice'
      content = createSignalBlockContent(lead)
    }

    if (type === 'deal-analysis') {
      title = 'Deal Analysis'
      color = 'green'
      content = createDealAnalysisContent(lead)
    }

    const { data, error } = await supabase
      .from('lead_canvas_blocks')
      .insert({
        lead_id: leadId,
        type,
        title,
        color,
        content,
        x: 40,
        y: 40,
        width: 360,
        height: 240,
        block_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    setBlocks((prev) => [...prev, data as CanvasBlock])
  }

  async function saveBlock(
    id: string,
    content: Record<string, any>,
    title?: string | null
  ) {
    const { error } = await supabase
      .from('lead_canvas_blocks')
      .update({
        content,
        title: title ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, content, title: title ?? block.title } : block
      )
    )
  }

  async function deleteBlock(id: string) {
    const { error } = await supabase
      .from('lead_canvas_blocks')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    setBlocks((prev) => prev.filter((block) => block.id !== id))
  }

  if (loading) {
    return (
      <SectionShell title="Workspace Canvas" subtitle="Loading workspace...">
        <div className="crm-muted">Loading canvas...</div>
      </SectionShell>
    )
  }

  return (
    <div style={canvasStackStyle}>
      <SectionShell
        title="Workspace Canvas"
        subtitle="Mental deal board for imported signals, underwriting, and notes."
        actions={
          <div style={toolbarStyle}>
            <ActionButton tone="gold" onClick={() => createBlock('note')}>
              Add Note
            </ActionButton>
            <ActionButton onClick={() => createBlock('signals')}>
              Add Signals
            </ActionButton>
            <ActionButton onClick={() => createBlock('deal-analysis')}>
              Add Analysis
            </ActionButton>
          </div>
        }
      >
        <div style={leadStripStyle}>
          <LeadStripItem label="Lead" value={lead?.property_address_1 || leadTitle} />
          <LeadStripItem label="Owner" value={lead?.owner_name || '—'} />
          <LeadStripItem label="Type" value={lead?.lead_type || 'standard'} />
          <LeadStripItem
            label="Value"
            value={money(lead?.house_value ?? lead?.estimated_value ?? lead?.market_value ?? null)}
          />
        </div>
      </SectionShell>

      <div style={canvasGridStyle}>
        {blocks.length === 0 ? (
          <div style={emptyCanvasStyle}>
            Start with a signal block or deal analysis block so the workspace becomes useful immediately.
          </div>
        ) : (
          blocks.map((block) => (
            <CanvasBlockCard
              key={block.id}
              block={block}
              onSave={saveBlock}
              onDelete={deleteBlock}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SectionShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="crm-section-card">
      <div className="crm-section-card-header">
        <div className="crm-section-card-heading">
          <h3 className="crm-section-card-title">{title}</h3>
          <p className="crm-section-card-subtitle">{subtitle}</p>
        </div>
        {actions ? <div className="crm-section-card-actions">{actions}</div> : null}
      </div>
      <div className="crm-section-card-body">{children}</div>
    </div>
  )
}

function LeadStripItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={leadStripItemStyle}>
      <div style={miniLabelStyle}>{label}</div>
      <div style={leadStripValueStyle}>{value}</div>
    </div>
  )
}

function CanvasBlockCard({
  block,
  onSave,
  onDelete,
}: {
  block: CanvasBlock
  onSave: (id: string, content: Record<string, any>, title?: string | null) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [title, setTitle] = useState(block.title || '')
  const [content, setContent] = useState<Record<string, any>>(block.content || {})
  const [saving, setSaving] = useState(false)

  const tone = block.color || 'gold'

  async function handleSave() {
    setSaving(true)
    const finalContent =
      block.type === 'deal-analysis' ? recomputeDealAnalysis(content) : content

    setContent(finalContent)
    await onSave(block.id, finalContent, title)
    setSaving(false)
  }

  return (
    <div
      style={{
        ...blockCardStyle,
        ...(tone === 'gold'
          ? goldBlockStyle
          : tone === 'ice'
            ? iceBlockStyle
            : greenBlockStyle),
      }}
    >
      <div style={blockHeaderStyle}>
        <input
          className="crm-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Block title"
        />
      </div>

      {block.type === 'note' ? (
        <textarea
          className="crm-textarea"
          value={content.text || ''}
          onChange={(e) => setContent({ ...content, text: e.target.value })}
          placeholder="Write deal thoughts, call notes, seller pressure, objections, or next moves..."
        />
      ) : null}

      {block.type === 'signals' ? (
        <div style={signalsGridStyle}>
          {(content.signals || []).map((signal: { label: string; value: string }, index: number) => (
            <div key={`${signal.label}-${index}`} style={signalCardStyle}>
              <div style={miniLabelStyle}>{signal.label}</div>
              <div style={signalValueStyle}>{signal.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {block.type === 'deal-analysis' ? (
        <div style={analysisGridStyle}>
          <Field
            label="ARV"
            value={content.arv ?? ''}
            onChange={(value) => setContent({ ...content, arv: value })}
          />
          <Field
            label="Repairs"
            value={content.repairs ?? ''}
            onChange={(value) => setContent({ ...content, repairs: value })}
          />
          <Field
            label="Assignment Fee"
            value={content.assignmentFee ?? ''}
            onChange={(value) => setContent({ ...content, assignmentFee: value })}
          />
          <Field
            label="Buy %"
            value={content.buyPercent ?? ''}
            onChange={(value) => setContent({ ...content, buyPercent: value })}
          />
          <Field
            label="Seller Price"
            value={content.sellerPrice ?? ''}
            onChange={(value) => setContent({ ...content, sellerPrice: value })}
          />
          <ReadOnlyField label="MAO" value={money(num(content.mao))} />
          <ReadOnlyField label="Investor Price" value={money(num(content.investorPrice))} />
          <ReadOnlyField label="Spread" value={money(num(content.spread))} />

          <div style={{ gridColumn: '1 / -1' }}>
            <textarea
              className="crm-textarea"
              value={content.notes || ''}
              onChange={(e) => setContent({ ...content, notes: e.target.value })}
              placeholder="Deal math notes, buyer angle, rehab risk, seller posture..."
            />
          </div>
        </div>
      ) : null}

      <div style={blockFooterStyle}>
        <ActionButton onClick={() => onDelete(block.id)}>Delete</ActionButton>
        <ActionButton tone="gold" onClick={handleSave}>
          {saving ? 'Saving...' : 'Save Block'}
        </ActionButton>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
}) {
  return (
    <div style={fieldWrapStyle}>
      <div style={miniLabelStyle}>{label}</div>
      <input
        className="crm-input"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={fieldWrapStyle}>
      <div style={miniLabelStyle}>{label}</div>
      <div style={readOnlyFieldStyle}>{value}</div>
    </div>
  )
}

const canvasStackStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const leadStripStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
}

const leadStripItemStyle: CSSProperties = {
  padding: 12,
  borderRadius: 14,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
}

const leadStripValueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--white-hi)',
  lineHeight: 1.45,
}

const miniLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--white-faint)',
  marginBottom: 8,
}

const canvasGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 14,
}

const emptyCanvasStyle: CSSProperties = {
  padding: 24,
  borderRadius: 18,
  border: '1px dashed rgba(255,255,255,0.12)',
  color: 'var(--white-faint)',
  textAlign: 'center',
  background: 'rgba(255,255,255,0.03)',
}

const blockCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'grid',
  gap: 12,
}

const goldBlockStyle: CSSProperties = {
  background:
    'radial-gradient(circle at top left, rgba(214,166,75,0.12), transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008)), rgba(0,0,0,0.18)',
}

const iceBlockStyle: CSSProperties = {
  background:
    'radial-gradient(circle at top left, rgba(147,197,253,0.12), transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008)), rgba(0,0,0,0.18)',
}

const greenBlockStyle: CSSProperties = {
  background:
    'radial-gradient(circle at top left, rgba(74,222,128,0.12), transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008)), rgba(0,0,0,0.18)',
}

const blockHeaderStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
}

const blockFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
}

const signalsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const signalCardStyle: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.05)',
}

const signalValueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--white-hi)',
  lineHeight: 1.45,
}

const analysisGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const fieldWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
}

const readOnlyFieldStyle: CSSProperties = {
  minHeight: 36,
  borderRadius: 13,
  border: '1px solid rgba(255,255,255,0.065)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.006)), rgba(0,0,0,0.18)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 11px',
  fontSize: 12,
  color: 'var(--white-hi)',
  fontWeight: 700,
}