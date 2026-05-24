// Imports internal navigation for the "Back to map" action.
import Link from 'next/link'

// Imports Next.js helper used to render the route-level 404 page.
import { notFound } from 'next/navigation'

// Imports the browser-only 3D viewer wrapper.
import Ship3DViewerClient from '@/components/Ship3DViewerClient'

import { getShipById } from '@/lib/api'

// Describes the dynamic route params received by the page component.
type Ship3DPageProps = {
  // In this Next.js version route params are provided asynchronously.
  params: Promise<{
    // Dynamic vessel id from the URL segment /ships/[id]/3d.
    id: string
  }>
}

// Renders the dynamic 3D vessel page for one selected ship.
export default async function Ship3DPage({ params }: Ship3DPageProps) {
  // Waits for the route parameters and extracts the vessel id from the URL.
  const { id } = await params

  const ship = await getShipById(id)

  if (!ship) {
    // Falls back to the route-level 404 page when the id is unknown.
    notFound()
  }

  return (
    // Creates a full-screen dark stage for the WebGL viewer and overlay UI.
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-white">
      {/* Renders the vessel-specific procedural 3D model. */}
      <Ship3DViewerClient shipId={ship.id} shipName={ship.name} />

      {/* Displays route metadata above the scene without blocking the viewer underneath. */}
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
            // Returns the user to the interactive map route.
            href="/map"
            className="rounded-md border border-cyan-200/30 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur transition hover:bg-cyan-300 hover:text-slate-950"
          >
            Back to map
          </Link>
        </div>
      </div>

      {/* Shows quick interaction hints near the bottom of the viewer. */}
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
