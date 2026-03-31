import type { ReactNode } from 'react'
import CrmShell from '@/components/ui/crm-shell'

export default function CRMLayout({
  children,
}: {
  children: ReactNode
}) {
  return <CrmShell>{children}</CrmShell>
}