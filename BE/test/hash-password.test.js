import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { scryptSync, timingSafeEqual } from 'node:crypto'

test('hash-password prints scrypt:<salt hex>:<hash hex> that verifies', () => {
  const out = execFileSync('node', ['scripts/hash-password.js'], { input: 'hunter2\n', stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim()
  const [scheme, salt, hash] = out.split(':')
  assert.equal(scheme, 'scrypt')
  assert.match(salt, /^[0-9a-f]{32}$/)
  assert.match(hash, /^[0-9a-f]{128}$/)
  const expected = Buffer.from(hash, 'hex')
  assert.ok(timingSafeEqual(scryptSync('hunter2', Buffer.from(salt, 'hex'), 64), expected))
  assert.ok(!timingSafeEqual(scryptSync('wrong', Buffer.from(salt, 'hex'), 64), expected))
})
