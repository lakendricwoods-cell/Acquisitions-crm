'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import ActionButton from '@/components/ui/action-button'

type CrmShellProps = {
  children: ReactNode
}

type NavItem = {
  href: string
  label: string
  shortLabel: string
  icon: ReactNode
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="4" rx="1.5" />
      <rect x="14" y="10" width="7" height="11" rx="1.5" />
      <rect x="3" y="13" width="7" height="8" rx="1.5" />
    </svg>
  )
}

function IconPipeline() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <rect x="3" y="5" width="4" height="14" rx="1.5" />
      <rect x="10" y="8" width="4" height="11" rx="1.5" />
      <rect x="17" y="3" width="4" height="16" rx="1.5" />
    </svg>
  )
}

function IconLeads() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

function IconDeals() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <path d="M4 7h16" />
      <path d="M4 12h10" />
      <path d="M4 17h7" />
      <rect x="14" y="10" width="6" height="8" rx="1.5" />
    </svg>
  )
}

function IconBuyers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
      <path d="M14 18a3.5 3.5 0 0 1 6 0" />
    </svg>
  )
}

function IconImports() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <rect x="4" y="17" width="16" height="4" rx="1.5" />
    </svg>
  )
}

function IconTasks() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <path d="M9 11l2 2 4-5" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

function IconReports() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <path d="M6 20V10" />
      <path d="M12 20V4" />
      <path d="M18 20v-7" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={iconSvgStyle}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <IconDashboard /> },
  { href: '/pipeline', label: 'Pipeline', shortLabel: 'Pipeline', icon: <IconPipeline /> },
  { href: '/leads', label: 'Leads', shortLabel: 'Leads', icon: <IconLeads /> },
  { href: '/deals', label: 'Deals', shortLabel: 'Deals', icon: <IconDeals /> },
  { href: '/buyers', label: 'Buyers', shortLabel: 'Buyers', icon: <IconBuyers /> },
  { href: '/imports', label: 'Imports', shortLabel: 'Imports', icon: <IconImports /> },
  { href: '/tasks', label: 'Tasks', shortLabel: 'Tasks', icon: <IconTasks /> },
  { href: '/reports', label: 'Reports', shortLabel: 'Reports', icon: <IconReports /> },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings', icon: <IconSettings /> },
]

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/pipeline')) return 'Pipeline'
  if (pathname.startsWith('/leads')) return 'Leads'
  if (pathname.startsWith('/deals')) return 'Deals'
  if (pathname.startsWith('/buyers')) return 'Buyers'
  if (pathname.startsWith('/imports')) return 'Imports'
  if (pathname.startsWith('/tasks')) return 'Tasks'
  if (pathname.startsWith('/reports')) return 'Reports'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'Foundation OS'
}

function getMobileNavItems() {
  return NAV_ITEMS.slice(0, 5)
}

export default function CrmShell({ children }: CrmShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function sync() {
      setIsMobile(window.innerWidth <= 860)
    }

    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const mobileNavItems = useMemo(() => getMobileNavItems(), [])

  function handleLogout() {
    router.push('/login')
  }

  return (
    <div style={shellStyle}>
      {!isMobile ? (
        <aside style={sidebarStyle}>
          <div style={brandWrapStyle}>
            <div style={brandMarkStyle}>F</div>
            <div style={brandTextWrapStyle}>
              <div style={brandTitleStyle}>Foundation OS</div>
              <div style={brandSubtitleStyle}>Acquisitions CRM</div>
            </div>
          </div>

          <nav style={navStyle}>
            {NAV_ITEMS.map((item) => {
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
                  <span style={navIconStyle}>{item.icon}</span>
                  <span style={navLabelStyle}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div style={sidebarFooterStyle}>
            <div style={footerCardStyle}>
              <div style={footerCardTitleStyle}>System</div>
              <div style={footerCardTextStyle}>Mobile-ready CRM shell active</div>
            </div>

            <ActionButton tone="ghost" onClick={handleLogout}>
              Sign Out
            </ActionButton>
          </div>
        </aside>
      ) : null}

      <main style={mainStyle}>
        <header style={topbarStyle}>
          <div style={topbarLeftStyle}>
            <div style={pageKickerStyle}>Foundation Acquisitions LLC</div>
            <div style={pageTitleStyle}>{getPageTitle(pathname)}</div>
          </div>

          {!isMobile ? (
            <div style={topbarRightStyle}>
              <Link href="/leads">
                <ActionButton compact tone="gold">
                  + Lead
                </ActionButton>
              </Link>
              <Link href="/tasks">
                <ActionButton compact>
                  + Task
                </ActionButton>
              </Link>
              <Link href="/buyers">
                <ActionButton compact>
                  + Buyer
                </ActionButton>
              </Link>
              <Link href="/imports">
                <ActionButton compact>
                  Import
                </ActionButton>
              </Link>
            </div>
          ) : (
            <div style={mobileTopbarActionsStyle}>
              <Link href="/leads">
                <ActionButton compact tone="gold">
                  + Lead
                </ActionButton>
              </Link>
            </div>
          )}
        </header>

        <div
          style={{
            ...contentAreaStyle,
            paddingBottom: isMobile ? 84 : 0,
          }}
        >
          {children}
        </div>

        {isMobile ? (
          <nav style={mobileBottomNavStyle}>
            {mobileNavItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...mobileNavItemStyle,
                    ...(active ? mobileNavItemActiveStyle : null),
                  }}
                >
                  <span style={mobileNavIconStyle}>{item.icon}</span>
                  <span style={mobileNavLabelStyle}>{item.shortLabel}</span>
                </Link>
              )
            })}
          </nav>
        ) : null}
      </main>
    </div>
  )
}

