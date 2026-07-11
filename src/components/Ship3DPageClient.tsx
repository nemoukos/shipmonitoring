'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import Ship3DViewerClient from '@/components/Ship3DViewerClient'
import { apiFetch } from '@/lib/clientApi'
import type { Ship } from '@/types/ship'

export default function Ship3DPageClient({ shipId }: { shipId: string }) {
  const { token } = useAuth()
  const router = useRouter()
  const [ship, setShip] = useState<Ship | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      return
    }

    const authToken = token

    async function loadShip() {
      const response = await apiFetch(`/api/ships/${shipId}`, authToken)

      if (response.status === 401) {
        router.replace(`/login?next=/ships/${shipId}/3d`)
        return
      }

      if (response.status === 404) {
        setError('Ship not found.')
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        setError('Unable to load ship.')
        setIsLoading(false)
        return
      }

      const data = (await response.json()) as { ship: Ship }

      setShip(data.ship)
      setIsLoading(false)
    }

    void loadShip()
  }, [router, shipId, token])

  if (isLoading) {
    return (
      <main className="grid min-h-[calc(100vh-64px)] place-items-center bg-slate-950 px-4 text-white">
        <p className="text-sm text-slate-300">Loading ship...</p>
      </main>
    )
  }

  if (error || !ship) {
    return (
      <main className="grid min-h-[calc(100vh-64px)] place-items-center bg-slate-950 px-4 text-white">
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-4 py-3 text-red-100">
          {error}
        </p>
      </main>
    )
  }

  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-white">
      <Ship3DViewerClient shipId={ship.id} shipName={ship.name} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-slate-950/80 via-slate-950/28 to-transparent p-4 md:p-6">
        <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              3D vessel view
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-4xl">{ship.name}</h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
              {ship.origin} to {ship.destination}
            </p>
          </div>

          <Link
            href="/map"
            className="rounded-md border border-cyan-200/30 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur transition hover:bg-cyan-300 hover:text-slate-950"
          >
            Back to map
          </Link>
        </div>
      </div>
    </main>
  )
}
