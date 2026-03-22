import type { ReactNode } from "react"

type PageShellProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
}

export default function PageShell({
  title,
  subtitle,
  eyebrow = "Foundation OS",
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="crm-page-shell">
      <header className="crm-page-header">
        <div className="crm-page-header-main">
          <div className="crm-page-eyebrow">{eyebrow}</div>
          <h1 className="crm-page-title">{title}</h1>
          {subtitle ? <p className="crm-page-subtitle">{subtitle}</p> : null}
        </div>

        {actions ? <div className="crm-page-actions">{actions}</div> : null}
      </header>

      {children}
    </div>
  )
}