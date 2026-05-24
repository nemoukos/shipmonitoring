import 'dotenv/config'

import express from 'express'

import { signToken, verifyPassword, verifyToken } from './auth.mjs'
import { deserializeShip, openDatabase } from './db.mjs'
import { seedDatabase } from './seed.mjs'

const app = express()
const db = openDatabase()
const port = Number(process.env.API_PORT ?? 4000)
const cookieName = process.env.SESSION_COOKIE_NAME ?? 'ship_session'
const sessionDurationMs = 1000 * 60 * 60 * 8

app.use(express.json())

// Reads one cookie value from the raw Cookie header.
// Express does not parse cookies by itself here, so this helper converts
// "name=value; other=value" into an object and returns the requested cookie.
function readCookie(header, name) {
  return Object.fromEntries(
    String(header ?? '')
      .split(';')
      .map((cookie) => cookie.trim().split('='))
      .filter(([key, value]) => key && value)
  )[name]
}

// Middleware for protected endpoints.
// It reads the session cookie, verifies the signed token, and attaches the
// logged-in user to req.user so route handlers can trust the request.
function requireAuth(req, res, next) {
  const session = verifyToken(readCookie(req.headers.cookie, cookieName))

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

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {}

  // Validate the request body before touching the database.
  // This gives the frontend a clear error when either field is missing.
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const user = db.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').get(email)

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
    // seedDatabase creates tables, imports initial ships, and creates/updates
    // the admin user from the .env credentials.
    app.listen(port, () => {
      console.log(`Ship API listening at http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
