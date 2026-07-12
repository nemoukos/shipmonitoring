import fs from 'node:fs'
import path from 'node:path'

import { serializeShip } from './db.mjs'

const baselineDate = new Date('2026-05-01T00:00:00Z')
const dayInMs = 24 * 60 * 60 * 1000
const thresholds = [
  { metric: 'speed', label: 'Speed', unit: 'kn', min_value: 8, max_value: 18 },
  { metric: 'fuel', label: 'Fuel', unit: '%', min_value: 30, max_value: 100 },
  {
    metric: 'temperature',
    label: 'Temperature',
    unit: 'C',
    min_value: 0,
    max_value: 44,
  },
]
const belowLimitMeasurements = [
  { shipId: 2, metric: 'fuel', measuredAt: '2026-05-07T00:00:00.000Z', value: 24 },
  { shipId: 7, metric: 'speed', measuredAt: '2026-05-07T00:00:00.000Z', value: 6 },
  { shipId: 9, metric: 'fuel', measuredAt: '2026-05-08T00:00:00.000Z', value: 18 },
]

// Loads the existing static ship data.
// This lets the new API reuse the same ship dataset that the frontend already
// had before the SQLite database was added.
function readSeedShips() {
  const shipsPath = path.join(process.cwd(), 'src', 'data', 'ships.json')

  return JSON.parse(fs.readFileSync(shipsPath, 'utf8'))
}

function measurementDate(index) {
  return new Date(baselineDate.getTime() + index * dayInMs).toISOString()
}

export async function seedDatabase(db) {
  const seedShips = readSeedShips()
  const shipCount = db.prepare('SELECT COUNT(*) AS count FROM ships').get().count

  // Insert the initial ships only when the table is empty.
  // This avoids duplicating rows every time the API restarts.
  if (shipCount === 0) {
    const insertShip = db.prepare(`
      INSERT INTO ships (id, name, image, origin, destination, lat, lng, speed, fuel, temperature)
      VALUES (:id, :name, :image, :origin, :destination, :lat, :lng, :speed, :fuel, :temperature)
    `)

    for (const ship of seedShips) {
      insertShip.run(serializeShip(ship))
    }
  }

  const thresholdCount = db
    .prepare('SELECT COUNT(*) AS count FROM measurement_thresholds')
    .get().count

  if (thresholdCount === 0) {
    const insertThreshold = db.prepare(`
      INSERT INTO measurement_thresholds (metric, label, unit, min_value, max_value)
      VALUES (:metric, :label, :unit, :min_value, :max_value)
    `)

    for (const threshold of thresholds) {
      insertThreshold.run(threshold)
    }
  }

  const measurementCount = db
    .prepare('SELECT COUNT(*) AS count FROM ship_measurements')
    .get().count

  if (measurementCount === 0) {
    const insertMeasurement = db.prepare(`
      INSERT INTO ship_measurements (ship_id, metric, measured_at, value)
      VALUES (?, ?, ?, ?)
    `)

    for (const ship of seedShips) {
      for (const metric of ['speed', 'fuel', 'temperature']) {
        for (const [index, value] of ship[metric].entries()) {
          insertMeasurement.run(ship.id, metric, measurementDate(index), value)
        }
      }
    }
  }

  const belowLimitCount = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM ship_measurements sm
       JOIN measurement_thresholds mt ON mt.metric = sm.metric
       WHERE sm.value < mt.min_value`
    )
    .get().count

  if (belowLimitCount === 0) {
    const insertMeasurement = db.prepare(`
      INSERT INTO ship_measurements (ship_id, metric, measured_at, value)
      VALUES (?, ?, ?, ?)
    `)

    for (const measurement of belowLimitMeasurements) {
      insertMeasurement.run(
        measurement.shipId,
        measurement.metric,
        measurement.measuredAt,
        measurement.value
      )
    }
  }
}
