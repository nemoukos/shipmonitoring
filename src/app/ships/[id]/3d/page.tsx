import ProtectedRoute from '@/components/ProtectedRoute'
import Ship3DPageClient from '@/components/Ship3DPageClient'

type Ship3DPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function Ship3DPage({ params }: Ship3DPageProps) {
  const { id } = await params

  return (
    <ProtectedRoute>
      <Ship3DPageClient shipId={id} />
    </ProtectedRoute>
  )
}
