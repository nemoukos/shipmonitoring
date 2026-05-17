'use client'

// Imports React state so the user can switch vessels without leaving the page.
import { useState } from 'react'

// Reuses the existing browser-only 3D viewer wrapper.
import Ship3DViewerClient from '@/components/Ship3DViewerClient'

// Imports the shared vessel shape used by the selector and viewer.
import type { Ship } from '@/types/ship'

// Props accepted by the standalone 3D gallery component.
type Ship3DGalleryProps = {
  // Full vessel list available for direct selection.
  ships: Ship[]
}

// Renders the direct-access 3D page experience with a vessel selector.
export default function Ship3DGallery({ ships }: Ship3DGalleryProps) {
  // Starts with the first vessel so the page always opens with a visible model.
  const [selectedShipId, setSelectedShipId] = useState(ships[0]?.id ?? 0)

  // Finds the complete ship record that matches the currently selected id.
  const selectedShip =
    ships.find((ship) => ship.id === selectedShipId) ?? ships[0]

  if (!selectedShip) {
    // Protects the page from rendering an invalid viewer when no ships exist.
    return null
  }

  return (
    // Creates a full-screen 3D stage below the global navigation bar.
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-white">
      {/* Displays the currently selected vessel model. */}
      <Ship3DViewerClient
        shipId={selectedShip.id}
        shipName={selectedShip.name}
      />

      {/* Overlays the title, route description, and vessel selector above the scene. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/35 to-transparent p-4 md:p-6">
        <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              3D vessel view
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-4xl">
              {selectedShip.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
              {selectedShip.origin} to {selectedShip.destination}
            </p>
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-100">
            {/* Describes the control so users know it changes the visible vessel model. */}
            <span>Select vessel</span>

            <select
              // Keeps the selector synchronized with the currently visible ship.
              value={selectedShip.id}
              // Converts the selected option value back to a numeric ship id.
              onChange={(event) => setSelectedShipId(Number(event.target.value))}
              className="min-w-56 rounded-md border border-cyan-200/30 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none backdrop-blur transition focus:border-cyan-300"
            >
              {/* Creates one dropdown option for every available vessel model. */}
              {ships.map((ship) => (
                <option key={ship.id} value={ship.id}>
                  {ship.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Keeps the interaction help visible for users entering directly from navigation. */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2 text-xs text-slate-200 md:bottom-6 md:left-6 md:text-sm">
        <span className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
          Drag to rotate
        </span>

        <span className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
          Scroll to zoom
        </span>

        <span className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
          Choose any vessel above
        </span>
      </div>
    </main>
  )
}
