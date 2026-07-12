import 'dotenv/config'

import express from 'express'

import { hashPassword, signToken, verifyPassword, verifyToken } from './auth.mjs'
import { deserializeShip, openDatabase } from './db.mjs'
import { seedDatabase } from './seed.mjs'

const app = express()
const db = openDatabase()
const port = Number(process.env.API_PORT ?? 4000)
const sessionDurationMs = 1000 * 60 * 60 * 8

app.use(express.json())

function readBearerToken(header) {
  const [scheme, token] = String(header ?? '').split(' ')

  return scheme?.toLowerCase() === 'bearer' && token ? token : null
}

// Middleware for protected endpoints.
// It reads the Bearer token, verifies the signed token, and attaches the
// logged-in user to req.user so route handlers can trust the request.
function requireAuth(req, res, next) {
  const token = readBearerToken(req.headers.authorization)
  const session = verifyToken(token)

  if (!session) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  req.user = session.user
  return next()
}

app.get('/api/health', (_req, res) => {
  // Simple health check used to confirm that the API process is running.
  res.json({ ok: true })
})

function measurementStatus(value, threshold) {
  return value < threshold.min_value || value > threshold.max_value ? 'alert' : 'normal'
}

function getThresholds() {
  return db
    .prepare('SELECT metric, label, unit, min_value, max_value FROM measurement_thresholds ORDER BY metric')
    .all()
}

function getMeasurementsForShip(shipId) {
  return db
    .prepare(
      `SELECT id, ship_id, metric, measured_at, value
       FROM ship_measurements
       WHERE ship_id = ?
       ORDER BY measured_at, metric`
    )
    .all(shipId)
}

function getLatestMeasurements(shipId) {
  return db
    .prepare(
      `SELECT sm.id, sm.ship_id, sm.metric, sm.measured_at, sm.value
       FROM ship_measurements sm
       INNER JOIN (
         SELECT metric, MAX(measured_at) AS measured_at
         FROM ship_measurements
         WHERE ship_id = ?
         GROUP BY metric
       ) latest
         ON latest.metric = sm.metric AND latest.measured_at = sm.measured_at
       WHERE sm.ship_id = ?
       ORDER BY sm.metric`
    )
    .all(shipId, shipId)
}

function buildAlerts(shipId) {
  const args = []
  let shipFilter = ''

  if (shipId) {
    shipFilter = 'WHERE sm.ship_id = ?'
    args.push(shipId)
  }

  return db
    .prepare(
      `SELECT
         sm.id,
         sm.ship_id,
         s.name AS ship_name,
         sm.metric,
         mt.label,
         mt.unit,
         mt.min_value,
         mt.max_value,
         sm.measured_at,
         sm.value
       FROM ship_measurements sm
       JOIN ships s ON s.id = sm.ship_id
       JOIN measurement_thresholds mt ON mt.metric = sm.metric
       ${shipFilter}
       ORDER BY sm.measured_at DESC, s.name, mt.label`
    )
    .all(...args)
    .filter((measurement) => measurementStatus(measurement.value, measurement) === 'alert')
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body ?? {}

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email and password are required.' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)

  if (existingUser) {
    return res.status(409).json({ error: 'A user with this email already exists.' })
  }

  const passwordHash = await hashPassword(password)
  const result = db
    .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
    .run(normalizedEmail, passwordHash, String(name).trim())

  const userSession = {
    id: Number(result.lastInsertRowid),
    email: normalizedEmail,
    name: String(name).trim(),
  }

  const token = signToken({
    user: userSession,
    expiresAt: Date.now() + sessionDurationMs,
  })

  return res.status(201).json({ token, user: userSession })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {}

  // Validate the request body before touching the database.
  // This gives the frontend a clear error when either field is missing.
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const user = db
    .prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?')
    .get(normalizedEmail)

  // Use the same response for an unknown email and a wrong password.
  // That avoids revealing which admin emails exist in the database.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  // The token only stores safe user fields, never the password hash.
  // expiresAt lets verifyToken reject old sessions without database lookup.
  const userSession = { id: user.id, email: user.email, name: user.name }
  const token = signToken({
    user: userSession,
    expiresAt: Date.now() + sessionDurationMs,
  })

  res.json({ token, user: userSession })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  // Returns the current session user after requireAuth has validated the token.
  res.json({ user: req.user })
})

app.get('/api/dashboard', requireAuth, (req, res) => {
  const ships = db.prepare('SELECT * FROM ships ORDER BY id').all().map(deserializeShip)
  const requestedShipId = Number(req.query.shipId)
  const selectedShip =
    ships.find((ship) => ship.id === requestedShipId) ?? ships[0] ?? null

  if (!selectedShip) {
    return res.json({
      ships: [],
      selectedShip: null,
      thresholds: [],
      measurements: [],
      latestMeasurements: [],
      alerts: [],
    })
  }

  const thresholds = getThresholds()
  const thresholdByMetric = Object.fromEntries(
    thresholds.map((threshold) => [threshold.metric, threshold])
  )
  const measurements = getMeasurementsForShip(selectedShip.id).map((measurement) => ({
    ...measurement,
    status: measurementStatus(measurement.value, thresholdByMetric[measurement.metric]),
  }))
  const latestMeasurements = getLatestMeasurements(selectedShip.id).map((measurement) => ({
    ...measurement,
    status: measurementStatus(measurement.value, thresholdByMetric[measurement.metric]),
  }))
  const alerts = buildAlerts(selectedShip.id)

  return res.json({
    ships: ships.map((ship) => ({ id: ship.id, name: ship.name })),
    selectedShip,
    thresholds,
    measurements,
    latestMeasurements,
    alerts,
  })
})

app.get('/api/alerts', requireAuth, (req, res) => {
  const shipId = req.query.shipId ? Number(req.query.shipId) : null

  res.json({ alerts: buildAlerts(shipId) })
})

app.get('/api/ships', requireAuth, (_req, res) => {
  // Ships are stored in SQLite with chart arrays serialized as JSON strings.
  // deserializeShip converts them back to arrays before sending the response.
  const ships = db.prepare('SELECT * FROM ships ORDER BY id').all().map(deserializeShip)

  res.json({ ships })
})

app.get('/api/ships/:id', requireAuth, (req, res) => {
  // Route params arrive as strings, so convert the ship id before querying.
  const ship = db.prepare('SELECT * FROM ships WHERE id = ?').get(Number(req.params.id))

  if (!ship) {
    return res.status(404).json({ error: 'Ship not found.' })
  }

  return res.json({ ship: deserializeShip(ship) })
})

seedDatabase(db)
  .then(() => {
    // Start listening only after the database is ready.
    // seedDatabase creates tables and imports initial ships.
    app.listen(port, () => {
      console.log(`Ship API listening at http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
