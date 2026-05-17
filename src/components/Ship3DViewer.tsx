'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type Ship3DViewerProps = {
  // Vessel id used to select the matching procedural model recipe.
  shipId: number
  // Vessel name used for scene naming and accessibility text.
  shipName: string
}

// Creates the complete interactive Three.js scene for one ship.
export default function Ship3DViewer({
  shipId,
  shipName,
}: Ship3DViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Uses the mounted div as the DOM host for the WebGL canvas.
    const mount = mountRef.current

    if (!mount) {
      // Stops setup until React has attached the host element.
      return
    }

    // Creates the scene and gives it a dark marine background with distance fog.
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x06111f)
    scene.fog = new THREE.Fog(0x06111f, 18, 42)

    // Sets the viewing camera and its initial orbit position.
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    )
    camera.position.set(7.5, 3.8, 7.2)

    // Creates the WebGL renderer and configures output quality.
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    // Enables user-controlled orbiting, zooming, and eased motion.
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 4
    controls.maxDistance = 18
    controls.maxPolarAngle = Math.PI / 2.05
    controls.target.set(0, 0.75, 0)

    // Combines hemisphere, key, and fill lights to reveal hull and deck details.
    const hemiLight = new THREE.HemisphereLight(0xc7f9ff, 0x1c3b52, 2.4)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.2)
    sunLight.position.set(6, 9, 4)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(2048, 2048)
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x67e8f9, 1.1)
    fillLight.position.set(-6, 3, -4)
    scene.add(fillLight)

    // Builds the animated water surface under the vessel.
    const waterGeometry = new THREE.PlaneGeometry(80, 80, 96, 96)
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x075985,
      roughness: 0.68,
      metalness: 0.04,
    })
    const water = new THREE.Mesh(waterGeometry, waterMaterial)
    water.rotation.x = -Math.PI / 2
    water.position.y = -0.12
    water.receiveShadow = true
    scene.add(water)

    // Adds a faint grid that helps communicate depth and scale.
    const grid = new THREE.GridHelper(80, 40, 0x38bdf8, 0x155e75)
    grid.position.y = -0.1
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.07
    scene.add(grid)

    // Creates the vessel model that matches the selected ship id.
    const shipModel = createOilTanker(shipName, shipId)
    shipModel.rotation.y = -Math.PI / 5
    shipModel.position.y = 0.18
    scene.add(shipModel)

    // Keeps the canvas and camera aspect ratio synchronized with layout changes.
    const resizeObserver = new ResizeObserver(() => {
      const width = mount.clientWidth
      const height = mount.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    })
    resizeObserver.observe(mount)

    let frameId = 0
    const clock = new THREE.Clock()

    // Drives wave animation, vessel bobbing, controls, and rendering every frame.
    function animate() {
      const elapsed = clock.getElapsedTime()

      if (shipModel) {
        shipModel.position.y = 0.18 + Math.sin(elapsed * 1.35) * 0.045
      }

      const positions = waterGeometry.attributes.position

      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index)
        const y = positions.getY(index)
        positions.setZ(
          index,
          Math.sin(x * 0.38 + elapsed * 0.85) * 0.045 +
            Math.cos(y * 0.32 + elapsed * 0.7) * 0.035
        )
      }

      positions.needsUpdate = true
      waterGeometry.computeVertexNormals()
      controls.update()
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    animate()

    // Releases GPU, observer, animation, and DOM resources when the viewer unmounts.
    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      waterGeometry.dispose()
      waterMaterial.dispose()

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]

          materials.forEach((material) => material.dispose())
        }
      })

      mount.removeChild(renderer.domElement)
    }
  }, [shipId, shipName])

  return (
    <div
      ref={mountRef}
      aria-label={`${shipName} 3D viewer`}
      className="h-full min-h-[calc(100vh-64px)] w-full"
    />
  )
}

