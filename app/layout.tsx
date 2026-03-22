import './globals.css'

export const metadata = {
  title: 'Acquisitions CRM',
  description: 'Foundation Acquisitions LLC CRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}