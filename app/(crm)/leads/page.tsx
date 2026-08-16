'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'

import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import StatPill from '@/components/ui/stat-pill'
import ActionButton from '@/components/ui/action-button'
import { supabase } from '@/lib/supabase'

type LeadRow = {
  id: string

  property_address_1?: string | null
  property_address?: string | null

  owner_name?: string | null

  owner_phone_primary?: string | null
  phone1?: string | null

  owner_email?: string | null
  email1?: string | null

  city?: string | null
  property_city?: string | null

  state?: string | null
  property_state?: string | null

  zip?: string | null
  property_zip?: string | null

  /**
   * Canonical pipeline field.
   */
  stage?: string | null

  asking_price?: number | null
  listing_price?: number | null

  /**
   * These are intentionally NOT used as fallbacks
   * for ARV or market value.
   */
  market_value?: number | null
  estimated_value?: number | null
  arv?: number | null

  /**
   * Optional analysis fields.
   * If your database doesn't contain these yet,
   * the UI simply displays unavailable.
   */
  strength?: number | null
  motivation?: number | null
  contactability?: number | null
  marketability?: number | null

  created_at?: string | null
}

type FilterKey =
  | 'all'
  | 'high'
  | 'workable'
  | 'missing-contact'
  | 'missing-market'

const STAGE_OPTIONS = [
  { value: 'new_lead', label: 'New Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'appointment_set', label: 'Appointment Set' },
  { value: 'offer_sent', label: 'Offer Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
  { value: 'dead_lead', label: 'Dead / Archive' },
] as const

type StageValue = (typeof STAGE_OPTIONS)[number]['value']

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  return (
    values.find(
      (value) =>
        typeof value === 'string' && value.trim().length > 0,
    ) || null
  )
}

function formatMoney(
  value: number | null | undefined,
): string {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return '—'
  }

  return `$${Math.round(value).toLocaleString()}`
}

function formatScore(
  value: number | null | undefined,
): string {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return '—'
  }

  return Math.round(value).toString()
}

