import '@/app/globals.css'

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="crm-root">
      <div className="crm-shell">
        {children}
      </div>
    </div>
  )
}