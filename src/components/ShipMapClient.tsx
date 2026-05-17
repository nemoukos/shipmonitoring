'use client'

// Imports Next.js dynamic loading so the Leaflet map is created only in the browser.
import dynamic from 'next/dynamic'

// Dynamically loads the interactive map component.
const ShipMap = dynamic(
  () => import('@/components/ShipMap'),
  {
    // Leaflet depends on browser APIs, so the map cannot render on the server.
    ssr: false,
  }
)

// Small client wrapper used by the server route component.
export default function ShipMapClient() {
  // Renders the browser-only map once the client bundle is available.
  return <ShipMap />
}