function titleCase(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function getLeadStage(lead: LeadRow): StageValue {
  const stage = lead.stage

  if (
    stage &&
    STAGE_OPTIONS.some((option) => option.value === stage)
  ) {
    return stage as StageValue
  }

  return 'new_lead'
}

function getStageTone(stage: string): string {
  const normalized = stage.toLowerCase()

  if (normalized.includes('contract')) {
    return '#4ade80'
  }

  if (normalized.includes('contact')) {
    return '#f59e0b'
  }

  if (normalized.includes('appoint')) {
    return '#38bdf8'
  }

  if (normalized.includes('offer')) {
    return '#fbbf24'
  }

  if (normalized.includes('negotiation')) {
    return '#a78bfa'
  }

  if (
    normalized.includes('dead') ||
    normalized.includes('archive')
  ) {
    return '#ef4444'
  }

  return '#e0b84f'
}

function getPhone(lead: LeadRow): string | null {
  return firstNonEmpty(
    lead.owner_phone_primary,
    lead.phone1,
  )
}

function getEmail(lead: LeadRow): string | null {
  return firstNonEmpty(
    lead.owner_email,
    lead.email1,
  )
}

function getAddress(lead: LeadRow): string {
  return (
    firstNonEmpty(
      lead.property_address_1,
      lead.property_address,
    ) || 'Unknown property'
  )
}

function getLocation(lead: LeadRow): string {
  const parts = [
    firstNonEmpty(
      lead.city,
      lead.property_city,
    ),
    firstNonEmpty(
      lead.state,
      lead.property_state,
    ),
    firstNonEmpty(
      lead.zip,
      lead.property_zip,
    ),
  ].filter(Boolean)

  return parts.length
    ? parts.join(', ')
    : 'Location pending'
}

function isNumber(
  value: number | null | undefined,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function scoreLevel(
  value: number | null | undefined,
): string {
  if (!isNumber(value)) return 'Not analyzed'
  if (value >= 80) return 'Strong'
  if (value >= 60) return 'Workable'
  if (value >= 40) return 'Needs review'
  return 'Weak'
}

function scoreTone(
  value: number | null | undefined,
): 'gold' | 'green' | 'blue' | 'orange' {
  if (!isNumber(value)) return 'blue'
  if (value >= 80) return 'green'
  if (value >= 60) return 'gold'
  return 'orange'
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] =
    useState<FilterKey>('all')

  const [isMobile, setIsMobile] =
    useState(false)

  const [selectedLeadIds, setSelectedLeadIds] =
    useState<string[]>([])

  const [bulkStage, setBulkStage] =
    useState<StageValue>('new_lead')

  const [savingLeadId, setSavingLeadId] =
    useState<string | null>(null)

  const [savingBulk, setSavingBulk] =
    useState(false)

  useEffect(() => {
    function syncViewport() {
      setIsMobile(window.innerWidth <= 900)
    }

    syncViewport()

    window.addEventListener(
      'resize',
      syncViewport,
    )

    return () => {
      window.removeEventListener(
        'resize',
        syncViewport,
      )
    }
  }, [])

  async function loadLeads() {
    setLoading(true)

    const {
      data,
      error,
    } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Failed to load leads:',
        error,
      )

      setLeads([])
      setLoading(false)
      return
    }

    setLeads(
      (data as LeadRow[]) || [],
    )

    setLoading(false)
  }

  useEffect(() => {
    void loadLeads()
  }, [])

  const rows = useMemo(() => {
    return leads.map((lead) => {
      const stage = getLeadStage(lead)

      return {
        lead,

        address: getAddress(lead),

        location: getLocation(lead),

        owner:
          lead.owner_name ||
          'Unknown owner',

        phone:
          getPhone(lead) ||
          'No phone',

        email:
          getEmail(lead) ||
          'No email',

        stage,

        stageLabel: titleCase(stage),

        stageColor:
          getStageTone(stage),

        askingPrice:
          lead.asking_price ??
          lead.listing_price ??
          null,

        arv:
          lead.arv ?? null,

        strength:
          lead.strength ?? null,

        motivation:
          lead.motivation ?? null,

        contactability:
          lead.contactability ?? null,

        marketability:
          lead.marketability ?? null,
      }
    })
  }, [leads])

  const filteredRows = useMemo(() => {
    const q =
      query.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [
        row.address,
        row.location,
        row.owner,
        row.phone,
        row.email,
        row.stageLabel,
      ]
        .join(' ')
        .toLowerCase()

      if (
        q &&
        !haystack.includes(q)
      ) {
        return false
      }

      if (
        filter === 'high'
      ) {
        return (
          isNumber(row.strength) &&
          row.strength >= 80
        )
      }

      if (
        filter === 'workable'
      ) {
        return (
          isNumber(row.strength) &&
          row.strength >= 60
        )
      }

      if (
        filter === 'missing-contact'
      ) {
        return (
          !row.phone ||
          row.phone === 'No phone'
        )
      }

      if (
        filter === 'missing-market'
      ) {
        return (
          !isNumber(row.arv)
        )
      }

      return true
    })
  }, [
    rows,
    query,
    filter,
  ])

  const stats = useMemo(() => {
    const analyzed = rows.filter(
      (row) =>
        isNumber(row.strength),
    )

    return {
      total: rows.length,

      highPriority:
        analyzed.filter(
          (row) =>
            row.strength >= 80,
        ).length,

      workable:
        analyzed.filter(
          (row) =>
            row.strength >= 60,
        ).length,

      unanalyzed:
        rows.length -
        analyzed.length,

      missingContact:
        rows.filter(
          (row) =>
            !getPhone(row.lead),
        ).length,
    }
  }, [rows])

  async function handleUpdateStage(
    leadId: string,
    nextStage: string,
  ) {
    if (
      !STAGE_OPTIONS.some(
        (option) =>
          option.value === nextStage,
      )
    ) {
      return
    }

    setSavingLeadId(leadId)

    const {
      error,
    } = await supabase
      .from('leads')
      .update({
        stage: nextStage,
      })
      .eq('id', leadId)

    if (error) {
      console.error(
        'Failed to update lead stage:',
        error,
      )

      alert(
        `Failed to update lead stage: ${error.message}`,
      )

      setSavingLeadId(null)
      return
    }

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage: nextStage,
            }
          : lead,
      ),
    )

    setSavingLeadId(null)
  }

  async function handleBulkStageChange() {
    if (
      selectedLeadIds.length === 0 ||
      savingBulk
    ) {
      return
    }

    setSavingBulk(true)

    const {
      error,
    } = await supabase
      .from('leads')
      .update({
        stage: bulkStage,
      })
      .in(
        'id',
        selectedLeadIds,
      )

    if (error) {
      console.error(
        'Failed to update bulk leads:',
        error,
      )

      alert(
        `Failed to update leads: ${error.message}`,
      )

      setSavingBulk(false)
      return
    }

    setLeads((current) =>
      current.map((lead) =>
        selectedLeadIds.includes(
          lead.id,
        )
          ? {
              ...lead,
              stage: bulkStage,
            }
          : lead,
      ),
    )

    setSelectedLeadIds([])
    setSavingBulk(false)
  }

  async function handleDeleteLead(
    leadId: string,
  ) {
    if (
      !confirm(
        'Delete this lead permanently?',
      )
    ) {
      return
    }

    const {
      error,
    } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      console.error(
        'Failed to delete lead:',
        error,
      )

      alert(
        `Failed to delete lead: ${error.message}`,
      )

      return
    }

    setLeads((current) =>
      current.filter(
        (lead) =>
          lead.id !== leadId,
      ),
    )

    setSelectedLeadIds(
      (current) =>
        current.filter(
          (id) =>
            id !== leadId,
        ),
    )
  }

  async function handleBulkDelete() {
    if (
      selectedLeadIds.length === 0
    ) {
      return
    }

    if (
      !confirm(
        `Delete ${selectedLeadIds.length} selected lead${
          selectedLeadIds.length === 1
            ? ''
            : 's'
        } permanently?`,
      )
    ) {
      return
    }

    const {
      error,
    } = await supabase
      .from('leads')
      .delete()
      .in(
        'id',
        selectedLeadIds,
      )

    if (error) {
      console.error(
        'Failed to delete selected leads:',
        error,
      )

      alert(
        `Failed to delete selected leads: ${error.message}`,
      )

      return
    }

    setLeads((current) =>
      current.filter(
        (lead) =>
          !selectedLeadIds.includes(
            lead.id,
          ),
      ),
    )

    setSelectedLeadIds([])
  }

  function toggleSelectAll() {
    if (
      filteredRows.length === 0
    ) {
      return
    }

    const allSelected =
      filteredRows.every(
        (row) =>
          selectedLeadIds.includes(
            row.lead.id,
          ),
      )

    if (allSelected) {
      setSelectedLeadIds(
        (current) =>
          current.filter(
            (id) =>
              !filteredRows.some(
                (row) =>
                  row.lead.id === id,
              ),
          ),
      )
    } else {
      setSelectedLeadIds(
        (current) => [
          ...new Set([
            ...current,
            ...filteredRows.map(
              (row) =>
                row.lead.id,
            ),
          ]),
        ],
      )
    }
  }

  function toggleSelectLead(
    id: string,
  ) {
    setSelectedLeadIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id,
            )
          : [
              ...current,
              id,
            ],
    )
  }

  return (
    <PageShell
      title="Leads"
      subtitle={
        isMobile
          ? 'Scan, update, and open leads quickly.'
          : 'Your acquisition command center for leads, analysis, and pipeline movement.'
      }
      actions={
        <>
          <StatPill
            label="Total"
            value={stats.total}
          />

          <StatPill
            label="High Priority"
            value={stats.highPriority}
          />

          <StatPill
            label="Unanalyzed"
            value={stats.unanalyzed}
          />

          {!isMobile && (
            <Link href="/imports">
              <ActionButton
                compact
                tone="gold"
              >
                Import
              </ActionButton>
            </Link>
          )}
        </>
      }
    >
      <SectionCard
        title="Lead Control Center"
        subtitle="Search, filter, move leads through your pipeline, and open the full property workspace."
      >
        <div style={toolbarStyle}>
          <div
            style={
              searchRowStyle
            }
          >
            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              className="crm-input"
              placeholder="Search address, owner, phone, email..."
              style={
                searchStyle
              }
            />
          </div>

          <div
            style={
              filterRowStyle
            }
          >
            {(
              [
                [
                  'all',
                  'All Leads',
                ],
                [
                  'high',
                  'High Priority',
                ],
                [
                  'workable',
                  'Workable',
                ],
                [
                  'missing-contact',
                  'Missing Contact',
                ],
                [
                  'missing-market',
                  'Needs Analysis',
                ],
              ] as Array<
                [FilterKey, string]
              >
            ).map(
              ([
                key,
                label,
              ]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setFilter(key)
                  }
                  style={
                    filter === key
                      ? activeChipStyle
                      : chipStyle
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>

          {selectedLeadIds.length >
            0 && (
            <div
              style={
                bulkBarContainerStyle
              }
            >
              <div>
                <div
                  style={
                    bulkCountStyle
                  }
                >
                  {
                    selectedLeadIds.length
                  }{' '}
                  selected
                </div>

                <div
                  style={
                    bulkHintStyle
                  }
                >
                  Apply one pipeline
                  stage to the
                  selected leads.
                </div>
              </div>

              <div
                style={
                  bulkActionGroupStyle
                }
              >
                <select
                  value={bulkStage}
                  disabled={
                    savingBulk
                  }
                  onChange={(
                    event,
                  ) =>
                    setBulkStage(
                      event.target
                        .value as StageValue,
                    )
                  }
                  style={
                    selectStyle
                  }
                >
                  {STAGE_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                        style={
                          optionStyle
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    ),
                  )}
                </select>

                <ActionButton
                  compact
                  tone="gold"
                  disabled={
                    savingBulk
                  }
                  onClick={
                    handleBulkStageChange
                  }
                >
                  {savingBulk
                    ? 'Saving...'
                    : 'Apply Stage'}
                </ActionButton>

                <ActionButton
                  compact
                  tone="danger"
                  disabled={
                    savingBulk
                  }
                  onClick={
                    handleBulkDelete
                  }
                >
                  Delete
                </ActionButton>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredRows.length ===
          0 ? (
          <EmptyState
            query={query}
            filter={filter}
            onClear={() => {
              setQuery('')
              setFilter('all')
            }}
          />
        ) : isMobile ? (
          <div
            style={
              mobileListStyle
            }
          >
            {filteredRows.map(
              (row) => (
                <LeadCard
                  key={
                    row.lead.id
                  }
                  row={row}
                  selected={selectedLeadIds.includes(
                    row.lead.id,
                  )}
                  saving={
                    savingLeadId ===
                    row.lead.id
                  }
                  onSelect={() =>
                    toggleSelectLead(
                      row.lead.id,
                    )
                  }
                  onStageChange={(
                    stage,
                  ) =>
                    void handleUpdateStage(
                      row.lead.id,
                      stage,
                    )
                  }
                  onDelete={() =>
                    void handleDeleteLead(
                      row.lead.id,
                    )
                  }
                />
              ),
            )}
          </div>
        ) : (
          <DesktopLeadTable
            rows={filteredRows}
            selectedLeadIds={
              selectedLeadIds
            }
            savingLeadId={
              savingLeadId
            }
            onToggleAll={
              toggleSelectAll
            }
            onToggleLead={
              toggleSelectLead
            }
            onStageChange={
              handleUpdateStage
            }
            onDelete={
              handleDeleteLead
            }
          />
        )}
      </SectionCard>
    </PageShell>
  )
}

type LeadDisplayRow = {
  lead: LeadRow
  address: string
  location: string
  owner: string
  phone: string
  email: string
  stage: StageValue
  stageLabel: string
  stageColor: string
  askingPrice: number | null
  arv: number | null
  strength: number | null
  motivation: number | null
  contactability: number | null
  marketability: number | null
}

function LeadCard({
  row,
  selected,
  saving,
  onSelect,
  onStageChange,
  onDelete,
}: {
  row: LeadDisplayRow
  selected: boolean
  saving: boolean
  onSelect: () => void
  onStageChange: (
    stage: string,
  ) => void
  onDelete: () => void
}) {
  return (
    <article
      style={
        leadCardStyle
      }
    >
      <div
        style={
          cardHeaderStyle
        }
      >
        <div
          style={
            cardHeaderMainStyle
          }
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            style={
              checkboxStyle
            }
          />

          <div
            style={
              cardIdentityStyle
            }
          >
            <Link
              href={`/leads/${row.lead.id}`}
              style={
                cardLinkStyle
              }
            >
              <div
                style={
                  cardAddressStyle
                }
              >
                {row.address}
              </div>

              <div
                style={
                  cardLocationStyle
                }
              >
                {row.location}
              </div>
            </Link>
          </div>
        </div>

        <span
          style={{
            ...stageBadgeStyle,
            color: row.stageColor,
            borderColor:
              `${row.stageColor}55`,
            background:
              `${row.stageColor}12`,
          }}
        >
          {row.stageLabel}
        </span>
      </div>

      <div
        style={
          cardDividerStyle
        }
      />

      <div
        style={
          cardOwnerSectionStyle
        }
      >
        <div>
          <div
            style={
              cardEyebrowStyle
            }
          >
            Seller
          </div>

          <div
            style={
              cardOwnerStyle
            }
          >
            {row.owner}
          </div>
        </div>

        <div
          style={
            cardContactStyle
          }
        >
          <div>
            {row.phone}
          </div>

          {row.email !==
            'No email' && (
            <div
              style={
                cardSecondaryTextStyle
              }
            >
              {row.email}
            </div>
          )}
        </div>
      </div>

      <div
        style={
          stageEditorStyle
        }
      >
        <div
          style={
            cardEyebrowStyle
          }
        >
          Pipeline Stage
        </div>

        <select
          value={row.stage}
          disabled={saving}
          onChange={(event) =>
            onStageChange(
              event.target.value,
            )
          }
          style={{
            ...stageSelectStyle,
            color: row.stageColor,
            borderColor:
              `${row.stageColor}55`,
          }}
        >
          {STAGE_OPTIONS.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
                style={
                  optionStyle
                }
              >
                {
                  option.label
                }
              </option>
            ),
          )}
        </select>
      </div>

      <div
        style={
          financialGridStyle
        }
      >
        <MetricTile
          label="List Price"
          value={formatMoney(
            row.askingPrice,
          )}
        />

        <MetricTile
          label="ARV"
          value={formatMoney(
            row.arv,
          )}
          muted={
            !isNumber(row.arv)
          }
        />
      </div>

      <div
        style={
          scoreGridStyle
        }
      >
        <ScoreTile
          label="Strength"
          value={
            row.strength
          }
        />

        <ScoreTile
          label="Motivation"
          value={
            row.motivation
          }
        />

        <ScoreTile
          label="Contact"
          value={
            row.contactability
          }
        />

        <ScoreTile
          label="Market"
          value={
            row.marketability
          }
        />
      </div>

      <div
        style={
          cardFooterStyle
        }
      >
        <button
          type="button"
          onClick={onDelete}
          style={
            deleteButtonStyle
          }
        >
          Delete
        </button>

        <Link
          href={`/leads/${row.lead.id}`}
          style={
            workspaceButtonStyle
          }
        >
          Open Workspace →
        </Link>
      </div>
    </article>
  )
}

