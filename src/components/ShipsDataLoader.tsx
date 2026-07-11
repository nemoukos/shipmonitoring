'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { apiFetch } from '@/lib/clientApi'
import type { Ship } from '@/types/ship'

type ShipsDataLoaderProps = {
  children: (ships: Ship[]) => ReactNode
}

export default function ShipsDataLoader({ children }: ShipsDataLoaderProps) {
  const { token } = useAuth()
  const router = useRouter()
  const [ships, setShips] = useState<Ship[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      return
    }

    const authToken = token

    async function loadShips() {
      const response = await apiFetch('/api/ships', authToken)

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      if (!response.ok) {
        setError('Unable to load ships.')
        setIsLoading(false)
        return
      }

      const data = (await response.json()) as { ships: Ship[] }

      setShips(data.ships)
      setIsLoading(false)
    }

    void loadShips()
  }, [router, token])

  if (isLoading) {
    return (
      <div className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
        <p className="text-sm text-[var(--muted)]">Loading ships...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-4 py-3 text-red-100">
          {error}
        </p>
      </div>
    )
  }

  return children(ships)
}
