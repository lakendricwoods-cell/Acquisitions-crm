'use client'

import type { CSSProperties } from 'react'
import type { CrmStage } from '@/lib/crm-stage'
import { CRM_STAGE_META } from '@/lib/crm-stage'
import PipelineCard, { type PipelineLead } from '@/components/pipeline/pipeline-card'

type PipelineColumnProps = {
  stage: CrmStage
  leads: PipelineLead[]
  isDragOver: boolean
  onDragOver: (stage: CrmStage) => void
  onDragLeave: (stage: CrmStage) => void
  onDropLead: (stage: CrmStage, leadId: string) => void | Promise<void>
  onMoveToStage: (lead: PipelineLead, nextStage: CrmStage) => void | Promise<void>
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

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    onDragOver(stage)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const leadId = event.dataTransfer.getData('text/plain')
    void onDropLead(stage, leadId)
  }

  return (
    <section
      style={{
        ...columnStyle,
        borderColor: isDragOver ? `${meta.color}66` : `${meta.color}30`,
        boxShadow: isDragOver
          ? `0 0 0 1px ${meta.color}44 inset, 0 0 26px ${meta.color}20`
          : `0 0 0 1px ${meta.color}22 inset, 0 0 18px ${meta.color}10`,
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => onDragLeave(stage)}
      onDrop={handleDrop}
    >
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>{meta.label}</div>
          <div style={subtitleStyle}>
            {leads.length} lead{leads.length === 1 ? '' : 's'}
          </div>
        </div>

        <span
          className="crm-badge"
          style={{
            background: `${meta.color}18`,
            borderColor: `${meta.color}44`,
            color: meta.color,
          }}
        >
          {leads.length}
        </span>
      </div>

      <div style={bodyStyle}>
        {leads.length === 0 ? (
          <div style={emptyStyle}>Drop here or move a lead into this stage.</div>
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
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  padding: 14,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,0.98))',
}

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#ffffff',
}

const subtitleStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'rgba(255,255,255,0.58)',
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
  minHeight: 120,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 16,
  border: '1px dashed rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.40)',
  fontSize: 12,
  textAlign: 'center',
  padding: 12,
}