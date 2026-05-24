// Imports the browser-only map wrapper used on the map page.
import ShipMapClient from '@/components/ShipMapClient'
import { getShips } from '@/lib/api'

// Renders the "/map" route.
export default async function MapPage() {
  const ships = await getShips()

  return (
    // Uses a semantic main region for the interactive map page content.
    <main>
      {/* Loads the map only on the client because Leaflet needs browser APIs. */}
      <ShipMapClient ships={ships} />
    </main>
  )
}
