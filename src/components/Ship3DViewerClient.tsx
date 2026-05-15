'use client'

import dynamic from 'next/dynamic'

const Ship3DViewer = dynamic(() => import('@/components/Ship3DViewer'), {
  ssr: false,
})

type Ship3DViewerClientProps = {
  shipName: string
}

export default function Ship3DViewerClient({
  shipName,
}: Ship3DViewerClientProps) {
  return <Ship3DViewer shipName={shipName} />
}
