'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { useAuth } from '@/components/AuthProvider'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isReady, token } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isReady && !token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isReady, pathname, router, token])

  if (!isReady || !token) {
    return (
      <main className="grid min-h-[calc(100vh-73px)] place-items-center bg-[var(--background)] px-4">
        <p className="text-sm text-[var(--muted)]">Loading session...</p>
      </main>
    )
  }

  return children
}
