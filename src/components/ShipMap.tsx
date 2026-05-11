'use client'

import { useState } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import ships from '@/data/ships.json'
import type { Ship } from '@/types/ship'

const typedShips = ships as Ship[]

const mapCenter: [number, number] = [37.9838, 23.7275]
const mapBounds: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180],
]

const detailedShipZoom = 11
const smallShipSize = {
  width: 40,
  height: 28,
}
const largeShipSize = {
  width: 72,
  height: 42,
}

function latestValue(values: number[]) {
  return values[values.length - 1]
}

function shipSizeForZoom(zoom: number) {
  return zoom >= detailedShipZoom ? largeShipSize : smallShipSize
}

function shipSvg(width: number, height: number) {
  return `
    <div style="
      width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.55));
    ">
      <svg viewBox="0 0 96 56" width="${width}" height="${height}" aria-hidden="true">
        <path d="M14 28h68l-8 16H24L14 28Z" fill="#0f172a" stroke="#67e8f9" stroke-width="3" />
        <path d="M31 16h34l6 12H25l6-12Z" fill="#f8fafc" stroke="#67e8f9" stroke-width="3" />
        <path d="M43 7h19l5 9H38l5-9Z" fill="#22d3ee" stroke="#67e8f9" stroke-width="3" />
        <path d="M30 44h36" stroke="#22d3ee" stroke-width="4" stroke-linecap="round" />
        <circle cx="36" cy="24" r="3" fill="#0891b2" />
        <circle cx="48" cy="24" r="3" fill="#0891b2" />
        <circle cx="60" cy="24" r="3" fill="#0891b2" />
      </svg>
    </div>
  `
}

function createShipIcon(zoom: number) {
  const { width, height } = shipSizeForZoom(zoom)

  return L.divIcon({
    className: '',
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
    popupAnchor: [0, -height / 2],
    html: shipSvg(width, height),
  })
}

function useCurrentZoom() {
  const map = useMapEvents({
    zoomend() {
      setZoom(map.getZoom())
    },
  })
  const [zoom, setZoom] = useState(map.getZoom())

  return zoom
}

function ShipPopup({
  ship,
}: {
  ship: Ship
}) {
  return (
    <Popup>
      <div>
        <h2>{ship.name}</h2>

        <p>Latitude: {ship.lat}</p>

        <p>Longitude: {ship.lng}</p>

        <p>Fuel: {latestValue(ship.fuel)}%</p>

        <p>Temperature: {latestValue(ship.temperature)}&deg;C</p>
      </div>
    </Popup>
  )
}

function ShipMarkers() {
  const zoom = useCurrentZoom()
  const shipIcon = createShipIcon(zoom)

  return (
    <>
      {typedShips.map((ship) => (
        <Marker
          key={ship.id}
          position={[ship.lat, ship.lng]}
          icon={shipIcon}
        >
          <ShipPopup ship={ship} />
        </Marker>
      ))}
    </>
  )
}

export default function ShipMap() {
  return (
    <MapContainer
      center={mapCenter}
      zoom={6}
      minZoom={3}
      maxZoom={18}
      maxBounds={mapBounds}
      maxBoundsViscosity={1}
      style={{
        height: '90vh',
        width: '100%',
      }}
    >
      <TileLayer
        attribution="Tiles &copy; Esri"
        noWrap
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      <ShipMarkers />
    </MapContainer>
  )
}
