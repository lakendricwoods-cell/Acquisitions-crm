'use client'

import type { CSSProperties } from 'react'
import type { CrmStage } from '@/lib/crm-stage'
import { CRM_STAGE_META } from '@/lib/crm-stage'
import PipelineCard, {
  type PipelineLead,
} from '@/components/pipeline/pipeline-card'

type PipelineColumnProps = {
  stage: CrmStage
  leads: PipelineLead[]
  isDragOver: boolean
  onDragOver: (stage: CrmStage) => void
  onDragLeave: (stage: CrmStage) => void
  onDropLead: (
    stage: CrmStage,
    leadId: string
  ) => void | Promise<void>
  onMoveToStage: (
    lead: PipelineLead,
    nextStage: CrmStage
  ) => void | Promise<void>
}

export default function PipelineColumn({
  stage,
  leads,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDropLead,
  onMoveToStage,
}: PipelineColumnProps) {
  const meta = CRM_STAGE_META[stage]
  const accentColor = meta.color || '#d6a64b'

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    onDragOver(stage)
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault()

    const leadId =
      event.dataTransfer.getData('text/plain')

    if (!leadId) {
      return
    }

    void onDropLead(stage, leadId)
  }

  return (
    <section
      style={{
        ...columnStyle,
        borderColor: isDragOver
          ? `${accentColor}80`
          : `${accentColor}30`,
        boxShadow: isDragOver
          ? `0 0 0 1px ${accentColor}66 inset, 0 0 32px ${accentColor}25, 0 12px 40px rgba(0,0,0,0.6)`
          : `0 0 0 1px ${accentColor}18 inset, 0 8px 32px rgba(0,0,0,0.45)`,
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => onDragLeave(stage)}
      onDrop={handleDrop}
    >
      <div
        style={{
          ...headerStyle,
          borderBottomColor: `${accentColor}22`,
        }}
      >
        <div style={headerTextGroupStyle}>
          <div style={titleStyle}>{meta.label}</div>
          <div style={subtitleStyle}>
            {leads.length} lead
            {leads.length === 1 ? '' : 's'}
          </div>
        </div>

        <span
          style={{
            ...badgeStyle,
            background: `linear-gradient(180deg, ${accentColor}20, ${accentColor}10)`,
            borderColor: `${accentColor}44`,
            color: accentColor,
          }}
        >
          {leads.length}
        </span>
      </div>

      <div
        style={bodyStyle}
        className="crm-custom-scroll"
      >
        {leads.length === 0 ? (
          <div style={emptyStyle}>
            Drop a lead here or use the stage selector.
          </div>
        ) : (
          leads.map((lead) => (
            <PipelineCard
              key={lead.id}
              lead={lead}
              stage={stage}
              onMoveToStage={onMoveToStage}
            />
          ))
        )}
      </div>
    </section>
  )
}

const columnStyle: CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  minHeight: 'calc(100vh - 265px)',
  maxHeight: 'calc(100vh - 265px)',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.06)',
  background:
    'linear-gradient(180deg, rgba(12,10,6,0.85), rgba(0,0,0,0.96))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  overflow: 'hidden',
  transition:
    'border-color 200ms ease, box-shadow 200ms ease',
}

const headerStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  background:
    'linear-gradient(180deg, rgba(14,12,8,0.95), rgba(4,4,4,0.98))',
}

const headerTextGroupStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
}

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#ffffff',
}

const subtitleStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.50)',
  fontWeight: 500,
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 26,
  height: 24,
  padding: '0 8px',
  borderRadius: 8,
  border: '1px solid transparent',
  fontSize: 12,
  fontWeight: 800,
}

const bodyStyle: CSSProperties = {
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: 12,
  display: 'grid',
  alignContent: 'start',
  gap: 12,
}

const emptyStyle: CSSProperties = {
  minHeight: 130,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 16,
  border: '1px dashed rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.2)',
  color: 'rgba(255,255,255,0.35)',
  fontSize: 12,
  fontWeight: 500,
  textAlign: 'center',
  padding: 16,
}