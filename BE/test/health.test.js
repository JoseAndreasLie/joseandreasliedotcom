import { test } from 'node:test'
import assert from 'node:assert/strict'
import { app } from '../src/app.js'

test('GET /api/health returns { ok: true }', async (t) => {
  const server = app.listen(0)
  t.after(() => server.close())
  const res = await fetch(`http://localhost:${server.address().port}/api/health`)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true })
})
