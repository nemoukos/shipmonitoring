import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

const databaseDir = path.join(process.cwd(), 'server', 'data')
const databasePath = path.join(databaseDir, 'ship-map.sqlite')

// Creates the local database folder when the API starts for the first time.
// The SQLite file lives inside server/data so the API can run without any
// external database service.
function ensureDatabaseDir() {
  fs.mkdirSync(databaseDir, { recursive: true })
}

export function openDatabase() {
  ensureDatabaseDir()

  const db = new DatabaseSync(databasePath)
  // Create the tables if they do not exist yet.
  // CREATE TABLE IF NOT EXISTS makes this safe to run every time the API starts.
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ships (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed TEXT NOT NULL,
      fuel TEXT NOT NULL,
      temperature TEXT NOT NULL
    );
  `)

  return db
}

// Converts a ship object from the frontend/data-file shape into the database shape.
// SQLite stores the speed, fuel, and temperature chart arrays as JSON text
// because those columns contain structured values rather than single numbers.
export function serializeShip(ship) {
  return {
    id: ship.id,
    name: ship.name,
    image: ship.image,
    origin: ship.origin,
    destination: ship.destination,
    lat: ship.lat,
    lng: ship.lng,
    speed: JSON.stringify(ship.speed),
    fuel: JSON.stringify(ship.fuel),
    temperature: JSON.stringify(ship.temperature),
  }
}

// Converts a ship row from SQLite back into the shape expected by the frontend.
// Without this step, chart components would receive JSON strings instead of arrays.
export function deserializeShip(ship) {
  return {
    ...ship,
    speed: JSON.parse(ship.speed),
    fuel: JSON.parse(ship.fuel),
    temperature: JSON.parse(ship.temperature),
  }
}
