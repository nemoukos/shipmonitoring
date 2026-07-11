'use client'

import Ship3DGallery from '@/components/Ship3DGallery'
import ShipsDataLoader from '@/components/ShipsDataLoader'

export default function ThreeDView() {
  return (
    <ShipsDataLoader>
      {(ships) => <Ship3DGallery ships={ships} />}
    </ShipsDataLoader>
  )
}
