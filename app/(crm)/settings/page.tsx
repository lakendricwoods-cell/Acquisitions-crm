'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/page-shell'
import SectionCard from '@/components/ui/section-card'
import ActionButton from '@/components/ui/action-button'
import StatPill from '@/components/ui/stat-pill'

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

export default function SettingsPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')

  const [theme, setTheme] = useState('dark-glass')
  const [density, setDensity] = useState('comfortable')
  const [defaultView, setDefaultView] = useState('dashboard')

  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPrefs, setLoadingPrefs] = useState(false)

  useEffect(() => {
    void loadSettings()
  }, [])

  const loadSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setEmail(user.email || '')

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileData) {
      const profile = profileData as ProfileRow
      setFullName(profile.full_name || '')
      setEmail(profile.email || user.email || '')
      setRole(profile.role || 'admin')
    }

    const { data: prefsData } = await supabase
      .from('user_preferences')
      .select('theme, density, default_view')
      .eq('user_id', user.id)
      .maybeSingle()

    if (prefsData) {
      setTheme((prefsData as any).theme || 'dark-glass')
      setDensity((prefsData as any).density || 'comfortable')
      setDefaultView((prefsData as any).default_view || 'dashboard')
    }
  }

  const saveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be logged in')
      return
    }

    setLoadingProfile(true)

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: fullName || null,
        email: email || null,
        role: role || 'admin',
      },
      { onConflict: 'id' }
    )

    setLoadingProfile(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Profile saved')
  }

  const savePreferences = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be logged in')
      return
    }

    setLoadingPrefs(true)

    const { error } = await supabase.from('user_preferences').upsert(
      {
        user_id: user.id,
        theme,
        density,
        default_view: defaultView,
      },
      { onConflict: 'user_id' }
    )

    setLoadingPrefs(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Preferences saved')
  }

  return (
    <PageShell
      title="Settings"
      subtitle="Operator profile, workspace behavior, and cockpit defaults."
      actions={
        <>
          <StatPill label="Theme" value={theme} />
          <StatPill label="Density" value={density} />
          <StatPill label="Default View" value={defaultView} />
        </>
      }
    >
      <div style={settingsGridStyle}>
        <div style={settingsLeftStyle}>
          <SectionCard
            title="Operator Identity"
            subtitle="This should feel like configuring your command seat, not editing a basic account form."
          >
            <div style={heroPanelStyle}>
              <div style={heroEyebrowStyle}>Operator Profile</div>
              <div style={heroTitleStyle}>Tune the control surface for how you actually work deals.</div>
              <div style={heroCopyStyle}>
                Settings should support the CRM personality: dark glass, focused motion,
                fast readability, and a premium operator feel.
              </div>
            </div>

            <div style={formGridStyle}>
              <Field label="Full Name">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </Field>

              <Field label="Role">
                <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="acquisitions">Acquisitions</option>
                  <option value="dispositions">Dispositions</option>
                </select>
              </Field>

              <div>
                <ActionButton tone="gold" onClick={saveProfile}>
                  {loadingProfile ? 'Saving...' : 'Save Profile'}
                </ActionButton>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Workspace Behavior"
            subtitle="These are the defaults that shape the feel of the CRM."
          >
            <div style={formGridStyle}>
              <Field label="Theme">
                <select value={theme} onChange={(e) => setTheme(e.target.value)} style={inputStyle}>
                  <option value="dark-glass">Dark Glass</option>
                  <option value="midnight-gold">Midnight Gold</option>
                  <option value="obsidian">Obsidian</option>
                </select>
              </Field>

              <Field label="Density">
                <select value={density} onChange={(e) => setDensity(e.target.value)} style={inputStyle}>
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </Field>

              <Field label="Default View">
                <select value={defaultView} onChange={(e) => setDefaultView(e.target.value)} style={inputStyle}>
                  <option value="dashboard">Dashboard</option>
                  <option value="leads">Leads</option>
                  <option value="pipeline">Pipeline</option>
                  <option value="tasks">Tasks</option>
                  <option value="buyers">Buyers</option>
                </select>
              </Field>

              <div>
                <ActionButton tone="gold" onClick={savePreferences}>
                  {loadingPrefs ? 'Saving...' : 'Save Preferences'}
                </ActionButton>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={settingsRightStyle}>
          <SectionCard
            title="Operator Summary"
            subtitle="Live snapshot of your current workspace setup."
          >
            <div style={summaryStackStyle}>
              <SummaryRow label="Name" value={fullName || 'Not set'} />
              <SummaryRow label="Email" value={email || 'Not set'} />
              <SummaryRow label="Role" value={role || 'Not set'} />
              <SummaryRow label="Theme" value={theme} />
              <SummaryRow label="Density" value={density} />
              <SummaryRow label="Default View" value={defaultView} />
            </div>
          </SectionCard>

          <SectionCard
            title="Recommended Configuration"
            subtitle="Suggested defaults for a premium acquisitions workflow."
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <RecommendationCard
                title="Theme"
                text="Use Dark Glass or Midnight Gold to keep the CRM aligned with the premium black-glass direction."
              />
              <RecommendationCard
                title="Density"
                text="Comfortable gives the best balance of speed and readability for long sessions."
              />
              <RecommendationCard
                title="Default View"
                text="Dashboard or Leads makes the most sense when intake and execution are the main focus."
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={fieldLabelStyle}>{label}</div>
      {children}
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={summaryRowStyle}>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value}</div>
    </div>
  )
}

function RecommendationCard({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div style={recommendationCardStyle}>
      <div style={recommendationTitleStyle}>{title}</div>
      <div style={recommendationTextStyle}>{text}</div>
    </div>
  )
}

const settingsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.1fr) 360px',
  gap: 18,
}

const settingsLeftStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
}

const settingsRightStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
}

const heroPanelStyle: CSSProperties = {
  padding: 18,
  borderRadius: 24,
  border: '1px solid rgba(201,163,78,0.18)',
  background:
    'radial-gradient(circle at top left, rgba(201,163,78,0.14), transparent 40%), linear-gradient(180deg, rgba(18,18,18,0.92) 0%, rgba(9,9,9,0.88) 100%)',
  color: 'white',
  marginBottom: 16,
}

const heroEyebrowStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  color: 'rgba(255,255,255,0.42)',
}

const heroTitleStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 24,
  lineHeight: 1.08,
  fontWeight: 800,
  letterSpacing: '-0.03em',
}

const heroCopyStyle: CSSProperties = {
  marginTop: 10,
  color: 'rgba(255,255,255,0.68)',
  lineHeight: 1.55,
}

const formGridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const inputStyle: CSSProperties = {
  height: 48,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'white',
  padding: '0 12px',
}

const fieldLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: 'rgba(255,255,255,0.44)',
}

const summaryStackStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const summaryRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  padding: 12,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const summaryLabelStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.46)',
  fontSize: 12,
}

const summaryValueStyle: CSSProperties = {
  textAlign: 'right',
  color: 'rgba(255,255,255,0.88)',
  fontSize: 12,
  fontWeight: 700,
}

const recommendationCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(201,163,78,0.18)',
  background: 'rgba(201,163,78,0.06)',
}

const recommendationTitleStyle: CSSProperties = {
  fontWeight: 700,
  color: '#f4ddaa',
}

const recommendationTextStyle: CSSProperties = {
  marginTop: 6,
  color: 'rgba(255,255,255,0.7)',
  lineHeight: 1.5,
  fontSize: 14,
}