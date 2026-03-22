'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Acquisitions CRM</h1>

        <p style={subtitleStyle}>
          Sign in to access your workspace
        </p>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={errorStyle}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f6f3ee',
}

const cardStyle: React.CSSProperties = {
  width: 420,
  padding: 36,
  borderRadius: 20,
  background: '#fffdfa',
  border: '1px solid #e8e0d7',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
}

const subtitleStyle: React.CSSProperties = {
  margin: '4px 0 12px 0',
  color: '#7a7269',
}

const inputStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 10,
  border: '1px solid #e2d8cd',
  padding: '0 12px',
}

const buttonStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 10,
  border: 'none',
  background: '#c9a34e',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
}

const errorStyle: React.CSSProperties = {
  color: 'red',
  fontSize: 14,
}