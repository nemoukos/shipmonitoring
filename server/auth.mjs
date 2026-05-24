import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)
const keyLength = 64

// Reads the secret used to sign session tokens.
// The API refuses to start with a missing or placeholder secret because anyone
// with this value can create valid session tokens.
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET

  if (!secret || secret.length < 32 || secret === 'replace-with-a-long-random-secret') {
    throw new Error('Set SESSION_SECRET in .env to a random value with at least 32 characters.')
  }

  return secret
}

function base64url(input) {
  // base64url is safe to place in tokens because it avoids characters like "/".
  return Buffer.from(input).toString('base64url')
}

// Hashes a password before saving it.
// A new random salt is generated for each password, then stored next to the
// derived key as "salt:hash" so verification can repeat the same process later.
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url')
  const derivedKey = await scrypt(password, salt, keyLength)

  return `${salt}:${derivedKey.toString('base64url')}`
}

// Checks a submitted password against the stored "salt:hash" value.
// timingSafeEqual prevents tiny timing differences from revealing whether parts
// of the hash matched.
export async function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':')

  if (!salt || !key) {
    return false
  }

  const derivedKey = await scrypt(password, salt, keyLength)
  const storedKey = Buffer.from(key, 'base64url')

  return storedKey.length === derivedKey.length && crypto.timingSafeEqual(storedKey, derivedKey)
}

// Creates a compact session token.
// The payload is readable JSON, but the HMAC signature proves that the server
// created it and that the payload was not changed by the browser.
export function signToken(payload) {
  const body = base64url(JSON.stringify(payload))
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(body).digest('base64url')

  return `${body}.${signature}`
}

// Validates a session token from the cookie.
// It rejects malformed tokens, tokens with the wrong signature, and tokens past
// their expiresAt timestamp. A valid token returns the original payload.
export function verifyToken(token) {
  if (!token || !token.includes('.')) {
    return null
  }

  const [body, signature] = token.split('.')
  const expectedSignature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(body)
    .digest('base64url')
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))

  if (!payload.expiresAt || Date.now() > payload.expiresAt) {
    return null
  }

  return payload
}
