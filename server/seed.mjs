import fs from 'node:fs'
import path from 'node:path'

import { hashPassword } from './auth.mjs'
import { serializeShip } from './db.mjs'

// Loads the existing static ship data.
// This lets the new API reuse the same ship dataset that the frontend already
// had before the SQLite database was added.
function readSeedShips() {
  const shipsPath = path.join(process.cwd(), 'src', 'data', 'ships.json')

  return JSON.parse(fs.readFileSync(shipsPath, 'utf8'))
}

export async function seedDatabase(db) {
  const shipCount = db.prepare('SELECT COUNT(*) AS count FROM ships').get().count

  // Insert the initial ships only when the table is empty.
  // This avoids duplicating rows every time the API restarts.
  if (shipCount === 0) {
    const insertShip = db.prepare(`
      INSERT INTO ships (id, name, image, origin, destination, lat, lng, speed, fuel, temperature)
      VALUES (:id, :name, :image, :origin, :destination, :lat, :lng, :speed, :fuel, :temperature)
    `)

    for (const ship of readSeedShips()) {
      insertShip.run(serializeShip(ship))
    }
  }

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  // The protected endpoints need an admin account before anyone can log in.
  // Credentials come from .env so real passwords are never committed to the repo.
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before starting the API.')
  }

  const passwordHash = await hashPassword(password)
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email)

  // Create the admin user on the first run.
  // On later runs, update the password hash so changing ADMIN_PASSWORD in .env
  // immediately changes the login password after restarting the API.
  if (!existingUser) {
    db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(
      email,
      passwordHash,
      'Admin'
    )

    return
  }

  db.prepare('UPDATE users SET password_hash = ?, name = ? WHERE email = ?').run(
    passwordHash,
    'Admin',
    email
  )
}
