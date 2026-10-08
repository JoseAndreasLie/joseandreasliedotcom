import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const GOOD = { JWT_SECRET: 'a'.repeat(32), ADMIN_PASSWORD_HASH: 'scrypt:00:00' }
const run = (patch) => {
  const env = { ...process.env, ...GOOD, PORT: '0', ...patch }
  for (const k of Object.keys(patch)) if (patch[k] === undefined) delete env[k]
  return spawnSync('node', ['src/index.js'], { env, encoding: 'utf8', timeout: 5000 })
}

const bad = {
  'JWT_SECRET missing': { JWT_SECRET: undefined },
  'ADMIN_PASSWORD_HASH missing': { ADMIN_PASSWORD_HASH: undefined },
  'JWT_SECRET shorter than 32': { JWT_SECRET: 'a'.repeat(31) },
  'JWT_SECRET is the placeholder': { JWT_SECRET: 'change-me-long-random-string-xxxxxxxx' },
}
for (const [name, patch] of Object.entries(bad)) {
  test(`index.js exits 1 when ${name}`, () => {
    const r = run(patch)
    assert.equal(r.status, 1)
    assert.match(r.stderr, new RegExp(Object.keys(patch)[0]))
  })
}
