'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
]

const baseLinkClass = 'rounded-full px-3 py-2 text-sm transition-all md:px-4'
const activeLinkClass = 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
const inactiveLinkClass =
  'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]'

function linkClassName(isActive: boolean) {
  return `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
}

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

// Displays the shared navigation bar across the application.
export default function Navbar() {
  // Reads the current route so the active link can be highlighted.
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-[1000] w-full border-b border-[var(--border)] bg-[var(--surface)]/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Brand />

        <div className="flex items-center gap-2 md:gap-4">
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
