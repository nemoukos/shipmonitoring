import type { Ship } from '@/types/ship'

export type MeasurementStatus = 'normal' | 'alert'

export type MeasurementThreshold = {
  metric: string
  label: string
  unit: string
  min_value: number
  max_value: number
}

export type ShipMeasurement = {
  id: number
  ship_id: number
  metric: string
  measured_at: string
  value: number
  status: MeasurementStatus
}

export type ShipAlert = {
  id: number
  ship_id: number
  ship_name: string
  metric: string
  label: string
  unit: string
  min_value: number
  max_value: number
  measured_at: string
  value: number
}

export type DashboardShipOption = {
  id: number
  name: string
}

export type DashboardData = {
  ships: DashboardShipOption[]
  selectedShip: Ship | null
  thresholds: MeasurementThreshold[]
  measurements: ShipMeasurement[]
  latestMeasurements: ShipMeasurement[]
  alerts: ShipAlert[]
}