function DesktopLeadTable({
  rows,
  selectedLeadIds,
  savingLeadId,
  onToggleAll,
  onToggleLead,
  onStageChange,
  onDelete,
}: {
  rows: LeadDisplayRow[]
  selectedLeadIds: string[]
  savingLeadId: string | null
  onToggleAll: () => void
  onToggleLead: (
    id: string,
  ) => void
  onStageChange: (
    id: string,
    stage: string,
  ) => void
  onDelete: (
    id: string,
  ) => void
}) {
  const allSelected =
    rows.length > 0 &&
    rows.every((row) =>
      selectedLeadIds.includes(
        row.lead.id,
      ),
    )

  return (
    <div className="crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th
              style={{
                width: 40,
              }}
            >
              <input
                type="checkbox"
                checked={
                  allSelected
                }
                onChange={
                  onToggleAll
                }
                style={
                  checkboxStyle
                }
              />
            </th>

            <th>Property</th>
            <th>Seller</th>
            <th>Stage</th>
            <th>List Price</th>
            <th>ARV</th>
            <th>Intelligence</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row) => (
              <tr
                key={
                  row.lead.id
                }
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(
                      row.lead.id,
                    )}
                    onChange={() =>
                      onToggleLead(
                        row.lead.id,
                      )
                    }
                    style={
                      checkboxStyle
                    }
                  />
                </td>

                <td>
                  <Link
                    href={`/leads/${row.lead.id}`}
                    style={
                      cardLinkStyle
                    }
                  >
                    <div
                      style={
                        desktopLeadTitleStyle
                      }
                    >
                      {row.address}
                    </div>

                    <div
                      style={
                        desktopSubStyle
                      }
                    >
                      {row.location}
                    </div>
                  </Link>
                </td>

                <td>
                  <div>
                    {row.owner}
                  </div>

                  <div
                    style={
                      desktopSubStyle
                    }
                  >
                    {row.phone}
                  </div>
                </td>

                <td>
                  <select
                    value={
                      row.stage
                    }
                    disabled={
                      savingLeadId ===
                      row.lead.id
                    }
                    onChange={(
                      event,
                    ) =>
                      onStageChange(
                        row.lead.id,
                        event.target
                          .value,
                      )
                    }
                    style={{
                      ...stageSelectStyle,
                      color:
                        row.stageColor,
                      borderColor:
                        `${row.stageColor}55`,
                    }}
                  >
                    {STAGE_OPTIONS.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                          style={
                            optionStyle
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </td>

                <td>
                  {formatMoney(
                    row.askingPrice,
                  )}
                </td>

                <td>
                  {formatMoney(
                    row.arv,
                  )}
                </td>

                <td>
                  <div
                    style={
                      desktopScoresStyle
                    }
                  >
                    <ScoreMini
                      label="STR"
                      value={
                        row.strength
                      }
                    />

                    <ScoreMini
                      label="MOT"
                      value={
                        row.motivation
                      }
                    />

                    <ScoreMini
                      label="CON"
                      value={
                        row.contactability
                      }
                    />
                  </div>
                </td>

                <td>
                  <div
                    style={
                      desktopActionsStyle
                    }
                  >
                    <Link
                      href={`/leads/${row.lead.id}`}
                    >
                      <ActionButton compact>
                        Workspace
                      </ActionButton>
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(
                          row.lead.id,
                        )
                      }
                      style={
                        iconDeleteButtonStyle
                      }
                      title="Delete Lead"
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}

function ScoreTile({
  label,
  value,
}: {
  label: string
  value: number | null
}) {
  const tone =
    scoreTone(value)

  return (
    <div
      style={
        scoreTileStyle
      }
    >
      <div
        style={
          scoreTileHeaderStyle
        }
      >
        <span>
          {label}
        </span>

        <span
          style={
            scoreStatusStyle
          }
        >
          {scoreLevel(value)}
        </span>
      </div>

      <div
        style={{
          ...scoreTileValueStyle,
          color:
            tone === 'green'
              ? '#7fe3a0'
              : tone === 'gold'
                ? '#e6be67'
                : tone ===
                    'orange'
                  ? '#ffb84d'
                  : '#8fc1ff',
        }}
      >
        {formatScore(value)}
      </div>
    </div>
  )
}

function ScoreMini({
  label,
  value,
}: {
  label: string
  value: number | null
}) {
  return (
    <span className="crm-badge soft">
      {label}{' '}
      {formatScore(value)}
    </span>
  )
}

function MetricTile({
  label,
  value,
  muted = false,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div
      style={
        metricTileStyle
      }
    >
      <div
        style={
          metricLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          ...metricValueStyle,
          color: muted
            ? 'rgba(255,255,255,0.38)'
            : '#ffffff',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div
      style={
        emptyStateStyle
      }
    >
      <div
        style={
          emptyTitleStyle
        }
      >
        Loading leads
      </div>

      <div
        style={
          emptyTextStyle
        }
      >
        Loading your acquisition
        records from Supabase...
      </div>
    </div>
  )
}

function EmptyState({
  query,
  filter,
  onClear,
}: {
  query: string
  filter: FilterKey
  onClear: () => void
}) {
  return (
    <div
      style={
        emptyStateStyle
      }
    >
      <div
        style={
          emptyIconStyle
        }
      >
        ○
      </div>

      <div
        style={
          emptyTitleStyle
        }
      >
        No leads found
      </div>

      <div
        style={
          emptyTextStyle
        }
      >
        {query
          ? `Nothing matches "${query}".`
          : filter !== 'all'
            ? 'No leads match this filter.'
            : 'Your lead list is currently empty.'}
      </div>

      {(query ||
        filter !== 'all') && (
        <button
          type="button"
          onClick={onClear}
          style={
            clearButtonStyle
          }
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}

/* =========================================================
   STYLES
========================================================= */

const toolbarStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
}

const searchRowStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
}

const searchStyle: CSSProperties = {
  width: '100%',
  minHeight: 46,
}

const filterRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 2,
}

const chipStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 14px',
  borderRadius: 999,
  border:
    '1px solid rgba(255,255,255,0.08)',
  background:
    'rgba(255,255,255,0.025)',
  color:
    'rgba(255,255,255,0.68)',
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const activeChipStyle: CSSProperties = {
  ...chipStyle,
  border:
    '1px solid rgba(214,166,75,0.38)',
  background:
    'rgba(214,166,75,0.13)',
  color: '#ffffff',
}

const bulkBarContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '13px 15px',
  borderRadius: 16,
  border:
    '1px solid rgba(214,166,75,0.24)',
  background:
    'linear-gradient(180deg, rgba(28,22,12,0.92), rgba(10,9,6,0.96))',
  flexWrap: 'wrap',
}

const bulkCountStyle: CSSProperties = {
  color: '#e0b84f',
  fontSize: 13,
  fontWeight: 800,
}

const bulkHintStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.42)',
  fontSize: 11,
  marginTop: 2,
}

const bulkActionGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const selectStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 11px',
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 700,
  outline: 'none',
  cursor: 'pointer',
  border:
    '1px solid rgba(255,255,255,0.12)',
  background:
    'rgba(18,18,18,0.96)',
  color: '#ffffff',
}

const stageSelectStyle: CSSProperties = {
  ...selectStyle,
  minWidth: 145,
}

const optionStyle: CSSProperties = {
  background: '#121212',
  color: '#ffffff',
}

const checkboxStyle: CSSProperties = {
  accentColor: '#d6a64b',
  width: 16,
  height: 16,
  cursor: 'pointer',
}

const mobileListStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const leadCardStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 16,
  borderRadius: 20,
  border:
    '1px solid rgba(255,255,255,0.075)',
  background:
    'linear-gradient(180deg, rgba(16,16,16,0.98), rgba(6,6,6,0.99))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.025), 0 12px 30px rgba(0,0,0,0.22)',
}

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const cardHeaderMainStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 11,
  minWidth: 0,
  flex: 1,
}

const cardIdentityStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
}

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const cardAddressStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 19,
  lineHeight: 1.15,
  fontWeight: 850,
  letterSpacing: '-0.025em',
  wordBreak: 'break-word',
}

const cardLocationStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.46)',
  fontSize: 11,
  lineHeight: 1.4,
  marginTop: 5,
}

