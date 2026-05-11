import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Ship Dashboard',
  description: 'Ship Monitoring Web Application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
