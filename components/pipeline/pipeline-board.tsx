'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { CrmStage } from '@/lib/crm-stage'
import { CRM_STAGES, CRM_STAGE_META, resolveCrmStage } from '@/lib/crm-stage'
import PipelineColumn from '@/components/pipeline/pipeline-column'
import type { PipelineLead } from '@/components/pipeline/pipeline-card'
import ActionButton from '@/components/ui/action-button'

type PipelineBoardProps = {
  leads: PipelineLead[]
  onMoveLead: (lead: PipelineLead, nextStage: CrmStage) => Promise<void>
}

export default function PipelineBoard({
  leads,
  onMoveLead,
}: PipelineBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null)
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [dragOverStage, setDragOverStage] = useState<CrmStage | null>(null)
  const [isGrabbing, setIsGrabbing] = useState(false)

  const grabState = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
  })

  const grouped = useMemo(() => {
    return CRM_STAGES.map((stage) => ({
      stage,
      leads: leads.filter((lead) => resolveCrmStage(lead) === stage),
    }))
  }, [leads])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        board.scrollLeft += event.deltaY
        event.preventDefault()
      }
    }

    board.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      board.removeEventListener('wheel', handleWheel)
    }
  }, [])

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const board = boardRef.current
    if (!board) return

    const target = event.target as HTMLElement
    if (
      target.closest('button') ||
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

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const board = boardRef.current
    if (!board || !grabState.current.active) return

    const delta = event.clientX - grabState.current.startX
    board.scrollLeft = grabState.current.startScrollLeft - delta
  }

  function handleMouseUp() {
    grabState.current.active = false
    setIsGrabbing(false)
  }

  function handleMouseLeave() {
    grabState.current.active = false
    setIsGrabbing(false)
  }

  function scrollToStage(stage: CrmStage) {
    const node = columnRefs.current[stage]
    if (!node) return

    node.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }

  function handleDragOver(stage: CrmStage) {
    setDragOverStage(stage)
  }

  function handleDragLeave(_stage: CrmStage) {
    setDragOverStage(null)
  }

  async function handleDropLead(stage: CrmStage, leadId: string) {
    const lead = leads.find((item) => item.id === leadId)
    setDragOverStage(null)

    if (!lead) return

    const currentStage = resolveCrmStage(lead)
    if (currentStage === stage) return

    const confirmed = window.confirm(
      `Move ${lead.property_address_1 || 'this lead'} to ${CRM_STAGE_META[stage].label}?`
    )

    if (!confirmed) return

    await onMoveLead(lead, stage)
  }

  async function handleMoveToStage(lead: PipelineLead, nextStage: CrmStage) {
    const confirmed = window.confirm(
      `Move ${lead.property_address_1 || 'this lead'} to ${CRM_STAGE_META[nextStage].label}?`
    )

    if (!confirmed) return

    await onMoveLead(lead, nextStage)
  }

  return (
    <div style={wrapStyle}>
      <div style={jumpBarStyle} data-no-pan="true">
        <div style={jumpBarScrollStyle} className="crm-scroll-hide">
          {CRM_STAGES.map((stage) => {
            const color = CRM_STAGE_META[stage].color || '#d6a64b'
            return (
              <button
                key={stage}
                type="button"
                onClick={() => scrollToStage(stage)}
                style={{
                  ...jumpChipStyle,
                  borderColor: `${color}30`,
                  color: color,
                  boxShadow: `0 0 12px ${color}10`,
                }}
              >
                {CRM_STAGE_META[stage].label}
              </button>
            )
          })}
        </div>

        <div style={boardActionStyle}>
          <ActionButton
            compact
            tone="ghost"
            onClick={() => boardRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}
          >
            ←
          </ActionButton>
          <ActionButton
            compact
            tone="ghost"
            onClick={() => boardRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
          >
            →
          </ActionButton>
        </div>
      </div>

      <div
        ref={boardRef}
        style={{
          ...boardOuterStyle,
          cursor: isGrabbing ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div style={boardInnerStyle}>
          {grouped.map(({ stage, leads: stageLeads }) => (
            <div
              key={stage}
              ref={(node) => {
                columnRefs.current[stage] = node
              }}
              style={columnWrapStyle}
            >
              <PipelineColumn
                stage={stage}
                leads={stageLeads}
                isDragOver={dragOverStage === stage}
                onDragOver={(nextStage) => handleDragOver(nextStage)}
                onDragLeave={(nextStage) => handleDragLeave(nextStage)}
                onDropLead={(nextStage, leadId) => handleDropLead(nextStage, leadId)}
                onMoveToStage={handleMoveToStage}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  userSelect: 'none',
}

const jumpBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '6px 12px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(10,8,5,0.85), rgba(0,0,0,0.92))',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
}

const jumpBarScrollStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  overflowY: 'hidden',
  padding: '2px 0',
  flex: 1,
}

const jumpChipStyle: CSSProperties = {
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(16,14,10,0.95), rgba(0,0,0,0.98))',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'all 160ms ease',
}

const boardActionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
}

const boardOuterStyle: CSSProperties = {
  overflowX: 'auto',
  overflowY: 'hidden',
  width: '100%',
  paddingBottom: 12,
  scrollBehavior: 'smooth',
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