type TankerVariant = {
  // Friendly design label describing the visual identity of this vessel recipe.
  profileName: string
  hullColor: number
  lowerHullColor: number
  deckColor: number
  hatchColor: number
  funnelColor: number
  length: number
  beam: number
  hatchCount: number
  hatchWidth: number
  hatchDepth: number
  bridgeX: number
  bridgeWidth: number
  bridgeDepth: number
  mastX: number
  upperBridgeLevels: number
  bowInset: number
  sternInset: number
  forecastleLength: number
  sternDeckLength: number
  pipeRows: 1 | 2 | 3
  ventStations: number[]
  hasCenterManifold: boolean
  hasTwinFunnels: boolean
  accentDeckColor?: number
  railInset: number
  bowEquipmentScale: number
  aftEquipmentScale: number
}

// Defines one unique procedural 3D recipe for each ship in the dataset.
const tankerVariants: TankerVariant[] = [
  {
    profileName: 'balanced classic',
    hullColor: 0x0b1120,
    lowerHullColor: 0x7f1d1d,
    deckColor: 0xe2e8f0,
    hatchColor: 0x334155,
    funnelColor: 0x1f2937,
    length: 8.4,
    beam: 1.48,
    hatchCount: 6,
    hatchWidth: 0.78,
    hatchDepth: 0.82,
    bridgeX: -3.05,
    bridgeWidth: 1.05,
    bridgeDepth: 0.88,
    mastX: 2.95,
    upperBridgeLevels: 2,
    bowInset: 1.08,
    sternInset: 0.24,
    forecastleLength: 1.28,
    sternDeckLength: 1.72,
    pipeRows: 3,
    ventStations: [2.1, 3.1],
    hasCenterManifold: true,
    hasTwinFunnels: false,
    railInset: 0.08,
    bowEquipmentScale: 1,
    aftEquipmentScale: 1,
  },
  {
    profileName: 'slender runner',
    hullColor: 0x172554,
    lowerHullColor: 0x991b1b,
    deckColor: 0xe0f2fe,
    hatchColor: 0x475569,
    funnelColor: 0x1e3a8a,
    length: 7.8,
    beam: 1.34,
    hatchCount: 5,
    hatchWidth: 0.72,
    hatchDepth: 0.74,
    bridgeX: -2.72,
    bridgeWidth: 0.94,
    bridgeDepth: 0.78,
    mastX: 2.66,
    upperBridgeLevels: 1,
    bowInset: 0.96,
    sternInset: 0.3,
    forecastleLength: 1.06,
    sternDeckLength: 1.42,
    pipeRows: 2,
    ventStations: [2.0],
    hasCenterManifold: false,
    hasTwinFunnels: false,
    railInset: 0.1,
    bowEquipmentScale: 0.84,
    aftEquipmentScale: 0.82,
  },
  {
    profileName: 'large crude carrier',
    hullColor: 0x111827,
    lowerHullColor: 0x92400e,
    deckColor: 0xf1f5f9,
    hatchColor: 0x1e293b,
    funnelColor: 0x7c2d12,
    length: 8.9,
    beam: 1.55,
    hatchCount: 7,
    hatchWidth: 0.82,
    hatchDepth: 0.86,
    bridgeX: -3.28,
    bridgeWidth: 1.14,
    bridgeDepth: 0.92,
    mastX: 3.18,
    upperBridgeLevels: 2,
    bowInset: 1.18,
    sternInset: 0.2,
    forecastleLength: 1.44,
    sternDeckLength: 1.9,
    pipeRows: 3,
    ventStations: [2.0, 3.0, 4.0],
    hasCenterManifold: true,
    hasTwinFunnels: true,
    railInset: 0.07,
    bowEquipmentScale: 1.12,
    aftEquipmentScale: 1.18,
  },
  {
    profileName: 'compact regional tanker',
    hullColor: 0x052e16,
    lowerHullColor: 0x166534,
    deckColor: 0xecfccb,
    hatchColor: 0x365314,
    funnelColor: 0x14532d,
    length: 7.5,
    beam: 1.42,
    hatchCount: 5,
    hatchWidth: 0.74,
    hatchDepth: 0.8,
    bridgeX: -2.62,
    bridgeWidth: 0.92,
    bridgeDepth: 0.82,
    mastX: 2.46,
    upperBridgeLevels: 1,
    bowInset: 0.9,
    sternInset: 0.34,
    forecastleLength: 1.0,
    sternDeckLength: 1.34,
    pipeRows: 1,
    ventStations: [1.85],
    hasCenterManifold: false,
    hasTwinFunnels: false,
    railInset: 0.09,
    bowEquipmentScale: 0.78,
    aftEquipmentScale: 0.8,
  },
  {
    profileName: 'wide beam tanker',
    hullColor: 0x312e81,
    lowerHullColor: 0x9f1239,
    deckColor: 0xf8fafc,
    hatchColor: 0x4338ca,
    funnelColor: 0x312e81,
    length: 8.2,
    beam: 1.62,
    hatchCount: 6,
    hatchWidth: 0.86,
    hatchDepth: 0.92,
    bridgeX: -2.95,
    bridgeWidth: 1.1,
    bridgeDepth: 0.94,
    mastX: 2.82,
    upperBridgeLevels: 2,
    bowInset: 1.14,
    sternInset: 0.22,
    forecastleLength: 1.38,
    sternDeckLength: 1.84,
    pipeRows: 3,
    ventStations: [2.2, 3.15],
    hasCenterManifold: true,
    hasTwinFunnels: false,
    accentDeckColor: 0xe0e7ff,
    railInset: 0.06,
    bowEquipmentScale: 1.08,
    aftEquipmentScale: 1.1,
  },
  {
    profileName: 'warm-toned mid-size tanker',
    hullColor: 0x1f2937,
    lowerHullColor: 0xb91c1c,
    deckColor: 0xfef3c7,
    hatchColor: 0x374151,
    funnelColor: 0x78350f,
    length: 7.9,
    beam: 1.38,
    hatchCount: 5,
    hatchWidth: 0.7,
    hatchDepth: 0.76,
    bridgeX: -2.74,
    bridgeWidth: 0.98,
    bridgeDepth: 0.8,
    mastX: 2.54,
    upperBridgeLevels: 2,
    bowInset: 1.0,
    sternInset: 0.28,
    forecastleLength: 1.12,
    sternDeckLength: 1.56,
    pipeRows: 2,
    ventStations: [2.05, 2.9],
    hasCenterManifold: false,
    hasTwinFunnels: false,
    railInset: 0.09,
    bowEquipmentScale: 0.92,
    aftEquipmentScale: 1,
  },
  {
    profileName: 'long-haul teal tanker',
    hullColor: 0x083344,
    lowerHullColor: 0x0f766e,
    deckColor: 0xecfeff,
    hatchColor: 0x155e75,
    funnelColor: 0x164e63,
    length: 8.65,
    beam: 1.46,
    hatchCount: 7,
    hatchWidth: 0.76,
    hatchDepth: 0.8,
    bridgeX: -3.12,
    bridgeWidth: 1.0,
    bridgeDepth: 0.84,
    mastX: 3.04,
    upperBridgeLevels: 1,
    bowInset: 1.1,
    sternInset: 0.18,
    forecastleLength: 1.36,
    sternDeckLength: 1.8,
    pipeRows: 3,
    ventStations: [2.1, 3.0, 3.9],
    hasCenterManifold: true,
    hasTwinFunnels: false,
    railInset: 0.08,
    bowEquipmentScale: 1.02,
    aftEquipmentScale: 0.94,
  },
  {
    profileName: 'lean bunker tanker',
    hullColor: 0x3f3f46,
    lowerHullColor: 0xbe123c,
    deckColor: 0xf4f4f5,
    hatchColor: 0x52525b,
    funnelColor: 0x18181b,
    length: 8.1,
    beam: 1.28,
    hatchCount: 6,
    hatchWidth: 0.68,
    hatchDepth: 0.72,
    bridgeX: -2.82,
    bridgeWidth: 0.9,
    bridgeDepth: 0.74,
    mastX: 2.7,
    upperBridgeLevels: 1,
    bowInset: 0.94,
    sternInset: 0.36,
    forecastleLength: 1.02,
    sternDeckLength: 1.4,
    pipeRows: 1,
    ventStations: [2.0],
    hasCenterManifold: false,
    hasTwinFunnels: false,
    railInset: 0.11,
    bowEquipmentScale: 0.76,
    aftEquipmentScale: 0.78,
  },
  {
    profileName: 'short heavy bunker',
    hullColor: 0x451a03,
    lowerHullColor: 0x9a3412,
    deckColor: 0xfffbeb,
    hatchColor: 0x78350f,
    funnelColor: 0x7c2d12,
    length: 7.7,
    beam: 1.5,
    hatchCount: 5,
    hatchWidth: 0.8,
    hatchDepth: 0.88,
    bridgeX: -2.68,
    bridgeWidth: 1.08,
    bridgeDepth: 0.9,
    mastX: 2.48,
    upperBridgeLevels: 2,
    bowInset: 1.02,
    sternInset: 0.26,
    forecastleLength: 1.18,
    sternDeckLength: 1.64,
    pipeRows: 2,
    ventStations: [1.95, 2.8],
    hasCenterManifold: true,
    hasTwinFunnels: true,
    railInset: 0.07,
    bowEquipmentScale: 1.06,
    aftEquipmentScale: 1.16,
  },
  {
    profileName: 'flagship long-range tanker',
    hullColor: 0x1e1b4b,
    lowerHullColor: 0x0f766e,
    deckColor: 0xf0f9ff,
    hatchColor: 0x3730a3,
    funnelColor: 0x0f172a,
    length: 8.75,
    beam: 1.58,
    hatchCount: 7,
    hatchWidth: 0.84,
    hatchDepth: 0.9,
    bridgeX: -3.2,
    bridgeWidth: 1.12,
    bridgeDepth: 0.96,
    mastX: 3.12,
    upperBridgeLevels: 2,
    bowInset: 1.2,
    sternInset: 0.2,
    forecastleLength: 1.46,
    sternDeckLength: 1.92,
    pipeRows: 3,
    ventStations: [2.15, 3.05, 3.95],
    hasCenterManifold: true,
    hasTwinFunnels: false,
    accentDeckColor: 0xdbeafe,
    railInset: 0.06,
    bowEquipmentScale: 1.14,
    aftEquipmentScale: 1.12,
  },
]

