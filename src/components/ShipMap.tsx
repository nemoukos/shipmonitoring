'use client'

import { useEffect, useState } from 'react'
import L from 'leaflet'
import Image from 'next/image'
import {
  Circle,
  CircleMarker,
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  Tooltip,
  useMap,
  TileLayer,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import ships from '@/data/ships.json'
import type { Ship } from '@/types/ship'

const typedShips = ships as Ship[]

const mapCenter: [number, number] = [22, 25]
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
const selectedShipZoom = 12
const routeColors = [
  '#22d3ee',
  '#38bdf8',
  '#a78bfa',
  '#f59e0b',
  '#34d399',
  '#fb7185',
  '#60a5fa',
  '#facc15',
  '#c084fc',
  '#2dd4bf',
]

type MapPoint = {
  name: string
  position: [number, number]
}

type WeatherPoint = MapPoint & {
  wind: string
  waves: string
}

const portPoints: MapPoint[] = [
  { name: 'Port of Houston', position: [29.735, -95.265] },
  { name: 'Port of Rotterdam', position: [51.95, 4.14] },
  { name: 'Port of Ras Tanura', position: [26.641, 50.16] },
  { name: 'Port of Fujairah', position: [25.173, 56.363] },
  { name: 'Port of Singapore', position: [1.265, 103.82] },
  { name: 'Suez Canal', position: [30.585, 32.265] },
  { name: 'Port of Ceyhan', position: [36.879, 35.929] },
  { name: 'Port of Basrah', position: [30.515, 47.819] },
  { name: 'Port of Ningbo-Zhoushan', position: [29.868, 121.544] },
  { name: 'Port of Gibraltar', position: [36.14, -5.353] },
]

const highTrafficZone = {
  name: 'High traffic zone',
  center: [37.9, 23.9] as [number, number],
  radius: 65000,
}

const restrictedOperationsArea = {
  name: 'Restricted operations area',
  positions: [
    [35.2, 17.4],
    [36.4, 18.2],
    [36.0, 20.0],
    [34.9, 19.0],
  ] as [number, number][],
}

const weatherPoints: WeatherPoint[] = [
  {
    name: 'Aegean weather',
    position: [37.35, 25.2],
    wind: 'NW 22 kn',
    waves: '1.8 m',
  },
  {
    name: 'Ionian weather',
    position: [38.3, 18.8],
    wind: 'W 16 kn',
    waves: '1.2 m',
  },
  {
    name: 'Black Sea weather',
    position: [43.7, 30.1],
    wind: 'NE 28 kn',
    waves: '2.4 m',
  },
]

const geofences = [
  {
    name: 'Piraeus approach geofence',
    positions: [
      [37.55, 23.35],
      [38.15, 23.45],
      [38.1, 24.3],
      [37.45, 24.25],
    ] as [number, number][],
  },
  {
    name: 'Adriatic monitoring geofence',
    positions: [
      [41.7, 15.4],
      [45.6, 13.1],
      [45.9, 14.9],
      [42.4, 17.2],
    ] as [number, number][],
  },
]

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

function portPositionByName(name: string) {
  return portPoints.find((port) => port.name === name)?.position
}

function routeForShip(ship: Ship) {
  const origin = portPositionByName(ship.origin)
  const destination = portPositionByName(ship.destination)
  const current: [number, number] = [ship.lat, ship.lng]

  return [origin, current, destination].filter(Boolean) as [number, number][]
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
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null)

  return (
    <LayerGroup>
      {typedShips.map((ship) => (
        <Marker
          key={ship.id}
          position={[ship.lat, ship.lng]}
          icon={shipIcon}
          eventHandlers={{
            click: () => setSelectedShip(ship),
          }}
        >
          <ShipPopup ship={ship} />
        </Marker>
      ))}

      <SelectedShipFocus ship={selectedShip} />
      <ShipInfoOverlay
        ship={selectedShip}
        onClose={() => setSelectedShip(null)}
      />
    </LayerGroup>
  )
}

function ShipRoutes() {
  return (
    <LayerGroup>
      {typedShips.map((ship, index) => (
        <Polyline
          key={ship.id}
          pathOptions={{
            color: routeColors[index % routeColors.length],
            dashArray: '8 10',
            weight: 3,
          }}
          positions={routeForShip(ship)}
        >
          <Tooltip sticky>{ship.name} route</Tooltip>
        </Polyline>
      ))}
    </LayerGroup>
  )
}

function DangerZones() {
  return (
    <LayerGroup>
      <Circle
        center={highTrafficZone.center}
        pathOptions={{
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: 0.18,
          weight: 2,
        }}
        radius={highTrafficZone.radius}
      >
        <Popup>{highTrafficZone.name}</Popup>
      </Circle>

      <Polygon
        pathOptions={{
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.18,
          weight: 2,
        }}
        positions={restrictedOperationsArea.positions}
      >
        <Popup>{restrictedOperationsArea.name}</Popup>
      </Polygon>
    </LayerGroup>
  )
}

