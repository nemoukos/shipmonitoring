import AlertsView from '@/components/AlertsView'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AlertsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <ProtectedRoute>
        <AlertsView />
      </ProtectedRoute>
    </main>
  )
}
