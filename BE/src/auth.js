import { scryptSync, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'

// ADMIN_PASSWORD_HASH = scrypt:<salt hex>:<64-byte hash hex>. Malformed hash => always false.
export function checkPassword(pw) {
  if (typeof pw !== 'string' || !pw) return false
  const [scheme, s, h, extra] = String(process.env.ADMIN_PASSWORD_HASH).split(':')
  const hex = /^(?:[0-9a-f]{2})+$/i
  if (scheme !== 'scrypt' || extra !== undefined || !hex.test(s ?? '') || !hex.test(h ?? '')) return false
  const expected = Buffer.from(h, 'hex')
  if (expected.length !== 64) return false
  return timingSafeEqual(scryptSync(pw, Buffer.from(s, 'hex'), 64), expected)
}

export const signToken = () => jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' })

export function requireAuth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.get('authorization') ?? '')
  try {
    if (!m) throw new Error()
    jwt.verify(m[1], process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
}
