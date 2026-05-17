'use client'

// Imports Next.js dynamic loading so the heavy Three.js viewer is split out
// and only requested in the browser when this component is rendered.
import dynamic from 'next/dynamic'

// Loads the 3D viewer without server-side rendering because Three.js needs
// browser features such as canvas and WebGL.
const Ship3DViewer = dynamic(() => import('@/components/Ship3DViewer'), {
  ssr: false,
})

// Defines the data the client wrapper must pass into the 3D viewer.
type Ship3DViewerClientProps = {
  // Vessel id used to select the matching procedural model recipe.
  shipId: number
  // Vessel name displayed in accessibility text and assigned to the scene group.
  shipName: string
}

// Bridges the server-rendered route with the browser-only 3D viewer component.
export default function Ship3DViewerClient({
  shipId,
  shipName,
}: Ship3DViewerClientProps) {
  // Forwards route data directly into the dynamically loaded viewer.
  return <Ship3DViewer shipId={shipId} shipName={shipName} />
}
