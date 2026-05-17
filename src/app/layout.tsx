// Loads the global stylesheet once for the whole application.
import './globals.css'

// Imports the shared navigation bar displayed on every route.
import Navbar from '@/components/Navbar'

// Provides the default metadata used by the application shell.
export const metadata = {
  title: 'Ship Dashboard',
  description: 'Ship Monitoring Web Application',
}

export default function RootLayout({
  children,
}: Readonly<{
  // Represents the page content rendered for the currently active route.
  children: React.ReactNode
}>) {
  return (
    // Defines the root HTML document and enables the dark theme variables.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      {/* Wraps all visible app content and keeps the page at least viewport-height tall. */}
      <body className="min-h-screen">
        {/* Renders the shared top navigation before the route-specific page content. */}
        <Navbar />
        {/* Inserts whichever child route Next.js is currently rendering. */}
        {children}
      </body>
    </html>
  )
}
