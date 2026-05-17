'use client'

// Imports optimized internal navigation links from Next.js.
import Link from 'next/link'

// Reads the current route so the navbar can highlight the active page.
import { usePathname } from 'next/navigation'

// React hooks are used for the live date/time display.
import { useEffect, useState } from 'react'

// Central list of the routes shown in the navigation bar.
const navLinks = [
  {
    name: 'Home',
    path: '/',
  },
  {
    name: 'Map',
    path: '/map',
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
  },
  {
    // Direct-entry route that opens the standalone 3D vessel gallery.
    name: '3D View',
    path: '/3d',
  },
]

// Shared Tailwind classes used by every navigation link.
const baseLinkClass = 'rounded-full px-3 py-2 text-sm transition-all md:px-4'

// Extra classes applied only to the currently active route.
const activeLinkClass = 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'

// Extra classes applied to links that are not currently selected.
const inactiveLinkClass =
  'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]'

// Builds the final class string for a nav link based on its active state.
function linkClassName(isActive: boolean) {
  return `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
}

// Renders the small brand mark and app title on the left side of the navbar.
function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />

      <h1 className="text-lg font-bold tracking-wide md:text-2xl">
        Ship Monitor
      </h1>
    </div>
  )
}

// Renders a live localized date and time string in the navigation bar.
function CurrentDateTime() {
  // Starts as null so the server and initial client render stay consistent.
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    // Updates once immediately after hydration so the browser time is shown.
    const timeoutId = window.setTimeout(() => {
      setNow(new Date())
    }, 0)

    // Refreshes the display every minute without re-rendering every second.
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 60_000)

    // Cleans up timers when the component is removed from the page.
    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [])

  if (!now) {
    // Avoids rendering time-sensitive content before the browser clock is available.
    return null
  }

  // Formats the calendar date using Greek locale settings.
  const date = new Intl.DateTimeFormat('el-GR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  // Formats a 24-hour time string using Greek locale settings.
  const time = new Intl.DateTimeFormat('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)

  return (
    <p className="hidden text-sm text-[var(--muted)] lg:block">
      {date}
      <span className="mx-4 text-[var(--border)]">|</span>
      Ώρα {time}
    </p>
  )
}

// Displays the shared navigation bar across the application.
export default function Navbar() {
  // Reads the current route so the active link can be highlighted.
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-[1000] w-full border-b border-[var(--border)] bg-[var(--surface)]/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-6">
          <Brand />
          <CurrentDateTime />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Renders one internal navigation link for every configured route. */}
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={linkClassName(pathname === link.path)}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
