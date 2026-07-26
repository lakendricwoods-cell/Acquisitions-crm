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
      <div style={pageGridStyle}>
        {/* Left Control Column */}
        <div style={leftRailStyle}>
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
                    <span style={{ fontSize: 20 }}>📁</span>
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
            title="File Health & Quality"
            subtitle="Data completeness checks across critical valuation vectors."
          >
            <div style={metricsGridStyle}>
              <MetricCard title="Address" value={stats.withAddress} neon="cyan" />
              <MetricCard title="House Value" value={stats.withHouseValue} neon="magenta" />
              <MetricCard title="Equity" value={stats.withEquity} neon="lime" />
              <MetricCard title="Mortgage" value={stats.withMortgage} neon="yellow" />
            </div>

            <div style={metricsGridStyle}>
              <MetricCard title="Distress / Lead Type" value={stats.withLeadType} neon="orange" />
              <MetricCard title="Workable Rows" value={stats.workable} neon="purple" />
            </div>
          </SectionCard>

          <SectionCard
            title="Last Import Batch"
            subtitle="Execution summary for the most recent import run."
          >
            {runSummary ? (
              <div style={runSummaryWrapStyle}>
                <div style={runSummaryTopStyle}>
                  <RunSummaryBox label="Parsed" value={runSummary.parsed} neon="cyan" />
                  <RunSummaryBox label="Created" value={runSummary.created} neon="lime" />
                  <RunSummaryBox label="Updated" value={runSummary.updated} neon="magenta" />
                  <RunSummaryBox label="Skipped" value={runSummary.skipped} neon="yellow" />
                  <RunSummaryBox label="Failed" value={runSummary.failed} neon="orange" />
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

        {/* Right Preview Column */}
        <div style={rightRailStyle}>
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
                      <th style={{ ...thStyle, width: '30%', color: '#00f0ff' }}>PROPERTY / OWNER</th>
                      <th style={{ ...thStyle, width: '15%', textAlign: 'right', color: '#ff007f' }}>HOUSE VALUE</th>
                      <th style={{ ...thStyle, width: '15%', textAlign: 'right', color: '#39ff14' }}>EQUITY</th>
                      <th style={{ ...thStyle, width: '14%', color: '#ffbd03' }}>LEAD TYPE</th>
                      <th style={{ ...thStyle, width: '13%', textAlign: 'right', color: '#bf00ff' }}>MORTGAGE</th>
                      <th style={{ ...thStyle, width: '13%', textAlign: 'right', color: '#ff6600' }}>LAST SALE</th>
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
                          <span style={magentaValueStyle}>{money(row.house_value)}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span style={limeValueStyle}>{money(row.equity_amount)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={badgeStyle}>{safeText(row.lead_type)}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span style={purpleValueStyle}>{money(row.mortgage_balance)}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span style={orangeValueStyle}>{money(row.last_sale_amount)}</span>
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
    </PageShell>
  )
}

type NeonColor = 'cyan' | 'magenta' | 'lime' | 'yellow' | 'orange' | 'purple'

const NEON_MAP: Record<NeonColor, { border: string; bg: string; text: string; shadow: string }> = {
  cyan: {
    border: 'rgba(0,240,255,0.4)',
    bg: 'rgba(0,240,255,0.06)',
    text: '#00f0ff',
    shadow: '0 0 12px rgba(0,240,255,0.15)',
  },
  magenta: {
    border: 'rgba(255,0,127,0.4)',
    bg: 'rgba(255,0,127,0.06)',
    text: '#ff007f',
    shadow: '0 0 12px rgba(255,0,127,0.15)',
  },
  lime: {
    border: 'rgba(57,255,20,0.4)',
    bg: 'rgba(57,255,20,0.06)',
    text: '#39ff14',
    shadow: '0 0 12px rgba(57,255,20,0.15)',
  },
  yellow: {
    border: 'rgba(255,189,3,0.4)',
    bg: 'rgba(255,189,3,0.06)',
    text: '#ffbd03',
    shadow: '0 0 12px rgba(255,189,3,0.15)',
  },
  orange: {
    border: 'rgba(255,102,0,0.4)',
    bg: 'rgba(255,102,0,0.06)',
    text: '#ff6600',
    shadow: '0 0 12px rgba(255,102,0,0.15)',
  },
  purple: {
    border: 'rgba(191,0,255,0.4)',
    bg: 'rgba(191,0,255,0.06)',
    text: '#bf00ff',
    shadow: '0 0 12px rgba(191,0,255,0.15)',
  },
}

function MetricCard({ title, value, neon }: { title: string; value: number; neon: NeonColor }) {
  const theme = NEON_MAP[neon]
  return (
    <div
      style={{
        ...metricCardStyle,
        borderColor: theme.border,
        background: theme.bg,
        boxShadow: theme.shadow,
      }}
    >
      <div style={{ ...metricLabelStyle, color: theme.text }}>{title}</div>
      <div style={{ color: theme.text, fontSize: 26, fontWeight: 900, textShadow: `0 0 10px ${theme.border}` }}>
        {value}
      </div>
    </div>
  )
}

function RunSummaryBox({ label, value, neon }: { label: string; value: number; neon: NeonColor }) {
  const theme = NEON_MAP[neon]
  return (
    <div style={{ ...runSummaryBoxStyle, borderColor: theme.border, background: theme.bg }}>
      <div style={{ ...metricLabelStyle, color: theme.text }}>{label}</div>
      <div style={{ ...runSummaryValueStyle, color: theme.text }}>{value}</div>
    </div>
  )
}

// ---------------- STYLES ----------------

const pageGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '420px minmax(0, 1fr)',
  gap: 20,
  alignItems: 'start',
}

const leftRailStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const rightRailStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroPanelStyle: CSSProperties = {
  padding: 18,
  borderRadius: 16,
  border: '1px solid rgba(0,240,255,0.4)',
  background:
    'radial-gradient(circle at top left, rgba(255,0,127,0.15), transparent 60%), linear-gradient(180deg, rgba(20,18,28,0.9), rgba(8,8,12,0.95))',
  boxShadow: '0 0 20px rgba(0,240,255,0.15)',
}

const heroEyebrowStyle: CSSProperties = {
  fontSize: 9.5,
  fontWeight: 900,
  letterSpacing: '0.14em',
  color: '#39ff14',
}

const heroTitleStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 17,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#ffffff',
}

const heroCopyStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.6)',
}

const controlStackStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  marginTop: 6,
}

const fieldStackStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  color: '#ff007f',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const customInputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid rgba(0,240,255,0.3)',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#00f0ff',
  fontSize: 12.5,
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
}

const dropzoneStyle: CSSProperties = {
  position: 'relative',
  border: '1px dashed rgba(255,0,127,0.5)',
  borderRadius: 12,
  background: 'rgba(255,0,127,0.04)',
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
  gap: 10,
  pointerEvents: 'none',
}

const fileNameTextStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#ffbd03',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 4,
}

const messageStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(57,255,20,0.4)',
  background: 'rgba(57,255,20,0.08)',
  color: '#39ff14',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.4,
}

const metricsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 10,
}

const metricCardStyle: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid',
}

const metricLabelStyle: CSSProperties = {
  fontSize: 9.5,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 6,
  fontWeight: 800,
}

const runSummaryWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const runSummaryTopStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 8,
}

const runSummaryBoxStyle: CSSProperties = {
  padding: '10px 8px',
  borderRadius: 10,
  border: '1px solid',
  textAlign: 'center',
}

const runSummaryValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
}

const runSourceStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 4,
}

const runSourceLabelStyle: CSSProperties = {
  fontSize: 10.5,
  color: '#00f0ff',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 800,
}

const sourceTagStyle: CSSProperties = {
  fontSize: 11,
  padding: '3px 8px',
  borderRadius: 6,
  background: 'rgba(255,0,127,0.15)',
  border: '1px solid rgba(255,0,127,0.4)',
  color: '#ff007f',
  fontWeight: 800,
}

const errorPanelStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 12,
  borderRadius: 12,
  background: 'rgba(255,102,0,0.08)',
  border: '1px solid rgba(255,102,0,0.4)',
}

const errorTitleStyle: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 800,
  color: '#ff6600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const errorListStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  maxHeight: 180,
  overflow: 'auto',
}

const errorItemStyle: CSSProperties = {
  padding: 8,
  borderRadius: 8,
  background: 'rgba(0,0,0,0.4)',
  color: '#ffbd03',
  fontSize: 11.5,
  lineHeight: 1.4,
}

const emptyMutedStyle: CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.4)',
}

const emptyStateStyle: CSSProperties = {
  fontSize: 12.5,
  color: '#00f0ff',
  padding: '40px 0',
  textAlign: 'center',
}

const tableWrapStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  borderRadius: 12,
  border: '1px solid rgba(0,240,255,0.2)',
  background: 'rgba(0,0,0,0.4)',
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
  borderBottom: '1px solid rgba(255,255,255,0.1)',
}

const thStyle: CSSProperties = {
  padding: '12px 14px',
  fontSize: 9.5,
  fontWeight: 900,
  letterSpacing: '0.1em',
  whiteSpace: 'nowrap',
}

const trStyle: CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.05)',
}

const tdStyle: CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
  color: '#ffffff',
}

const cellTitleStyle: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 800,
  color: '#00f0ff',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 220,
}

const cellSubStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 11,
  color: '#ff007f',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 220,
}

const magentaValueStyle: CSSProperties = {
  fontWeight: 800,
  color: '#ff007f',
}

const limeValueStyle: CSSProperties = {
  fontWeight: 800,
  color: '#39ff14',
}

const purpleValueStyle: CSSProperties = {
  fontWeight: 800,
  color: '#bf00ff',
}

const orangeValueStyle: CSSProperties = {
  fontWeight: 800,
  color: '#ff6600',
}

const badgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: '#ffbd03',
  background: 'rgba(255,189,3,0.12)',
  border: '1px solid rgba(255,189,3,0.3)',
  whiteSpace: 'nowrap',
}
