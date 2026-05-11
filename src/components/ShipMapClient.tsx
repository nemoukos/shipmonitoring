'use client'

import dynamic from 'next/dynamic'

const ShipMap = dynamic(
  () => import('@/components/ShipMap'),
  {
    // Leaflet depends on browser APIs, so the map cannot render on the server.
    ssr: false,
  }
)

export default function ShipMapClient() {
  return <ShipMap />
}
