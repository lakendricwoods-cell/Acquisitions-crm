'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import ActionButton from '@/components/ui/action-button'
import {
  LayoutDashboard,
  KanbanSquare,
  FileSpreadsheet,
  ListTodo,
  Settings,
  Users,
  Building2,
  LogOut,
  FileBarChart2,
} from 'lucide-react'

type CrmShellProps = {
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/leads', label: 'Leads', icon: Building2 },
  { href: '/deals', label: 'Deals', icon: FileBarChart2 },
  { href: '/buyers', label: 'Buyers', icon: Users },
  { href: '/imports', label: 'Imports', icon: FileSpreadsheet },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/reports', label: 'Reports', icon: FileBarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function CrmShell({ children }: CrmShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    router.push('/login')
  }

  return (
    <div style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={brandStyle}>
          <div style={brandMarkStyle}>F</div>
          <div style={brandTextWrapStyle}>
            <div style={brandTitleStyle}>Foundation OS</div>
            <div style={brandSubtitleStyle}>Acquisitions CRM</div>
          </div>
        </div>

        <nav style={navStyle}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...navItemStyle,
                  ...(active ? navItemActiveStyle : null),
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={sidebarFooterStyle}>
          <ActionButton tone="ghost" onClick={handleLogout}>
            <LogOut size={15} />
            Sign Out
          </ActionButton>
        </div>
      </aside>

      <main style={mainStyle}>
        <div style={contentWrapStyle}>{children}</div>
      </main>
    </div>
  )
}

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '250px minmax(0, 1fr)',
  background: '#000',
}

const sidebarStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  height: '100vh',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  gap: 18,
  padding: 18,
  borderRight: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
}

const brandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}

const brandMarkStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: 'grid',
  placeItems: 'center',
  fontWeight: 800,
  color: '#8ff6ff',
  border: '1px solid rgba(88,230,255,0.25)',
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
  boxShadow: '0 0 18px rgba(88,230,255,0.12)',
}

const brandTextWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  minWidth: 0,
}

const brandTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#fff',
}

const brandSubtitleStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.55)',
}

const navStyle: CSSProperties = {
  display: 'grid',
  alignContent: 'start',
  gap: 8,
}

const navItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 42,
  padding: '0 12px',
  borderRadius: 12,
  color: 'rgba(255,255,255,0.72)',
  border: '1px solid transparent',
  textDecoration: 'none',
  background: 'transparent',
}

const navItemActiveStyle: CSSProperties = {
  color: '#fff',
  border: '1px solid rgba(88,230,255,0.22)',
  background: 'linear-gradient(180deg, rgba(3,4,8,0.98), rgba(0,0,0,1))',
  boxShadow: '0 0 14px rgba(88,230,255,0.10)',
}

const sidebarFooterStyle: CSSProperties = {
  display: 'grid',
}

const mainStyle: CSSProperties = {
  minWidth: 0,
  background: '#000',
}

const contentWrapStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: 1680,
  margin: '0 auto',
}