// Describes the shape of one vessel record loaded from ships.json.
export type Ship = {
  // Optional note stored in sample data records for documentation purposes.
  _comment?: string
  // Stable numeric identifier used in routes, charts, and lookups.
  id: number
  // Human-readable vessel name shown throughout the UI.
  name: string
  // Preview image path used in the map overlay card.
  image: string
  // Port where the sample voyage begins.
  origin: string
  // Port where the sample voyage ends.
  destination: string
  // Current geographic latitude used by the map marker.
  lat: number
  // Current geographic longitude used by the map marker.
  lng: number
  // Historical speed samples in knots.
  speed: number[]
  // Historical fuel percentage samples.
  fuel: number[]
  // Historical temperature samples in Celsius.
  temperature: number[]
}