function createOilTanker(shipName: string, shipId: number) {
  // Groups every vessel mesh so the whole model can be animated together.
  const group = new THREE.Group()
  group.name = shipName
  // Chooses the recipe associated with the current ship id.
  const variant = tankerVariants[(shipId - 1) % tankerVariants.length]

  const hullMaterial = new THREE.MeshStandardMaterial({
    color: variant.hullColor,
    roughness: 0.52,
    metalness: 0.16,
  })
  const redHullMaterial = new THREE.MeshStandardMaterial({
    color: variant.lowerHullColor,
    roughness: 0.56,
    metalness: 0.1,
  })
  const deckMaterial = new THREE.MeshStandardMaterial({
    color: variant.deckColor,
    roughness: 0.58,
    metalness: 0.08,
  })
  const hatchMaterial = new THREE.MeshStandardMaterial({
    color: variant.hatchColor,
    roughness: 0.44,
    metalness: 0.22,
  })
  const accentDeckMaterial = new THREE.MeshStandardMaterial({
    color: variant.accentDeckColor ?? variant.deckColor,
    roughness: 0.5,
    metalness: 0.08,
  })
  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.32,
    metalness: 0.48,
  })
  const safetyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.42,
    metalness: 0.08,
  })
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x0e7490,
    roughness: 0.18,
    metalness: 0.15,
    emissive: 0x083344,
    emissiveIntensity: 0.2,
  })
  // Shared offset that seats deck elements flush against the hull.
  const deckDrop = 0.06

  const hull = new THREE.Mesh(
    createHullGeometry({
      length: variant.length,
      beam: variant.beam,
      deckY: 0.66,
      keelY: -0.26,
      bowInset: variant.bowInset,
      sternInset: variant.sternInset,
    }),
    hullMaterial
  )
  hull.position.y = 0.28
  hull.castShadow = true
  hull.receiveShadow = true
  group.add(hull)

  const lowerHull = new THREE.Mesh(
    createHullGeometry({
      length: variant.length - 0.55,
      beam: variant.beam - 0.34,
      deckY: 0.08,
      keelY: -0.3,
      bowInset: Math.max(variant.bowInset - 0.14, 0.72),
      sternInset: Math.max(variant.sternInset - 0.04, 0.14),
    }),
    redHullMaterial
  )
  lowerHull.position.y = 0.18
  lowerHull.castShadow = true
  lowerHull.receiveShadow = true
  group.add(lowerHull)

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(variant.length - 1.3, 0.12, variant.beam - 0.3),
    deckMaterial
  )
  deck.position.set(-0.08, 0.98 - deckDrop, 0)
  deck.castShadow = true
  deck.receiveShadow = true
  group.add(deck)

  const sternDeckX = -(variant.length / 2 - 0.9)

  // Creates a raised aft working deck so the stern reads more clearly as a tanker.
  addBox(
    group,
    [variant.sternDeckLength, 0.14, variant.beam - 0.18],
    [sternDeckX, 1.07 - deckDrop, 0],
    deckMaterial
  )

  const hatchSpacing = (variant.length - 3.6) / Math.max(variant.hatchCount - 1, 1)

  for (let index = 0; index < variant.hatchCount; index += 1) {
    const hatch = new THREE.Mesh(
      new THREE.BoxGeometry(variant.hatchWidth, 0.08, variant.hatchDepth),
      hatchMaterial
    )
    hatch.position.set(variant.length / 2 - 1.85 - index * hatchSpacing, 1.08 - deckDrop, 0)
    hatch.castShadow = true
    hatch.receiveShadow = true
    group.add(hatch)
  }

  addCylinder(group, 0.035, variant.length - 2.55, [0.05, 1.26 - deckDrop, 0], [0, 0, Math.PI / 2], pipeMaterial)

  if (variant.pipeRows >= 2) {
    addCylinder(group, 0.024, variant.length - 3.1, [0.1, 1.17 - deckDrop, -(variant.beam / 2 - 0.36)], [0, 0, Math.PI / 2], pipeMaterial)
    addCylinder(group, 0.024, variant.length - 3.1, [0.1, 1.17 - deckDrop, variant.beam / 2 - 0.36], [0, 0, Math.PI / 2], pipeMaterial)
  }

  if (variant.pipeRows === 3) {
    addCylinder(group, 0.018, variant.length - 3.55, [0.1, 1.34 - deckDrop, -(variant.beam / 2 - 0.46)], [0, 0, Math.PI / 2], pipeMaterial)
    addCylinder(group, 0.018, variant.length - 3.55, [0.1, 1.34 - deckDrop, variant.beam / 2 - 0.46], [0, 0, Math.PI / 2], pipeMaterial)
  }
  addCylinder(group, 0.026, 1.02, [0.72, 1.27 - deckDrop, 0], [Math.PI / 2, 0, 0], pipeMaterial)
  addCylinder(group, 0.026, 1.02, [-0.38, 1.27 - deckDrop, 0], [Math.PI / 2, 0, 0], pipeMaterial)

  // Adds a short raised forecastle deck so the bow feels more substantial and tanker-like.
  addBox(
    group,
    [variant.forecastleLength, 0.14, variant.beam - 0.28],
    [variant.length / 2 - 1.06, 1.07 - deckDrop, 0],
    accentDeckMaterial
  )

  // Places small bow equipment blocks to visually balance the heavier stern section.
  addBox(
    group,
    [0.42 * variant.bowEquipmentScale, 0.18, 0.42 * variant.bowEquipmentScale],
    [variant.length / 2 - 0.92, 1.2 - deckDrop, 0],
    hatchMaterial
  )
  addBox(
    group,
    [0.34 * variant.bowEquipmentScale, 0.12, 0.24 * variant.bowEquipmentScale],
    [variant.length / 2 - 0.54, 1.17 - deckDrop, 0],
    safetyMaterial
  )

  const railZ = variant.beam / 2 - variant.railInset

  for (const z of [-railZ, railZ]) {
    addBox(group, [variant.length - 2.05, 0.055, 0.055], [-0.15, 1.2 - deckDrop, z], pipeMaterial)
    addBox(group, [0.055, 0.34, 0.055], [variant.length / 2 - 1.25, 1.08 - deckDrop, z], pipeMaterial)
    addBox(group, [0.055, 0.34, 0.055], [-(variant.length / 2 - 1), 1.08 - deckDrop, z], pipeMaterial)
  }

  // Adds an aft rail across the stern edge to frame the raised working deck.
  addBox(
    group,
    [0.055, 0.34, variant.beam - 0.18],
    [-(variant.length / 2 - 0.11), 1.08 - deckDrop, 0],
    pipeMaterial
  )

  // Adds a matching rail across the foredeck edge to frame the bow equipment area.
  addBox(
    group,
    [0.055, 0.28, variant.beam - 0.28],
    [variant.length / 2 - 0.42, 1.08 - deckDrop, 0],
    pipeMaterial
  )

  addBox(group, [variant.bridgeWidth, 0.62, variant.bridgeDepth], [variant.bridgeX, 1.34 - deckDrop, 0], deckMaterial)
  addBox(
    group,
    [variant.bridgeWidth - 0.19, 0.52, variant.bridgeDepth - 0.14],
    [variant.bridgeX - 0.06, 1.88 - deckDrop, 0],
    deckMaterial
  )

  // Builds up the machinery area behind the bridge, which is typical on tankers.
  addBox(
    group,
    [
      Math.max((variant.bridgeWidth - 0.13) * variant.aftEquipmentScale, 0.72),
      0.22,
      variant.beam - 0.34,
    ],
    [variant.bridgeX - 0.42, 1.18 - deckDrop, 0],
    hatchMaterial
  )

  if (variant.upperBridgeLevels === 2) {
    addBox(
        group,
        [0.62, 0.32, 0.58],
        [variant.bridgeX - 0.11, 2.28 - deckDrop, 0],
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.45,
        metalness: 0.06,
      })
    )
  }

  for (let index = 0; index < 4; index += 1) {
    addBox(group, [0.07, 0.12, 0.12], [variant.bridgeX + 0.43, 1.9 - deckDrop, -0.3 + index * 0.2], windowMaterial)

    if (variant.upperBridgeLevels === 2) {
      addBox(group, [0.07, 0.1, 0.1], [variant.bridgeX + 0.49, 2.29 - deckDrop, -0.22 + index * 0.15], windowMaterial)
    }
  }

  const funnel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.68, 20),
    new THREE.MeshStandardMaterial({
      color: variant.funnelColor,
      roughness: 0.38,
      metalness: 0.18,
    })
  )
  funnel.position.set(variant.bridgeX - 0.5, 1.75 - deckDrop, 0.28)
  funnel.castShadow = true
  group.add(funnel)

  if (variant.hasTwinFunnels) {
    const secondFunnel = funnel.clone()
    secondFunnel.position.z = -0.28
    group.add(secondFunnel)
  }

  // Adds compact industrial details around the aft deck to strengthen the tanker silhouette.
  addCylinder(
    group,
    0.045 * variant.aftEquipmentScale,
    0.72 * variant.aftEquipmentScale,
    [variant.bridgeX - 0.58, 1.28 - deckDrop, -0.34],
    [0, 0, Math.PI / 2],
    pipeMaterial
  )
  addCylinder(
    group,
    0.045 * variant.aftEquipmentScale,
    0.72 * variant.aftEquipmentScale,
    [variant.bridgeX - 0.58, 1.28 - deckDrop, 0.34],
    [0, 0, Math.PI / 2],
    pipeMaterial
  )
  addCylinder(
    group,
    0.07 * variant.aftEquipmentScale,
    0.46 * variant.aftEquipmentScale,
    [variant.bridgeX - 0.95, 1.39 - deckDrop, -0.22],
    [0, 0, 0],
    pipeMaterial
  )

  // Adds deck vents and utility details commonly visible on tanker cargo decks.
  for (const station of variant.ventStations) {
    const x = variant.length / 2 - station
    addCylinder(group, 0.055, 0.22, [x, 1.28 - deckDrop, -0.43], [0, 0, 0], pipeMaterial)
    addCylinder(group, 0.055, 0.22, [x, 1.28 - deckDrop, 0.43], [0, 0, 0], pipeMaterial)
  }

  // Adds small crossover pipes and safety posts to make the cargo deck feel more functional.
  addCylinder(
    group,
    0.022,
    variant.beam - 0.34,
    [variant.length / 2 - 2.45, 1.3 - deckDrop, 0],
    [Math.PI / 2, 0, 0],
    pipeMaterial
  )
  if (variant.hasCenterManifold) {
    addCylinder(
      group,
      0.022,
      variant.beam - 0.34,
      [variant.bridgeX + 1.02, 1.3 - deckDrop, 0],
      [Math.PI / 2, 0, 0],
      pipeMaterial
    )
  }
  addBox(
    group,
    [0.08, 0.24, 0.08],
    [variant.length / 2 - 1.42, 1.2 - deckDrop, -(variant.beam / 2 - 0.16)],
    safetyMaterial
  )
  addBox(
    group,
    [0.08, 0.24, 0.08],
    [variant.length / 2 - 1.42, 1.2 - deckDrop, variant.beam / 2 - 0.16],
    safetyMaterial
  )
  addCylinder(
    group,
    0.07 * variant.aftEquipmentScale,
    0.46 * variant.aftEquipmentScale,
    [variant.bridgeX - 0.95, 1.39 - deckDrop, 0.22],
    [0, 0, 0],
    pipeMaterial
  )

  const lifeboatZ = variant.beam / 2 - 0.07

  for (const z of [-lifeboatZ, lifeboatZ]) {
    const lifeboat = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.1, 0.48, 4, 12),
      safetyMaterial
    )
    lifeboat.rotation.z = Math.PI / 2
    lifeboat.position.set(variant.bridgeX + 0.37, 1.58 - deckDrop, z)
    lifeboat.castShadow = true
    group.add(lifeboat)
  }

  addCylinder(group, 0.022, 1.18, [variant.mastX, 1.58 - deckDrop, 0], [0, 0, 0], pipeMaterial)
  addBox(group, [0.56, 0.035, 0.12], [variant.mastX, 2.18 - deckDrop, 0], pipeMaterial)
  addCylinder(group, 0.018, 0.92, [variant.bridgeX - 0.67, 1.75 - deckDrop, -0.18], [0, 0, 0], pipeMaterial)
  addBox(group, [0.42, 0.035, 0.1], [variant.bridgeX - 0.67, 2.22 - deckDrop, -0.18], pipeMaterial)

  return group
}

