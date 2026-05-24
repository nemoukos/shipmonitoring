// Imports the standalone 3D gallery experience used by this route.
import Ship3DGallery from '@/components/Ship3DGallery'
import { getShips } from '@/lib/api'

// Renders the direct-access "/3d" route.
export default async function ThreeDPage() {
  const ships = await getShips()

  // Passes all vessels to the client gallery so users can switch models in place.
  return <Ship3DGallery ships={ships} />
}
