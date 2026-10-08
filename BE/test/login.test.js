import { test } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { start, PASSWORD, pool } from './helpers.js'

test.after(() => pool.end())
const login = (api, password) => api('/api/login', { method: 'POST', json: { password } })

test('correct password returns a 7d HS256 token', async (t) => {
  const r = await login(start(t), PASSWORD)
  assert.equal(r.status, 200)
  const { header, payload } = jwt.verify(r.body.token, 'test-secret', { algorithms: ['HS256'], complete: true })
  assert.equal(header.alg, 'HS256')
  assert.equal(payload.exp - payload.iat, 7 * 24 * 3600)
})

test('wrong or missing password is 401', async (t) => {
  const api = start(t)
  for (const pw of ['wrong', '', undefined, 123]) {
    const r = await login(api, pw)
    assert.equal(r.status, 401, String(pw))
    assert.ok(r.body.error)
    assert.ok(!r.body.token)
  }
})

test('malformed ADMIN_PASSWORD_HASH rejects instead of crashing', async (t) => {
  const saved = process.env.ADMIN_PASSWORD_HASH
  t.after(() => { process.env.ADMIN_PASSWORD_HASH = saved })
  const api = start(t)
  for (const h of ['garbage', 'scrypt:zz:zz', 'scrypt:00:00', `${saved}00`]) {
    process.env.ADMIN_PASSWORD_HASH = h
    assert.equal((await login(api, PASSWORD)).status, 401, h)
  }
})

test('6th login attempt within the window is 429 (even with the right password)', async (t) => {
  const api = start(t)
  for (let i = 0; i < 5; i++) assert.equal((await login(api, 'wrong')).status, 401)
  const r = await login(api, PASSWORD)
  assert.equal(r.status, 429)
  assert.ok(r.body.error)
})
