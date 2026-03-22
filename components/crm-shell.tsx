"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import ActionButton from "@/components/ui/action-button"

type CrmShellProps = {
  children: React.ReactNode
}

const Icons = {
  brand: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7.5h10.5L12 11H7.5L5 13.5h6L19 5H9L5 7.5Z" stroke="currentColor" />
      <path d="M9 16h10l-4 3H5l4-3Z" stroke="currentColor" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" />
      <rect x="14" y="4" width="6" height="10" rx="1.5" stroke="currentColor" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" />
      <rect x="14" y="18" width="6" height="2" rx="1" stroke="currentColor" />
    </svg>
  ),
  pipeline: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="5" height="12" rx="1.5" stroke="currentColor" />
      <rect x="10" y="6" width="5" height="12" rx="1.5" stroke="currentColor" />
      <rect x="17" y="6" width="4" height="12" rx="1.5" stroke="currentColor" />
    </svg>
  ),
  leads: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" />
      <path d="M6 19c1.3-2.67 3.3-4 6-4s4.7 1.33 6 4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  deals: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 7h12v10H6z" stroke="currentColor" />
      <path d="M9 7V5h6v2" stroke="currentColor" />
      <path d="M6 11h12" stroke="currentColor" />
    </svg>
  ),
  buyers: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="2.5" stroke="currentColor" />
      <circle cx="16.5" cy="9.5" r="2" stroke="currentColor" />
      <path d="M4.5 18c.95-2.1 2.45-3.15 4.5-3.15S12.55 15.9 13.5 18" stroke="currentColor" strokeLinecap="round" />
      <path d="M14.2 17.5c.65-1.4 1.7-2.1 3.15-2.1 1.1 0 2.02.38 2.75 1.15" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 7h11" stroke="currentColor" strokeLinecap="round" />
      <path d="M8 12h11" stroke="currentColor" strokeLinecap="round" />
      <path d="M8 17h11" stroke="currentColor" strokeLinecap="round" />
      <path d="M4.5 7.5l1.2 1.2L7.8 6.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 12.5l1.2 1.2 2.1-2.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 17.5l1.2 1.2 2.1-2.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  imports: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v10" stroke="currentColor" strokeLinecap="round" />
      <path d="M8.5 10.5 12 14l3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18V9" stroke="currentColor" strokeLinecap="round" />
      <path d="M12 18V5" stroke="currentColor" strokeLinecap="round" />
      <path d="M19 18v-7" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" />
      <path d="M19 12a7 7 0 0 0-.08-1l2.03-1.58-2-3.46-2.46.86a7.2 7.2 0 0 0-1.72-1L14.5 3h-5l-.27 2.82c-.61.24-1.18.58-1.72 1l-2.46-.86-2 3.46L5.08 11A7 7 0 0 0 5 12c0 .34.03.67.08 1l-2.03 1.58 2 3.46 2.46-.86c.54.42 1.11.76 1.72 1L9.5 21h5l.27-2.82c.61-.24 1.18-.58 1.72-1l2.46.86 2-3.46L18.92 13c.05-.33.08-.66.08-1Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  ),
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { href: "/pipeline", label: "Pipeline", icon: Icons.pipeline },
  { href: "/leads", label: "Leads", icon: Icons.leads },
  { href: "/deals", label: "Deals", icon: Icons.deals },
  { href: "/buyers", label: "Buyers", icon: Icons.buyers },
  { href: "/tasks", label: "Tasks", icon: Icons.tasks },
  { href: "/imports", label: "Imports", icon: Icons.imports },
  { href: "/reports", label: "Reports", icon: Icons.reports },
  { href: "/settings", label: "Settings", icon: Icons.settings },
]

export default function CrmShell({ children }: CrmShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="crm-app-shell">
      <aside className="crm-sidebar">
        <div className="crm-sidebar-inner">
          <div className="crm-brand">
            <Link href="/dashboard" className="crm-brand-mark" aria-label="Foundation OS">
              {Icons.brand}
            </Link>
            <div className="crm-brand-text">Foundation OS</div>
          </div>

          <nav className="crm-nav" aria-label="CRM navigation">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`crm-nav-link${active ? " active" : ""}`}
                  title={item.label}
                >
                  <span className="crm-nav-link-icon">{item.icon}</span>
                  <span className="crm-nav-link-text">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="crm-sidebar-footer">
            <div className="crm-sidebar-footer-card">
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>N</span>
            </div>

            <ActionButton variant="ghost" onClick={handleSignOut}>
              Sign Out
            </ActionButton>
          </div>
        </div>
      </aside>

      <main className="crm-main">
        <header className="crm-topbar">
          <div className="crm-topbar-left">
            <div className="crm-topbar-title">Foundation OS</div>
          </div>

          <div className="crm-topbar-right">
            <Link href="/leads/new">
              <ActionButton variant="gold">+ Lead</ActionButton>
            </Link>
            <Link href="/tasks">
              <ActionButton>+ Task</ActionButton>
            </Link>
            <Link href="/buyers">
              <ActionButton>+ Buyer</ActionButton>
            </Link>
            <Link href="/imports">
              <ActionButton>Import</ActionButton>
            </Link>
          </div>
        </header>

        <div className="crm-main-content">
          <div className="crm-content-wrap">{children}</div>
        </div>
      </main>
    </div>
  )
}