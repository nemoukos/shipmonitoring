'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type Ship3DViewerProps = {
  shipName: string
}

export default function Ship3DViewer({
  shipName,
}: Ship3DViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current

    if (!mount) {
      return
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x06111f)
    scene.fog = new THREE.Fog(0x06111f, 18, 42)

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    )
    camera.position.set(7.5, 3.8, 7.2)

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

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 4
    controls.maxDistance = 18
    controls.maxPolarAngle = Math.PI / 2.05
    controls.target.set(0, 0.75, 0)

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

    const grid = new THREE.GridHelper(80, 40, 0x38bdf8, 0x155e75)
    grid.position.y = -0.1
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.07
    scene.add(grid)

    const shipModel = createOilTanker(shipName)
    shipModel.rotation.y = -Math.PI / 5
    shipModel.position.y = 0.18
    scene.add(shipModel)

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
  }, [shipName])

  return (
    <div
      ref={mountRef}
      aria-label={`${shipName} 3D viewer`}
      className="h-full min-h-[calc(100vh-64px)] w-full"
    />
  )
}

function createOilTanker(shipName: string) {
  const group = new THREE.Group()
  group.name = shipName

  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1120,
    roughness: 0.52,
    metalness: 0.16,
  })
  const redHullMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    roughness: 0.56,
    metalness: 0.1,
  })
  const deckMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.58,
    metalness: 0.08,
  })
  const hatchMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.44,
    metalness: 0.22,
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

  const hull = new THREE.Mesh(
    createHullGeometry({
      length: 8.4,
      beam: 1.48,
      deckY: 0.66,
      keelY: -0.26,
      bowInset: 0.92,
      sternInset: 0.42,
    }),
    hullMaterial
  )
  hull.position.y = 0.28
  hull.castShadow = true
  hull.receiveShadow = true
  group.add(hull)

  const lowerHull = new THREE.Mesh(
    createHullGeometry({
      length: 7.85,
      beam: 1.14,
      deckY: 0.08,
      keelY: -0.3,
      bowInset: 0.8,
      sternInset: 0.38,
    }),
    redHullMaterial
  )
  lowerHull.position.y = 0.18
  lowerHull.castShadow = true
  lowerHull.receiveShadow = true
  group.add(lowerHull)

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(7.1, 0.12, 1.18),
    deckMaterial
  )
  deck.position.set(-0.08, 0.98, 0)
  deck.castShadow = true
  deck.receiveShadow = true
  group.add(deck)

  for (let index = 0; index < 6; index += 1) {
    const hatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.08, 0.82),
      hatchMaterial
    )
    hatch.position.set(2.35 - index * 0.78, 1.08, 0)
    hatch.castShadow = true
    hatch.receiveShadow = true
    group.add(hatch)
  }

  addCylinder(group, 0.035, 5.85, [0.05, 1.26, 0], [0, 0, Math.PI / 2], pipeMaterial)
  addCylinder(group, 0.024, 5.25, [0.1, 1.17, -0.38], [0, 0, Math.PI / 2], pipeMaterial)
  addCylinder(group, 0.024, 5.25, [0.1, 1.17, 0.38], [0, 0, Math.PI / 2], pipeMaterial)
  addCylinder(group, 0.026, 1.02, [0.72, 1.27, 0], [Math.PI / 2, 0, 0], pipeMaterial)
  addCylinder(group, 0.026, 1.02, [-0.38, 1.27, 0], [Math.PI / 2, 0, 0], pipeMaterial)

  for (const z of [-0.66, 0.66]) {
    addBox(group, [6.35, 0.055, 0.055], [-0.15, 1.2, z], pipeMaterial)
    addBox(group, [0.055, 0.34, 0.055], [2.95, 1.08, z], pipeMaterial)
    addBox(group, [0.055, 0.34, 0.055], [-3.25, 1.08, z], pipeMaterial)
  }

  addBox(group, [1.05, 0.62, 0.88], [-3.05, 1.34, 0], deckMaterial)
  addBox(group, [0.86, 0.52, 0.74], [-3.11, 1.88, 0], deckMaterial)
  addBox(
    group,
    [0.62, 0.32, 0.58],
    [-3.16, 2.28, 0],
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45,
      metalness: 0.06,
    })
  )

  for (let index = 0; index < 4; index += 1) {
    addBox(group, [0.07, 0.12, 0.12], [-2.62, 1.9, -0.3 + index * 0.2], windowMaterial)
    addBox(group, [0.07, 0.1, 0.1], [-2.56, 2.29, -0.22 + index * 0.15], windowMaterial)
  }

  const funnel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.68, 20),
    new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.38,
      metalness: 0.18,
    })
  )
  funnel.position.set(-3.55, 1.75, 0.28)
  funnel.castShadow = true
  group.add(funnel)

  for (const z of [-0.67, 0.67]) {
    const lifeboat = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.1, 0.48, 4, 12),
      safetyMaterial
    )
    lifeboat.rotation.z = Math.PI / 2
    lifeboat.position.set(-2.68, 1.58, z)
    lifeboat.castShadow = true
    group.add(lifeboat)
  }

  addCylinder(group, 0.022, 1.18, [2.95, 1.58, 0], [0, 0, 0], pipeMaterial)
  addBox(group, [0.56, 0.035, 0.12], [2.95, 2.18, 0], pipeMaterial)
  addCylinder(group, 0.018, 0.92, [-3.72, 1.75, -0.18], [0, 0, 0], pipeMaterial)
  addBox(group, [0.42, 0.035, 0.1], [-3.72, 2.22, -0.18], pipeMaterial)

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
  const halfLength = length / 2
  const shape = new THREE.Shape()

  shape.moveTo(-halfLength, keelY + 0.2)
  shape.lineTo(-halfLength + sternInset, deckY)
  shape.lineTo(halfLength - bowInset, deckY)
  shape.quadraticCurveTo(halfLength - 0.24, deckY - 0.04, halfLength, keelY + 0.16)
  shape.lineTo(halfLength - 0.8, keelY)
  shape.lineTo(-halfLength + 0.55, keelY)
  shape.lineTo(-halfLength, keelY + 0.2)

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
