// Imports the browser-only map wrapper used on the map page.
import ShipMapClient from '@/components/ShipMapClient'

// Renders the "/map" route.
export default function MapPage() {
  return (
    // Uses a semantic main region for the interactive map page content.
    <main>
      {/* Loads the map only on the client because Leaflet needs browser APIs. */}
      <ShipMapClient />
    </main>
  )
}
