// Imports the dashboard visualization component used on this route.
import ShipCharts from '@/components/ShipCharts'
import { getShips } from '@/lib/api'

// Renders the "/dashboard" route.
export default async function DashboardPage() {
  const ships = await getShips()

  return (
    // Provides a full-height page surface that matches the active theme background.
    <main className="min-h-screen bg-[var(--background)]">
      {/* Displays all chart cards and date controls for the dashboard. */}
      <ShipCharts ships={ships} />
    </main>
  )
}