function WeatherLayer() {
  return (
    <LayerGroup>
      {weatherPoints.map((point) => (
        <CircleMarker
          key={point.name}
          center={point.position}
          pathOptions={{
            color: '#60a5fa',
            fillColor: '#0ea5e9',
            fillOpacity: 0.45,
            weight: 2,
          }}
          radius={18}
        >
          <Popup>
            <div>
              <h2>{point.name}</h2>
              <p>Wind: {point.wind}</p>
              <p>Waves: {point.waves}</p>
            </div>
          </Popup>
          <Tooltip>{point.wind}</Tooltip>
        </CircleMarker>
      ))}
    </LayerGroup>
  )
}

function PortsLayer() {
  return (
    <LayerGroup>
      {portPoints.map((port) => (
        <CircleMarker
          key={port.name}
          center={port.position}
          pathOptions={{
            color: '#facc15',
            fillColor: '#facc15',
            fillOpacity: 0.85,
            weight: 2,
          }}
          radius={7}
        >
          <Popup>{port.name}</Popup>
          <Tooltip>{port.name}</Tooltip>
        </CircleMarker>
      ))}
    </LayerGroup>
  )
}

function AisLines() {
  return (
    <LayerGroup>
      {typedShips.map((ship, index) => (
        <Polyline
          key={ship.id}
          pathOptions={{
            color: '#ec4899',
            dashArray: '2 8',
            weight: 2,
          }}
          positions={[
            [ship.lat, ship.lng],
            [ship.lat + 0.35 + index * 0.08, ship.lng + 0.5],
          ]}
        >
          <Tooltip sticky>{ship.name} AIS track</Tooltip>
        </Polyline>
      ))}
    </LayerGroup>
  )
}

function GeofencesLayer() {
  return (
    <LayerGroup>
      {geofences.map((geofence) => (
        <Polygon
          key={geofence.name}
          pathOptions={{
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.1,
            weight: 2,
          }}
          positions={geofence.positions}
        >
          <Popup>{geofence.name}</Popup>
        </Polygon>
      ))}
    </LayerGroup>
  )
}

function SelectedShipFocus({
  ship,
}: {
  ship: Ship | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!ship) {
      return
    }

    map.flyTo([ship.lat, ship.lng], selectedShipZoom, {
      duration: 0.9,
    })
  }, [map, ship])

  return null
}

function MetricPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-cyan-300/20 bg-slate-950/60 px-3 py-2">
      <p className="text-xs uppercase text-slate-400">
        {label}
      </p>

      <p className="text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

function ShipInfoOverlay({
  ship,
  onClose,
}: {
  ship: Ship | null
  onClose: () => void
}) {
  if (!ship) {
    return null
  }

  const latestSpeed = latestValue(ship.speed)
  const latestFuel = latestValue(ship.fuel)
  const latestTemperature = latestValue(ship.temperature)

  return (
    <aside className="pointer-events-auto absolute left-4 right-4 top-4 z-[500] max-w-md rounded-lg border border-cyan-300/30 bg-slate-950/90 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur md:left-auto md:w-[360px]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-200">
            Selected vessel
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            {ship.name}
          </h2>
        </div>

        <button
          type="button"
          aria-label="Close ship details"
          className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/10 text-lg leading-none transition hover:bg-white/20"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricPill label="Speed" value={`${latestSpeed} kn`} />
        <MetricPill label="Fuel" value={`${latestFuel}%`} />
        <MetricPill label="Temp" value={`${latestTemperature}°C`} />
      </div>

      <a
        href={`/ships/${ship.id}/3d`}
        className="group relative mt-4 block overflow-hidden rounded-md border border-white/10 bg-slate-900"
      >
        <Image
          src={ship.image}
          alt={`Fictional vessel preview for ${ship.name}`}
          width={640}
          height={360}
          className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <span className="absolute bottom-2 right-2 rounded bg-slate-950/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 shadow-lg shadow-black/30 transition group-hover:bg-cyan-300 group-hover:text-slate-950">
          View in 3D
        </span>
      </a>

      <div className="mt-4 grid gap-2 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">From</span>
          <span className="text-right">{ship.origin}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-slate-400">To</span>
          <span className="text-right">{ship.destination}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Latitude</span>
          <span>{ship.lat.toFixed(4)}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Longitude</span>
          <span>{ship.lng.toFixed(4)}</span>
        </div>
      </div>
    </aside>
  )
}

export default function ShipMap() {
  return (
    <div className="relative h-[90vh] w-full overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={3}
        minZoom={2}
        maxZoom={18}
        maxBounds={mapBounds}
        maxBoundsViscosity={1}
        worldCopyJump
        className="h-full w-full"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Street">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Tiles: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              maxNativeZoom={17}
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Ships">
            <ShipMarkers />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Ship routes">
            <ShipRoutes />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Danger zones">
            <DangerZones />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Weather, wind, waves">
            <WeatherLayer />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Ports">
            <PortsLayer />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="AIS lines">
            <AisLines />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Geofences">
            <GeofencesLayer />
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  )
}