const stageBadgeStyle: CSSProperties = {
  border: '1px solid',
  borderRadius: 999,
  padding: '6px 9px',
  fontSize: 10,
  lineHeight: 1,
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

const cardDividerStyle: CSSProperties = {
  height: 1,
  background:
    'rgba(255,255,255,0.06)',
}

const cardOwnerSectionStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
}

const cardEyebrowStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.38)',
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginBottom: 5,
}

const cardOwnerStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 750,
}

const cardContactStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.74)',
  fontSize: 12,
  lineHeight: 1.5,
  textAlign: 'right',
  maxWidth: '48%',
  wordBreak: 'break-word',
}

const cardSecondaryTextStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.4)',
  fontSize: 10,
}

const stageEditorStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
}

const financialGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 9,
}

const metricTileStyle: CSSProperties = {
  borderRadius: 13,
  border:
    '1px solid rgba(255,255,255,0.055)',
  background:
    'rgba(255,255,255,0.022)',
  padding: '10px 11px',
}

const metricLabelStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.38)',
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 4,
}

const metricValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
}

const scoreGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: 9,
}

const scoreTileStyle: CSSProperties = {
  borderRadius: 13,
  border:
    '1px solid rgba(255,255,255,0.055)',
  background:
    'rgba(255,255,255,0.018)',
  padding: '10px 11px',
}

const scoreTileHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  color:
    'rgba(255,255,255,0.42)',
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const scoreStatusStyle: CSSProperties = {
  fontSize: 8,
  textTransform: 'none',
  letterSpacing: 0,
  color:
    'rgba(255,255,255,0.34)',
}

const scoreTileValueStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 850,
  marginTop: 5,
}

const cardFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 3,
}

const deleteButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#ef4444',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
}

const workspaceButtonStyle: CSSProperties = {
  textDecoration: 'none',
  color: '#e0b84f',
  fontSize: 12,
  fontWeight: 800,
}

const iconDeleteButtonStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'rgba(239,68,68,0.1)',
  border:
    '1px solid rgba(239,68,68,0.2)',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
}

const desktopLeadTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 800,
}

const desktopSubStyle: CSSProperties = {
  color:
    'rgba(255,255,255,0.42)',
  fontSize: 10,
  marginTop: 3,
}

const desktopScoresStyle: CSSProperties = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
}

const desktopActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
}

const emptyStateStyle: CSSProperties = {
  minHeight: 220,
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  gap: 7,
  textAlign: 'center',
  padding: 30,
}

const emptyIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: 'grid',
  placeItems: 'center',
  background:
    'rgba(214,166,75,0.08)',
  border:
    '1px solid rgba(214,166,75,0.15)',
  color: '#d6a64b',
  fontSize: 22,
}

const emptyTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 800,
}

const emptyTextStyle: CSSProperties = {
  maxWidth: 420,
  color:
    'rgba(255,255,255,0.42)',
  fontSize: 12,
  lineHeight: 1.5,
}

const clearButtonStyle: CSSProperties = {
  marginTop: 6,
  border:
    '1px solid rgba(214,166,75,0.25)',
  background:
    'rgba(214,166,75,0.08)',
  color: '#e0b84f',
  borderRadius: 9,
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 800,
  cursor: 'pointer',
}