'use client'

import Papa from 'papaparse'
import { useMemo, useState, type CSSProperties, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import StatPill from '@/components/ui/stat-pill'
import { mapPropwireRow, type PropwireRow } from '@/lib/imports/propwire-map'
import { upsertWideLead } from '@/lib/imports/upsert-wide-lead'

type PreviewRow = ReturnType<typeof mapPropwireRow>

type ImportRunSummary = {
  parsed: number
  created: number
  updated: number
  skipped: number
  failed: number
  source: string
  errors: string[]
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function safeText(value: unknown) {
  if (value === null || value === undefined) return '—'
  const text = String(value).trim()
  return text.length ? text : '—'
}

export default function ImportsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [sourceLabel, setSourceLabel] = useState('Propwire')
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [message, setMessage] = useState('')
  const [runSummary, setRunSummary] = useState<ImportRunSummary | null>(null)

  const stats = useMemo(() => {
    const total = rows.length
    const withAddress = rows.filter((r) => !!r.property_address_1).length
    const withHouseValue = rows.filter((r) => r.house_value !== null).length
    const withEquity = rows.filter((r) => r.equity_amount !== null).length
    const withMortgage = rows.filter((r) => r.mortgage_balance !== null).length
    const withLeadType = rows.filter((r) => !!r.lead_type && r.lead_type !== 'standard').length
    const workable = rows.filter(
      (r) => !!r.property_address_1 || !!r.apn || !!r.source_record_id
    ).length

    return {
      total,
      withAddress,
      withHouseValue,
      withEquity,
      withMortgage,
      withLeadType,
      workable,
    }
  }, [rows])

  async function parseSelectedFile(selectedFile: File) {
    setParsing(true)
    setRows([])
    setMessage('')
    setRunSummary(null)

    try {
      const text = await selectedFile.text()

      const parsed = Papa.parse<PropwireRow>(text, {
        header: true,
        skipEmptyLines: true,
      })

      if (parsed.errors.length) {
        setMessage(parsed.errors[0]?.message || 'CSV parse failed.')
        setRows([])
        return
      }

      const resolvedSource = sourceLabel.trim() || 'Propwire'

      const mapped = parsed.data.map((row) =>
        mapPropwireRow({
          ...row,
          source_name: resolvedSource,
          SourceName: resolvedSource,
          lead_source: resolvedSource,
        })
      )

      setRows(mapped)

      if (!mapped.length) {
        setMessage('No rows were found in this file.')
      } else {
        setMessage(
          `Parsed ${mapped.length} row${mapped.length === 1 ? '' : 's'}. Ready for upsert sync.`
        )
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to parse file.')
      setRows([])
    } finally {
      setParsing(false)
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null
    setFile(selectedFile)
    setRows([])
    setMessage('')
    setRunSummary(null)

    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setMessage('Only CSV imports are enabled right now.')
      return
    }

    await parseSelectedFile(selectedFile)
  }

  async function handleImport() {
    if (!rows.length) {
      alert('Parse a CSV first.')
      return
    }

    setLoading(true)
    setMessage('')
    setRunSummary(null)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      setLoading(false)
      alert(authError.message)
      return
    }

    if (!user) {
      setLoading(false)
      alert('You must be logged in to import leads.')
      return
    }

    try {
      const resolvedSource = sourceLabel.trim() || 'Propwire'

      let created = 0
      let updated = 0
      let skipped = 0
      let failed = 0
      const errors: string[] = []

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index]

        const payload = {
          ...row,
          source_name: resolvedSource || row.source_name || 'Propwire',
          lead_source: resolvedSource || row.lead_source || 'csv_import',
        }

        try {
          const result = await upsertWideLead(supabase, payload, user.id)

          if (result.action === 'created') {
            created += 1
            continue
          }

          if (result.action === 'updated') {
            updated += 1
            continue
          }

          skipped += 1
          const reason = result.reason || 'Skipped'

          errors.push(
            `Row ${index + 1}${row.property_address_1 ? ` (${row.property_address_1})` : ''}: ${reason}`
          )
        } catch (error: any) {
          failed += 1
          const rowError =
            error?.message ||
            error?.details ||
            error?.hint ||
            'Unknown import error'

          errors.push(
            `Row ${index + 1}${row.property_address_1 ? ` (${row.property_address_1})` : ''}: ${rowError}`
          )
        }
      }

      const summary: ImportRunSummary = {
        parsed: rows.length,
        created,
        updated,
        skipped,
        failed,
        source: resolvedSource,
        errors,
      }

      setRunSummary(summary)

      setMessage(
        failed === 0
          ? `Import complete. Created ${created}, updated ${updated}, skipped ${skipped}.`
          : `Import finished with errors. Created ${created}, updated ${updated}, skipped ${skipped}, failed ${failed}.`
      )
    } catch (error: any) {
      const topLevelMessage =
        error?.message || error?.details || error?.hint || 'Import failed.'
      setMessage(topLevelMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell
      title="Imports"
      subtitle="Upload wide-row property files to create new leads or update existing database records."
      actions={
        <>
          <StatPill label="Rows" value={stats.total} />
          <StatPill label="Workable" value={stats.workable} />
          <StatPill label="Value Signal" value={stats.withHouseValue} />
          <StatPill label="Equity Signal" value={stats.withEquity} />
        </>
      }
    >
      <div style={pageContainerStyle}>
        {/* Top Stage Headers Matching System Theme */}
        <div style={stageGridStyle}>
          <StageCard title="Parsed Records" count={stats.total} accent="neutral" />
          <StageCard title="Address Signal" count={stats.withAddress} accent="blue" />
          <StageCard title="Valuation Signal" count={stats.withHouseValue} accent="purple" />
          <StageCard title="Equity Signal" count={stats.withEquity} accent="amber" />
          <StageCard title="Workable Leads" count={stats.workable} accent="emerald" />
        </div>

        {/* Main Layout Grid */}
        <div style={mainGridStyle}>
          {/* Left Console */}
          <div style={leftColumnStyle}>
            <SectionCard
              title="Import Console"
              subtitle="Configure source attribution and process wide lead files."
            >
              <div style={heroPanelStyle}>
                <div style={heroEyebrowStyle}>INSPECTION & UPSERT ENGINE</div>
                <div style={heroTitleStyle}>Smart Matching & Deduplication</div>
                <div style={heroCopyStyle}>
                  Pre-matches records against your database by source ID, APN, or property address before creating or updating rows.
                </div>
              </div>

              <div style={controlStackStyle}>
                <div style={fieldStackStyle}>
                  <label style={labelStyle}>Source Label</label>
                  <input
                    style={customInputStyle}
                    value={sourceLabel}
                    onChange={(e) => setSourceLabel(e.target.value)}
                    placeholder="e.g. Propwire March Batch"
                  />
                </div>

                <div style={fieldStackStyle}>
                  <label style={labelStyle}>Select CSV Data File</label>
                  <div style={dropzoneStyle}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      style={fileInputOverlayStyle}
                    />
                    <div style={fileLabelContentStyle}>
                      <span style={{ fontSize: 18, color: '#d4af37' }}>📁</span>
                      <span style={fileNameTextStyle}>
                        {file ? file.name : 'Choose or drop CSV file'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={actionsStyle}>
                  <ActionButton
                    onClick={() => {
                      if (file) void parseSelectedFile(file)
                    }}
                    disabled={!file || parsing}
                  >
                    {parsing ? 'Parsing...' : 'Re-Parse CSV'}
                  </ActionButton>

                  <ActionButton
                    tone="gold"
                    onClick={handleImport}
                    disabled={!rows.length || loading}
                  >
                    {loading ? 'Processing Sync...' : 'Create / Update Leads'}
                  </ActionButton>
                </div>

                {message ? <div style={messageStyle}>{message}</div> : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Last Import Batch"
              subtitle="Execution summary for the most recent import run."
            >
              {runSummary ? (
                <div style={runSummaryWrapStyle}>
                  <div style={runSummaryTopStyle}>
                    <RunSummaryBox label="Parsed" value={runSummary.parsed} />
                    <RunSummaryBox label="Created" value={runSummary.created} color="#10b981" />
                    <RunSummaryBox label="Updated" value={runSummary.updated} color="#3b82f6" />
                    <RunSummaryBox label="Skipped" value={runSummary.skipped} color="#f59e0b" />
                    <RunSummaryBox label="Failed" value={runSummary.failed} color="#ef4444" />
                  </div>

                  <div style={runSourceStyle}>
                    <span style={runSourceLabelStyle}>Attributed Source</span>
                    <span style={sourceTagStyle}>{runSummary.source}</span>
                  </div>

                  {runSummary.errors.length ? (
                    <div style={errorPanelStyle}>
                      <div style={errorTitleStyle}>Failed Record Log</div>
                      <div style={errorListStyle}>
                        {runSummary.errors.map((error, index) => (
                          <div key={`${error}-${index}`} style={errorItemStyle}>
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={emptyMutedStyle}>No execution summary available for this session.</div>
              )}
            </SectionCard>
          </div>

          {/* Right Preview Grid */}
          <div style={rightColumnStyle}>
            <SectionCard
              title="Import Preview Grid"
              subtitle="Inspect incoming properties before committing records into Supabase."
            >
              {!rows.length ? (
                <div style={emptyStateStyle}>
                  No parsed rows loaded. Select a CSV file to inspect property data.
                </div>
              ) : (
                <div style={tableWrapStyle}>
                  <table style={customTableStyle}>
                    <thead>
                      <tr style={thRowStyle}>
                        <th style={{ ...thStyle, width: '32%' }}>PROPERTY / OWNER</th>
                        <th style={{ ...thStyle, width: '15%', textAlign: 'right' }}>HOUSE VALUE</th>
                        <th style={{ ...thStyle, width: '15%', textAlign: 'right' }}>EQUITY</th>
                        <th style={{ ...thStyle, width: '14%' }}>LEAD TYPE</th>
                        <th style={{ ...thStyle, width: '12%', textAlign: 'right' }}>MORTGAGE</th>
                        <th style={{ ...thStyle, width: '12%', textAlign: 'right' }}>LAST SALE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 16).map((row, index) => (
                        <tr key={`${row.property_address_1 || row.apn || 'row'}-${index}`} style={trStyle}>
                          <td style={tdStyle}>
                            <div style={cellTitleStyle} title={safeText(row.property_address_1)}>
                              {safeText(row.property_address_1)}
                            </div>
                            <div style={cellSubStyle} title={safeText(row.owner_name)}>
                              {safeText(row.owner_name)}
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <span style={textHighlightStyle}>{money(row.house_value)}</span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>{money(row.equity_amount)}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={badgeStyle}>{safeText(row.lead_type)}</span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <span style={mutedTextStyle}>{money(row.mortgage_balance)}</span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <span style={mutedTextStyle}>{money(row.last_sale_amount)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

type AccentColor = 'neutral' | 'blue' | 'purple' | 'amber' | 'emerald'

const ACCENT_MAP: Record<AccentColor, { headerBg: string; border: string; pillBg: string; text: string }> = {
  neutral: {
    headerBg: 'rgba(18, 18, 22, 0.65)',
    border: 'rgba(255, 255, 255, 0.08)',
    pillBg: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
  },
  blue: {
    headerBg: 'rgba(18, 18, 22, 0.65)',
    border: 'rgba(59, 130, 246, 0.25)',
    pillBg: 'rgba(59, 130, 246, 0.15)',
    text: '#60a5fa',
  },
  purple: {
    headerBg: 'rgba(18, 18, 22, 0.65)',
    border: 'rgba(168, 85, 247, 0.25)',
    pillBg: 'rgba(168, 85, 247, 0.15)',
    text: '#c084fc',
  },
  amber: {
    headerBg: 'rgba(18, 18, 22, 0.65)',
    border: 'rgba(212, 175, 55, 0.3)',
    pillBg: 'rgba(245, 158, 11, 0.15)',
    text: '#fcd34d',
  },
  emerald: {
    headerBg: 'rgba(18, 18, 22, 0.65)',
    border: 'rgba(16, 185, 129, 0.25)',
    pillBg: 'rgba(16, 185, 129, 0.15)',
    text: '#34d399',
  },
}

function StageCard({ title, count, accent }: { title: string; count: number; accent: AccentColor }) {
  const style = ACCENT_MAP[accent]
  return (
    <div
      style={{
        background: style.headerBg,
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: style.text }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f4f6' }}>{title}</span>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: style.text,
          background: style.pillBg,
          padding: '2px 9px',
          borderRadius: 12,
        }}
      >
        {count}
      </span>
    </div>
  )
}

function RunSummaryBox({ label, value, color = '#f3f4f6' }: { label: string; value: number; color?: string }) {
  return (
    <div style={runSummaryBoxStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...runSummaryValueStyle, color }}>{value}</div>
    </div>
  )
}

// ---------------- STYLES ----------------

const pageContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const stageGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 12,
}

const mainGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '380px minmax(0, 1fr)',
  gap: 20,
  alignItems: 'start',
}

const leftColumnStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const rightColumnStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroPanelStyle: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  border: '1px solid rgba(212, 175, 55, 0.25)',
  background: 'rgba(18, 18, 22, 0.65)',
  backdropFilter: 'blur(12px)',
}

const heroEyebrowStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.12em',
  color: '#d4af37',
}

const heroTitleStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 15,
  fontWeight: 700,
  color: '#ffffff',
}

const heroCopyStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 11.5,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.5)',
}

const controlStackStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  marginTop: 4,
}

const fieldStackStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.6)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const customInputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(10, 10, 14, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#ffffff',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
}

const dropzoneStyle: CSSProperties = {
  position: 'relative',
  border: '1px dashed rgba(212, 175, 55, 0.3)',
  borderRadius: 8,
  background: 'rgba(18, 18, 22, 0.4)',
  padding: '12px 14px',
  cursor: 'pointer',
}

const fileInputOverlayStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
}

const fileLabelContentStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  pointerEvents: 'none',
}

const fileNameTextStyle: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.85)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 4,
}

const messageStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid rgba(16,185,129,0.35)',
  background: 'rgba(16,185,129,0.1)',
  color: '#34d399',
  fontSize: 11.5,
  fontWeight: 500,
}

const metricLabelStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 4,
  fontWeight: 700,
}

const runSummaryWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const runSummaryTopStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 6,
}

const runSummaryBoxStyle: CSSProperties = {
  padding: '8px 6px',
  borderRadius: 8,
  background: 'rgba(14, 14, 18, 0.6)',
  border: '1px solid rgba(255,255,255,0.08)',
  textAlign: 'center',
}

const runSummaryValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
}

const runSourceStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 4,
}

const runSourceLabelStyle: CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 700,
}

const sourceTagStyle: CSSProperties = {
  fontSize: 10.5,
  padding: '2px 8px',
  borderRadius: 4,
  background: 'rgba(212, 175, 55, 0.15)',
  border: '1px solid rgba(212, 175, 55, 0.4)',
  color: '#d4af37',
  fontWeight: 600,
}

const errorPanelStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 10,
  borderRadius: 8,
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.25)',
}

const errorTitleStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: '#f87171',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const errorListStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  maxHeight: 140,
  overflow: 'auto',
}

const errorItemStyle: CSSProperties = {
  padding: 6,
  borderRadius: 4,
  background: 'rgba(0,0,0,0.5)',
  color: '#fca5a5',
  fontSize: 11,
  lineHeight: 1.4,
}

const emptyMutedStyle: CSSProperties = {
  fontSize: 11.5,
  color: 'rgba(255,255,255,0.3)',
}

const emptyStateStyle: CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.4)',
  padding: '40px 0',
  textAlign: 'center',
}

const tableWrapStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(10, 10, 14, 0.6)',
  backdropFilter: 'blur(12px)',
}

const customTableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
  textAlign: 'left',
  minWidth: 680,
}

const thRowStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}

const thStyle: CSSProperties = {
  padding: '10px 12px',
  fontSize: 9.5,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
}

const trStyle: CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.04)',
}

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
  color: '#ffffff',
}

const cellTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#ffffff',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 220,
}

const cellSubStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 10.5,
  color: 'rgba(255,255,255,0.4)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 220,
}

const textHighlightStyle: CSSProperties = {
  fontWeight: 600,
  color: '#f3f4f6',
}

const mutedTextStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
}

const badgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '2px 7px',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 600,
  color: '#d4af37',
  background: 'rgba(212,175,55,0.12)',
  border: '1px solid rgba(212,175,55,0.25)',
  whiteSpace: 'nowrap',
}
