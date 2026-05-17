// Imports the standalone 3D gallery experience used by this route.
import Ship3DGallery from '@/components/Ship3DGallery'

// Loads the local vessel list shown in the gallery selector.
import ships from '@/data/ships.json'

// Imports the shared vessel type used across the application.
import type { Ship } from '@/types/ship'

// Narrows imported JSON records to the vessel shape expected by the gallery.
const typedShips = ships as Ship[]

// Renders the direct-access "/3d" route.
export default function ThreeDPage() {
  // Passes all vessels to the client gallery so users can switch models in place.
  return <Ship3DGallery ships={typedShips} />
}
