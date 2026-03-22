import type { ReactNode } from "react"

type SectionCardProps = {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function SectionCard({
  title,
  subtitle,
  actions,
  children,
}: SectionCardProps) {
  const hasHeader = title || subtitle || actions

  return (
    <section className="crm-section-card">
      {hasHeader ? (
        <div className="crm-section-card-header">
          <div className="crm-section-card-heading">
            {title ? <h2 className="crm-section-card-title">{title}</h2> : null}
            {subtitle ? <p className="crm-section-card-subtitle">{subtitle}</p> : null}
          </div>

          {actions ? <div className="crm-section-card-actions">{actions}</div> : null}
        </div>
      ) : null}

      <div className="crm-section-card-body">{children}</div>
    </section>
  )
}