function createHullGeometry({
  length,
  beam,
  deckY,
  keelY,
  bowInset,
  sternInset,
}: {
  length: number
  beam: number
  deckY: number
  keelY: number
  bowInset: number
  sternInset: number
}) {
  // Converts tanker dimensions into a side profile that is extruded across the beam.
  const halfLength = length / 2
  const shape = new THREE.Shape()

  // Builds a flatter tanker-style side profile with a long deck line,
  // a fuller bow, and a gently curved lower hull.
  shape.moveTo(-halfLength + 0.04, keelY + 0.2)
  shape.quadraticCurveTo(
    -halfLength + 0.01,
    keelY + 0.34,
    -halfLength + sternInset,
    deckY
  )
  shape.lineTo(halfLength - bowInset, deckY)
  shape.lineTo(halfLength - 0.18, deckY + 0.03)
  shape.quadraticCurveTo(
    halfLength - 0.02,
    deckY - 0.04,
    halfLength - 0.04,
    keelY + 0.26
  )
  shape.quadraticCurveTo(
    halfLength - 0.18,
    keelY + 0.08,
    halfLength - 0.72,
    keelY
  )
  shape.lineTo(-halfLength + 0.78, keelY)
  shape.quadraticCurveTo(
    -halfLength + 0.2,
    keelY + 0.01,
    -halfLength + 0.04,
    keelY + 0.2
  )

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: beam,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 2,
  })
  geometry.center()
  geometry.computeVertexNormals()

  return geometry
}

function addBox(
  group: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material
) {
  // Shared helper for box meshes with consistent shadow settings.
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
}

function addCylinder(
  group: THREE.Group,
  radius: number,
  length: number,
  position: [number, number, number],
  rotation: [number, number, number],
  material: THREE.Material
) {
  // Shared helper for cylindrical meshes with consistent shadow settings.
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 16),
    material
  )
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
}
