import MapView from '@/components/MapView'
import ProtectedRoute from '@/components/ProtectedRoute'

// Renders the "/map" route.
export default function MapPage() {
  return (
    // Uses a semantic main region for the interactive map page content.
    <main>
      <ProtectedRoute>
        <MapView />
      </ProtectedRoute>
    </main>
  )
}
