// Imports the dashboard visualization component used on this route.
import ShipCharts from '@/components/ShipCharts'
import ProtectedRoute from '@/components/ProtectedRoute'

// Renders the "/dashboard" route.
export default function DashboardPage() {
  return (
    // Provides a full-height page surface that matches the active theme background.
    <main className="min-h-screen bg-[var(--background)]">
      <ProtectedRoute>
        {/* Displays ship measurements loaded from the database-backed API. */}
        <ShipCharts />
      </ProtectedRoute>
    </main>
  )
}
