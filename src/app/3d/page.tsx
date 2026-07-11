import ProtectedRoute from '@/components/ProtectedRoute'
import ThreeDView from '@/components/ThreeDView'

// Renders the direct-access "/3d" route.
export default function ThreeDPage() {
  // Passes all vessels to the client gallery so users can switch models in place.
  return (
    <ProtectedRoute>
      <ThreeDView />
    </ProtectedRoute>
  )
}
