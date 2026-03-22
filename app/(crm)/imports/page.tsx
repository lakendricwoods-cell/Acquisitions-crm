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
          `Parsed ${mapped.length} row${mapped.length === 1 ? '' : 's'}. Upload will create new leads or update existing matches.`
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
      subtitle="Upload files that create new leads or update existing leads when a match is found."
      actions={
        <>
          <StatPill label="Rows" value={stats.total} />
          <StatPill label="Workable" value={stats.workable} />
          <StatPill label="Value" value={stats.withHouseValue} />
          <StatPill label="Equity" value={stats.withEquity} />
        </>
      }
    >
      <div style={pageGridStyle}>
        <div style={leftRailStyle}>
          <SectionCard
            title="Import Console"
            subtitle="This importer reads wide rows and only depends on leads, not extra audit tables."
          >
            <div style={heroPanelStyle}>
              <div style={heroEyebrowStyle}>Matching Logic</div>
              <div style={heroTitleStyle}>Create if unmatched. Update if matched.</div>
              <div style={heroCopyStyle}>
                Matching order is source record, APN, address + zip, then address only.
                Sparse rows continue unless they have no usable identity at all.
              </div>
            </div>

            <div style={controlStackStyle}>
              <div style={fieldStackStyle}>
                <div style={labelStyle}>Source Label</div>
                <input
                  className="crm-input"
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  placeholder="Propwire March Batch"
                />
              </div>

              <div style={fieldStackStyle}>
                <div style={labelStyle}>CSV File</div>
                <input
                  className="crm-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
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
                  variant="gold"
                  onClick={handleImport}
                  disabled={!rows.length || loading}
                >
                  {loading ? 'Uploading...' : 'Create / Update Leads'}
                </ActionButton>
              </div>

              {message ? <div style={messageStyle}>{message}</div> : null}
            </div>
          </SectionCard>

          <SectionCard
            title="File Quality"
            subtitle="Quick read on whether the upload has enough usable signal."
          >
            <div style={metricsGridStyle}>
              <MetricCard title="Address" value={stats.withAddress} tone="gold" />
              <MetricCard title="House Value" value={stats.withHouseValue} tone="ice" />
              <MetricCard title="Equity" value={stats.withEquity} tone="green" />
              <MetricCard title="Mortgage" value={stats.withMortgage} tone="gold" />
            </div>

            <div style={metricsGridStyle}>
              <MetricCard title="Lead Type" value={stats.withLeadType} tone="green" />
              <MetricCard title="Workable Rows" value={stats.workable} tone="ice" />
            </div>
          </SectionCard>

          <SectionCard
            title="Last Import Run"
            subtitle="This shows whether rows were created, updated, skipped, or failed."
          >
            {runSummary ? (
              <div style={runSummaryWrapStyle}>
                <div style={runSummaryTopStyle}>
                  <RunSummaryBox label="Parsed" value={runSummary.parsed} />
                  <RunSummaryBox label="Created" value={runSummary.created} />
                  <RunSummaryBox label="Updated" value={runSummary.updated} />
                  <RunSummaryBox label="Skipped" value={runSummary.skipped} />
                  <RunSummaryBox label="Failed" value={runSummary.failed} />
                </div>

                <div style={runSourceStyle}>
                  <span style={runSourceLabelStyle}>Source</span>
                  <span className="crm-badge soft">{runSummary.source}</span>
                </div>

                {runSummary.errors.length ? (
                  <div style={errorPanelStyle}>
                    <div style={errorTitleStyle}>Actual Failure Messages</div>
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
              <div className="crm-muted" style={{ fontSize: 12 }}>
                No import has completed in this session yet.
              </div>
            )}
          </SectionCard>
        </div>

        <div style={rightRailStyle}>
          <SectionCard
            title="Imported Preview"
            subtitle="Preview the rows that will either create or update leads."
          >
            {!rows.length ? (
              <div className="crm-muted" style={emptyStateStyle}>
                No parsed rows yet.
              </div>
            ) : (
              <div className="crm-table-wrap">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>House Value</th>
                      <th>Equity</th>
                      <th>Lead Type</th>
                      <th>Mortgage</th>
                      <th>Last Money In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 12).map((row, index) => (
                      <tr key={`${row.property_address_1 || row.apn || 'row'}-${index}`}>
                        <td>
                          <div style={cellTitleStyle}>{safeText(row.property_address_1)}</div>
                          <div style={cellSubStyle}>{safeText(row.owner_name)}</div>
                        </td>
                        <td>{money(row.house_value)}</td>
                        <td>{money(row.equity_amount)}</td>
                        <td>
                          <span className="crm-badge soft">{safeText(row.lead_type)}</span>
                        </td>
                        <td>{money(row.mortgage_balance)}</td>
                        <td>{money(row.last_sale_amount)}</td>
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

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string
  value: number
  tone: 'gold' | 'ice' | 'green'
}) {
  const palette =
    tone === 'gold'
      ? { border: 'rgba(214,166,75,0.24)', bg: 'rgba(214,166,75,0.08)', text: '#f3d899' }
      : tone === 'ice'
        ? { border: 'rgba(147,197,253,0.22)', bg: 'rgba(147,197,253,0.08)', text: '#dcecff' }
        : { border: 'rgba(70,223,139,0.22)', bg: 'rgba(70,223,139,0.08)', text: '#cbf8de' }

  return (
    <div style={{ ...metricCardStyle, borderColor: palette.border, background: palette.bg }}>
      <div style={metricLabelStyle}>{title}</div>
      <div style={{ color: palette.text, fontSize: 26, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

function RunSummaryBox({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div style={runSummaryBoxStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={runSummaryValueStyle}>{value}</div>
    </div>
  )
}

const pageGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '440px minmax(0, 1fr)',
  gap: 16,
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
  padding: 16,
  borderRadius: 18,
  border: '1px solid rgba(214,166,75,0.18)',
  background:
    'radial-gradient(circle at top left, rgba(214,166,75,0.12), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.006)), rgba(0,0,0,0.20)',
}

const heroEyebrowStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--white-faint)',
}

const heroTitleStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 21,
  lineHeight: 1.08,
  fontWeight: 780,
  letterSpacing: '-0.03em',
  color: 'var(--white-hi)',
}

const heroCopyStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  lineHeight: 1.6,
  color: 'var(--white-soft)',
}

const controlStackStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const fieldStackStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--white-faint)',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

const messageStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.006)), rgba(0,0,0,0.16)',
  color: 'var(--white-soft)',
  fontSize: 12,
  lineHeight: 1.55,
}

const metricsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 10,
}

const metricCardStyle: CSSProperties = {
  padding: 12,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
}

const metricLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--white-faint)',
  marginBottom: 8,
}

const runSummaryWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const runSummaryTopStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 10,
}

const runSummaryBoxStyle: CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
}

const runSummaryValueStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--white-hi)',
}

const runSourceStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const runSourceLabelStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--white-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
}

const errorPanelStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 12,
  borderRadius: 16,
  background: 'rgba(240,123,123,0.08)',
  border: '1px solid rgba(240,123,123,0.18)',
}

const errorTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#ffd5d5',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const errorListStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  maxHeight: 220,
  overflow: 'auto',
}

const errorItemStyle: CSSProperties = {
  padding: 10,
  borderRadius: 12,
  background: 'rgba(0,0,0,0.22)',
  color: 'rgba(255,255,255,0.82)',
  fontSize: 12,
  lineHeight: 1.45,
  border: '1px solid rgba(255,255,255,0.06)',
}

const emptyStateStyle: CSSProperties = {
  fontSize: 12,
  padding: '4px 0',
}

const cellTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--white-hi)',
}

const cellSubStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  color: 'var(--white-faint)',
}