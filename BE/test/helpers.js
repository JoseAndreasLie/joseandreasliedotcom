// Shared test setup. Sets env BEFORE importing the app (db.js reads DATABASE_URL at import).
import { randomBytes, scryptSync } from 'node:crypto'
import { readFileSync } from 'node:fs'
import jwt from 'jsonwebtoken'

export const PASSWORD = 'correct horse'
const salt = randomBytes(16)
process.env.ADMIN_PASSWORD_HASH = `scrypt:${salt.toString('hex')}:${scryptSync(PASSWORD, salt, 64).toString('hex')}`
process.env.JWT_SECRET = 'test-secret'
process.env.CORS_ORIGIN = 'https://jose.web.id'
process.env.MINIO_BUCKET = 'works'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://localhost/jose_test'

const { createApp } = await import('../src/app.js')
export const { pool } = await import('../src/db.js')

export const token = jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' })
export const auth = { authorization: `Bearer ${token}` }

// Starts a fresh app (fresh rate limiter) on a random port; returns a fetch helper bound to it.
export function start(t, opts) {
  const server = createApp(opts).listen(0)
  t?.after(() => server.close())
  const base = `http://localhost:${server.address().port}`
  const api = async (path, { json, headers, ...init } = {}) => {
    if (json !== undefined) {
      init.body = JSON.stringify(json)
      headers = { 'content-type': 'application/json', ...headers }
    }
    const res = await fetch(base + path, { ...init, headers })
    const text = await res.text()
    return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null }
  }
  api.server = server
  return api
}

// Applies schema; returns a skip reason string if no DB is reachable, else false.
export async function dbSkip() {
  try {
    await pool.query(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'))
    return false
  } catch (e) {
    await pool.end()
    return `no test DB reachable at ${process.env.DATABASE_URL} (${e.code || e.message}); set TEST_DATABASE_URL or run: createdb jose_test`
  }
}
