'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#0b0b0b',
        color: '#ffffff',
      }}
    >
      <aside
        style={{
          width: 240,
          borderRight: '1px solid #222',
          padding: 20,
          background: '#111111',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Acquisitions CRM</h2>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 24,
          }}
        >
          <NavLink href="/dashboard" label="Dashboard" pathname={pathname} />
          <NavLink href="/leads" label="Leads" pathname={pathname} />
          <NavLink href="/pipeline" label="Pipeline" pathname={pathname} />
          <NavLink href="/buyers" label="Buyers" pathname={pathname} />
          <NavLink href="/tasks" label="Tasks" pathname={pathname} />
          <NavLink href="/imports" label="Imports" pathname={pathname} />
          <NavLink href="/reports" label="Reports" pathname={pathname} />
          <NavLink href="/settings" label="Settings" pathname={pathname} />
        </nav>

        <button onClick={handleLogout} style={logoutButtonStyle}>
          Logout
        </button>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 72,
            borderBottom: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: '#111111',
          }}
        >
          <strong>Foundation Acquisitions LLC</strong>
          <div style={{ color: '#a1a1aa' }}>Wholesale CRM</div>
        </header>

        <main style={{ padding: 24 }}>{children}</main>
      </div>
    </div>
  )
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string
  label: string
  pathname: string
}) {
  const active = pathname === href

  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        padding: '10px 12px',
        borderRadius: 10,
        background: active ? '#d4af37' : '#151515',
        border: active ? '1px solid #d4af37' : '1px solid #222',
        color: active ? '#111111' : '#ffffff',
      }}
    >
      {label}
    </Link>
  )
}

const logoutButtonStyle: React.CSSProperties = {
  marginTop: 24,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#fff',
  cursor: 'pointer',
  width: '100%',
}