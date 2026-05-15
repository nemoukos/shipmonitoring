import Link from 'next/link'
import { notFound } from 'next/navigation'

import Ship3DViewerClient from '@/components/Ship3DViewerClient'
import ships from '@/data/ships.json'
import type { Ship } from '@/types/ship'

const typedShips = ships as Ship[]

type Ship3DPageProps = {
  params: Promise<{
    id: string
  }>
}

export function generateStaticParams() {
  return typedShips.map((ship) => ({
    id: String(ship.id),
  }))
}

export default async function Ship3DPage({ params }: Ship3DPageProps) {
  const { id } = await params
  const ship = typedShips.find((currentShip) => String(currentShip.id) === id)

  if (!ship) {
    notFound()
  }

  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-white">
      <Ship3DViewerClient shipName={ship.name} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-slate-950/80 via-slate-950/28 to-transparent p-4 md:p-6">
        <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              3D vessel view
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-4xl">
              {ship.name}
            </h1>

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

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2 text-xs text-slate-200 md:bottom-6 md:left-6 md:text-sm">
        <span className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
          Drag to rotate
        </span>

        <span className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
          Scroll to zoom
        </span>

        <span className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
          Oil tanker model
        </span>
      </div>
    </main>
  )
}