const iconSvgStyle: CSSProperties = {
  width: 17,
  height: 17,
  strokeWidth: 1.8,
}

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '268px minmax(0, 1fr)',
  background: '#000000',
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
  background: 'linear-gradient(180deg, rgba(4,4,4,0.98), rgba(0,0,0,1))',
  boxShadow: 'inset -1px 0 0 rgba(214,166,75,0.06)',
}

const brandWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  paddingBottom: 6,
}

const brandMarkStyle: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 14,
  display: 'grid',
  placeItems: 'center',
  fontWeight: 800,
  fontSize: 18,
  color: '#e0b84f',
  border: '1px solid rgba(214,166,75,0.28)',
  background: 'linear-gradient(180deg, rgba(4,4,4,0.98), rgba(0,0,0,1))',
  boxShadow: '0 0 16px rgba(214,166,75,0.10)',
}

const brandTextWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  minWidth: 0,
}

const brandTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.2,
}

const brandSubtitleStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.54)',
  lineHeight: 1.2,
}

const navStyle: CSSProperties = {
  display: 'grid',
  alignContent: 'start',
  gap: 8,
}

const navItemStyle: CSSProperties = {
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 12px',
  borderRadius: 13,
  border: '1px solid transparent',
  color: 'rgba(255,255,255,0.72)',
  background: 'transparent',
  textDecoration: 'none',
}

const navItemActiveStyle: CSSProperties = {
  color: '#ffffff',
  border: '1px solid rgba(214,166,75,0.24)',
  background: 'linear-gradient(180deg, rgba(4,4,4,0.98), rgba(0,0,0,1))',
  boxShadow: '0 0 14px rgba(214,166,75,0.10)',
}

const navIconStyle: CSSProperties = {
  width: 18,
  height: 18,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
}

const navLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
}

const sidebarFooterStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const footerCardStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(4,4,4,0.98), rgba(0,0,0,1))',
  padding: 12,
  display: 'grid',
  gap: 4,
}

const footerCardTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#ffffff',
}

const footerCardTextStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.52)',
}

const mainStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gridTemplateRows: '74px minmax(0, 1fr)',
  background: '#000000',
}

const topbarStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 20,
  height: 74,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 18,
  padding: '0 22px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  background: 'linear-gradient(180deg, rgba(4,4,4,0.96), rgba(0,0,0,0.98))',
  boxShadow: 'inset 0 -1px 0 rgba(214,166,75,0.05)',
}

const topbarLeftStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  minWidth: 0,
}

const pageKickerStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'rgba(255,255,255,0.38)',
}

const pageTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.1,
}

const topbarRightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const mobileTopbarActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const contentAreaStyle: CSSProperties = {
  minWidth: 0,
  background: '#000000',
}

const mobileBottomNavStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 40,
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 8,
  padding: '10px 10px calc(10px + env(safe-area-inset-bottom))',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  background: 'linear-gradient(180deg, rgba(4,4,4,0.98), rgba(0,0,0,1))',
  boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
}

const mobileNavItemStyle: CSSProperties = {
  minHeight: 56,
  borderRadius: 14,
  display: 'grid',
  justifyItems: 'center',
  alignContent: 'center',
  gap: 4,
  color: 'rgba(255,255,255,0.68)',
  border: '1px solid transparent',
  textDecoration: 'none',
  background: 'transparent',
}

const mobileNavItemActiveStyle: CSSProperties = {
  color: '#ffffff',
  border: '1px solid rgba(214,166,75,0.24)',
  background: 'linear-gradient(180deg, rgba(4,4,4,0.98), rgba(0,0,0,1))',
  boxShadow: '0 0 12px rgba(214,166,75,0.08)',
}

const mobileNavIconStyle: CSSProperties = {
  width: 18,
  height: 18,
  display: 'grid',
  placeItems: 'center',
}

const mobileNavLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1,
}