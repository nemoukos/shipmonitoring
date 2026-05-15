export type Ship = {
  _comment?: string
  id: number
  name: string
  image: string
  origin: string
  destination: string
  lat: number
  lng: number
  speed: number[]
  fuel: number[]
  temperature: number[]
}
