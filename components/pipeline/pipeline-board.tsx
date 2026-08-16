'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import type { CrmStage } from '@/lib/crm-stage'
import {
  CRM_STAGES,
  CRM_STAGE_META,
  getNextCrmStage,
  getPreviousCrmStage,
  resolveCrmStage,
} from '@/lib/crm-stage'
import PipelineColumn from '@/components/pipeline/pipeline-column'
import type { PipelineLead } from '@/components/pipeline/pipeline-card'
import ActionButton from '@/components/ui/action-button'

type PipelineBoardProps = {
  leads: PipelineLead[]
  onMoveLead: (
    lead: PipelineLead,
    nextStage: CrmStage
  ) => Promise<void>
}

export default function PipelineBoard({
  leads,
  onMoveLead,
}: PipelineBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null)
  const columnRefs = useRef<
    Partial<Record<CrmStage, HTMLDivElement | null>>
  >({})

  const [selectedStage, setSelectedStage] =
    useState<CrmStage>('new_lead')

  const [dragOverStage, setDragOverStage] =
    useState<CrmStage | null>(null)

  const [isGrabbing, setIsGrabbing] =
    useState(false)

  const grabState = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
  })

  const grouped = useMemo(() => {
    return CRM_STAGES.map((stage) => ({
      stage,
      leads: leads.filter(
        (lead) => resolveCrmStage(lead) === stage
      ),
    }))
  }, [leads])

  const selectedIndex =
    CRM_STAGES.indexOf(selectedStage)

  const previousStage =
    getPreviousCrmStage(selectedStage)

  const nextStage =
    getNextCrmStage(selectedStage)

  const selectedCount =
    grouped.find(
      (group) => group.stage === selectedStage
    )?.leads.length ?? 0

  useEffect(() => {
    const board = boardRef.current

    if (!board) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        board.scrollLeft += event.deltaY
        event.preventDefault()
      }
    }

    board.addEventListener('wheel', handleWheel, {
      passive: false,
    })

    return () => {
      board.removeEventListener('wheel', handleWheel)
    }
  }, [])

  function scrollToStage(stage: CrmStage) {
    const node = columnRefs.current[stage]

    setSelectedStage(stage)

    if (!node) {
      return
    }

    node.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }

  function changeStage(direction: 'previous' | 'next') {
    const target =
      direction === 'previous'
        ? previousStage
        : nextStage

    if (target) {
      scrollToStage(target)
    }
  }

  function handleMouseDown(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    const board = boardRef.current

    if (!board) {
      return
    }

    const target = event.target as HTMLElement

    if (
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('[data-no-pan="true"]')
    ) {
      return
    }

    grabState.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: board.scrollLeft,
    }

    setIsGrabbing(true)
  }

  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    const board = boardRef.current

    if (!board || !grabState.current.active) {
      return
    }

    const delta =
      event.clientX - grabState.current.startX

    board.scrollLeft =
      grabState.current.startScrollLeft - delta
  }

  function stopGrabbing() {
    grabState.current.active = false
    setIsGrabbing(false)
  }

  function handleDragOver(stage: CrmStage) {
    setDragOverStage(stage)
  }

  function handleDragLeave() {
    setDragOverStage(null)
  }

  async function handleDropLead(
    stage: CrmStage,
    leadId: string
  ) {
    setDragOverStage(null)

    const lead = leads.find(
      (item) => item.id === leadId
    )

    if (!lead) {
      return
    }

    const currentStage =
      resolveCrmStage(lead)

    if (currentStage === stage) {
      return
    }

    await onMoveLead(lead, stage)

    setSelectedStage(stage)
  }

  async function handleMoveToStage(
    lead: PipelineLead,
    nextStageValue: CrmStage
  ) {
    const currentStage =
      resolveCrmStage(lead)

    if (currentStage === nextStageValue) {
      return
    }

    await onMoveLead(
      lead,
      nextStageValue
    )

    setSelectedStage(nextStageValue)
  }

  return (
    <div style={wrapStyle}>
      <div style={controlPanelStyle}>
        <div style={stagePickerStyle}>
          <span style={sectionLabelStyle}>
            PIPELINE STAGE
          </span>

          <select
            value={selectedStage}
            onChange={(event) =>
              scrollToStage(
                event.target.value as CrmStage
              )
            }
            style={stageSelectStyle}
            data-no-pan="true"
          >
            {CRM_STAGES.map((stage) => {
              const count =
                grouped.find(
                  (group) =>
                    group.stage === stage
                )?.leads.length ?? 0

              return (
                <option
                  key={stage}
                  value={stage}
                >
                  {CRM_STAGE_META[stage].label} ({count})
                </option>
              )
            })}
          </select>
        </div>

        <div style={stageInfoStyle}>
          <div
            style={{
              ...stageDotStyle,
              background:
                CRM_STAGE_META[selectedStage]
                  .color,
              boxShadow: `0 0 12px ${CRM_STAGE_META[selectedStage].color}70`,
            }}
          />

          <div>
            <div style={selectedStageTitleStyle}>
              {CRM_STAGE_META[selectedStage].label}
            </div>

            <div style={selectedStageSubStyle}>
              {selectedCount} lead
              {selectedCount === 1
                ? ''
                : 's'} · Stage {selectedIndex + 1} of{' '}
              {CRM_STAGES.length}
            </div>
          </div>
        </div>

        <div style={navigationStyle}>
          <ActionButton
            compact
            tone="ghost"
            disabled={!previousStage}
            onClick={() =>
              changeStage('previous')
            }
          >
            ← Previous
          </ActionButton>

          <ActionButton
            compact
            tone="gold"
            disabled={!nextStage}
            onClick={() =>
              changeStage('next')
            }
          >
            Next →
          </ActionButton>
        </div>
      </div>

      <div
        style={jumpBarStyle}
        data-no-pan="true"
      >
        <div
          style={jumpBarScrollStyle}
          className="crm-scroll-hide"
        >
          {CRM_STAGES.map((stage) => {
            const color =
              CRM_STAGE_META[stage].color ||
              '#d6a64b'

            const count =
              grouped.find(
                (group) =>
                  group.stage === stage
              )?.leads.length ?? 0

            const active =
              selectedStage === stage

            return (
              <button
                key={stage}
                type="button"
                onClick={() =>
                  scrollToStage(stage)
                }
                style={{
                  ...jumpChipStyle,
                  borderColor: active
                    ? `${color}80`
                    : `${color}30`,
                  color,
                  background: active
                    ? `${color}18`
                    : 'linear-gradient(180deg, rgba(16,14,10,0.95), rgba(0,0,0,0.98))',
                  boxShadow: active
                    ? `0 0 16px ${color}18`
                    : 'none',
                }}
              >
                {CRM_STAGE_META[stage].label}
                <span
                  style={{
                    ...countBadgeStyle,
                    color,
                    background: `${color}15`,
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div style={boardActionStyle}>
          <ActionButton
            compact
            tone="ghost"
            onClick={() =>
              boardRef.current?.scrollBy({
                left: -360,
                behavior: 'smooth',
              })
            }
          >
            ←
          </ActionButton>

          <ActionButton
            compact
            tone="ghost"
            onClick={() =>
              boardRef.current?.scrollBy({
                left: 360,
                behavior: 'smooth',
              })
            }
          >
            →
          </ActionButton>
        </div>
      </div>

      <div
        ref={boardRef}
        style={{
          ...boardOuterStyle,
          cursor: isGrabbing
            ? 'grabbing'
            : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopGrabbing}
        onMouseLeave={stopGrabbing}
      >
        <div style={boardInnerStyle}>
          {grouped.map(
            ({ stage, leads: stageLeads }) => (
              <div
                key={stage}
                ref={(node) => {
                  columnRefs.current[stage] =
                    node
                }}
                style={columnWrapStyle}
              >
                <PipelineColumn
                  stage={stage}
                  leads={stageLeads}
                  isDragOver={
                    dragOverStage === stage
                  }
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDropLead={
                    handleDropLead
                  }
                  onMoveToStage={
                    handleMoveToStage
                  }
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  minWidth: 0,
}

const controlPanelStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(220px, 1fr) minmax(200px, auto) auto',
  gap: 12,
  alignItems: 'center',
  padding: 12,
  borderRadius: 16,
  border:
    '1px solid rgba(255,255,255,0.07)',
  background:
    'linear-gradient(180deg, rgba(12,10,6,0.92), rgba(0,0,0,0.96))',
}

const stagePickerStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
}

const sectionLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.38)',
}

const stageSelectStyle: CSSProperties = {
  width: '100%',
  minHeight: 38,
  borderRadius: 10,
  border:
    '1px solid rgba(214,166,75,0.25)',
  background: 'rgba(0,0,0,0.65)',
  color: '#ffffff',
  padding: '0 12px',
  fontSize: 12,
  fontWeight: 700,
  outline: 'none',
}

const stageInfoStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
}

const stageDotStyle: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: '50%',
  flexShrink: 0,
}

const selectedStageTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#ffffff',
}

const selectedStageSubStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 10,
  color: 'rgba(255,255,255,0.42)',
}

const navigationStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 6,
}

const jumpBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '6px 10px',
  borderRadius: 16,
  border:
    '1px solid rgba(255,255,255,0.06)',
  background:
    'linear-gradient(180deg, rgba(10,8,5,0.85), rgba(0,0,0,0.92))',
}

const jumpBarScrollStyle: CSSProperties = {
  display: 'flex',
  gap: 7,
  overflowX: 'auto',
  overflowY: 'hidden',
  padding: '2px 0',
  flex: 1,
}

const jumpChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  borderRadius: 999,
  border: '1px solid',
  padding: '6px 11px',
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition:
    'background 160ms ease, border-color 160ms ease',
}

const countBadgeStyle: CSSProperties = {
  minWidth: 17,
  height: 17,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  fontSize: 9,
  fontWeight: 800,
}

const boardActionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  flexShrink: 0,
}

const boardOuterStyle: CSSProperties = {
  overflowX: 'auto',
  overflowY: 'hidden',
  width: '100%',
  paddingBottom: 12,
  scrollBehavior: 'smooth',
  WebkitOverflowScrolling: 'touch',
}

const boardInnerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${CRM_STAGES.length}, minmax(320px, 320px))`,
  gap: 16,
  minWidth: 'max-content',
}

const columnWrapStyle: CSSProperties = {
  minWidth: 320,
}