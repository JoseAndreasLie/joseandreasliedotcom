import { test } from 'node:test'
import assert from 'node:assert/strict'
import { start, sequelize } from './helpers.js'

test.after(() => sequelize.close())

test('GET /api/health returns { ok: true }', async (t) => {
  const r = await start(t)('/api/health')
  assert.equal(r.status, 200)
  assert.deepEqual(r.body, { ok: true })
})
