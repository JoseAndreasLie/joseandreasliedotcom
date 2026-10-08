import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { start, auth, pool } from './helpers.js'

test.after(() => pool.end())

function fakeStorage() {
  const puts = []
  return { puts, putObject: async (bucket, name, buf, size, meta) => { puts.push({ bucket, name, buf, size, meta }) } }
}
const png = (width, height = 100) => sharp({ create: { width, height, channels: 3, background: '#888' } }).png().toBuffer()
const form = (buf, type, name = 'a.png') => { const f = new FormData(); f.append('file', new Blob([buf], { type }), name); return f }
const upload = (api, body, headers = auth) => api('/api/upload', { method: 'POST', headers, body })

test('upload requires auth', async (t) => {
  const storage = fakeStorage()
  const r = await upload(start(t, { storage }), form(await png(10), 'image/png'), {})
  assert.equal(r.status, 401)
  assert.equal(storage.puts.length, 0)
})

test('no file is 400', async (t) => {
  const r = await upload(start(t, { storage: fakeStorage() }), new FormData())
  assert.equal(r.status, 400)
  assert.ok(r.body.error)
})

test('non-image mimetype is 400', async (t) => {
  const r = await upload(start(t, { storage: fakeStorage() }), form(Buffer.from('hello'), 'text/plain', 'a.txt'))
  assert.equal(r.status, 400)
})

test('image mimetype with undecodable bytes is 400', async (t) => {
  const r = await upload(start(t, { storage: fakeStorage() }), form(Buffer.from('not really a png'), 'image/png'))
  assert.equal(r.status, 400)
})

test('file over 20MB is 413', async (t) => {
  const r = await upload(start(t, { storage: fakeStorage() }), form(Buffer.alloc(20 * 1024 * 1024 + 1), 'image/png'))
  assert.equal(r.status, 413)
})

test('image is stored as 1600px webp + 600px thumb and /media urls returned', async (t) => {
  const storage = fakeStorage()
  const r = await upload(start(t, { storage }), form(await png(2400, 1200), 'image/png'))
  assert.equal(r.status, 201)
  const m = r.body.url.match(/^\/media\/([a-z0-9-]+)\.webp$/)
  assert.ok(m, r.body.url)
  assert.equal(r.body.thumb_url, `/media/${m[1]}_thumb.webp`)
  assert.deepEqual(storage.puts.map((p) => [p.bucket, p.name]), [['works', `${m[1]}.webp`], ['works', `${m[1]}_thumb.webp`]])
  const [full, thumb] = await Promise.all(storage.puts.map((p) => sharp(p.buf).metadata()))
  assert.deepEqual([full.format, full.width, full.height], ['webp', 1600, 800])
  assert.deepEqual([thumb.format, thumb.width], ['webp', 600])
  assert.equal(storage.puts[0].meta['Content-Type'], 'image/webp')
})

test('small images are not enlarged', async (t) => {
  const storage = fakeStorage()
  assert.equal((await upload(start(t, { storage }), form(await png(300), 'image/png'))).status, 201)
  const widths = await Promise.all(storage.puts.map(async (p) => (await sharp(p.buf).metadata()).width))
  assert.deepEqual(widths, [300, 300])
})

test('image over 50M pixels is 400', async (t) => {
  const storage = fakeStorage()
  const big = await sharp({ create: { width: 7100, height: 7100, channels: 3, background: '#000' } }).png().toBuffer()
  const r = await upload(start(t, { storage }), form(big, 'image/png'))
  assert.equal(r.status, 400)
  assert.equal(storage.puts.length, 0)
})

test('storage failure is a JSON 500 without internals', async (t) => {
  const storage = { putObject: async () => { throw new Error('S3 secret-ish detail') } }
  const r = await upload(start(t, { storage }), form(await png(10), 'image/png'))
  assert.equal(r.status, 500)
  assert.deepEqual(r.body, { error: 'internal error' })
})
