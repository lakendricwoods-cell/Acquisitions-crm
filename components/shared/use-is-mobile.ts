'use client'

import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth <= breakpoint)
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [breakpoint])

  return isMobile
}