'use client'

import ShipMapClient from '@/components/ShipMapClient'
import ShipsDataLoader from '@/components/ShipsDataLoader'

export default function MapView() {
  return (
    <ShipsDataLoader>
      {(ships) => <ShipMapClient ships={ships} />}
    </ShipsDataLoader>
  )
}
