import { describe, test, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { start, auth, pool, dbSkip } from './helpers.js'

const skip = await dbSkip()
if (skip) console.log(`SKIP works tests: ${skip}`)

const work = (o = {}) => ({ slug: 'lombok-film', type: 'video', title: 'Lombok', ...o })
async function insert(o) {
  const w = work(o)
  const { rows } = await pool.query(
    'INSERT INTO works (slug, type, title, published, date, body) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [w.slug, w.type, w.title, w.published ?? false, w.date ?? '2026-01-01', w.body ?? 'body text'])
  return rows[0]
}

describe('works API', { skip }, () => {
  let api
  before(() => { api = start() })
  beforeEach(() => pool.query('TRUNCATE works RESTART IDENTITY'))
  after(() => { api.server.close(); return pool.end() })

  describe('public', () => {
    test('list returns published only, newest date first, without body', async () => {
      await insert({ slug: 'old', published: true, date: '2025-01-01' })
      await insert({ slug: 'new', published: true, date: '2026-02-01' })
      await insert({ slug: 'draft', published: false, date: '2026-03-01' })
      const r = await api('/api/works')
      assert.equal(r.status, 200)
      assert.deepEqual(r.body.map((w) => w.slug), ['new', 'old'])
      assert.ok(!('body' in r.body[0]))
      assert.equal(r.body[0].date, '2026-02-01')
    })

    test('list filters by type and rejects unknown type', async () => {
      await insert({ slug: 'v', type: 'video', published: true })
      await insert({ slug: 'p', type: 'photo', published: true })
      assert.deepEqual((await api('/api/works?type=photo')).body.map((w) => w.slug), ['p'])
      const bad = await api('/api/works?type=nope')
      assert.equal(bad.status, 400)
      assert.ok(bad.body.error)
    })

    test('slug returns published work with body; draft and missing are 404', async () => {
      await insert({ slug: 'pub', published: true, body: '# hi' })
      await insert({ slug: 'draft', published: false })
      const ok = await api('/api/works/pub')
      assert.equal(ok.status, 200)
      assert.equal(ok.body.body, '# hi')
      for (const s of ['draft', 'missing']) {
        const r = await api(`/api/works/${s}`)
        assert.equal(r.status, 404)
        assert.ok(r.body.error)
      }
    })
  })

  describe('auth', () => {
    const bad = [
      ['no token', {}],
      ['garbage token', { authorization: 'Bearer nope' }],
      ['wrong secret', { authorization: `Bearer ${jwt.sign({ sub: 'admin' }, 'other')}` }],
      ['alg none', { authorization: `Bearer ${jwt.sign({ sub: 'admin' }, null, { algorithm: 'none' })}` }],
      ['expired', { authorization: `Bearer ${jwt.sign({ sub: 'admin', exp: 1 }, 'test-secret')}` }],
    ]
    for (const [name, headers] of bad) {
      test(`writes and admin list are 401 with ${name}`, async () => {
        const w = await insert({})
        for (const [method, path] of [['POST', '/api/works'], ['PUT', `/api/works/${w.id}`], ['DELETE', `/api/works/${w.id}`], ['GET', '/api/admin/works']]) {
          const r = await api(path, { method, headers, json: method === 'GET' || method === 'DELETE' ? undefined : work({ slug: 'x' }) })
          assert.equal(r.status, 401, `${method} ${path}`)
          assert.ok(r.body.error)
        }
        assert.equal((await pool.query('SELECT count(*)::int AS n FROM works')).rows[0].n, 1)
      })
    }

    test('admin list includes drafts', async () => {
      await insert({ slug: 'a', published: true })
      await insert({ slug: 'b', published: false })
      const r = await api('/api/admin/works', { headers: auth })
      assert.equal(r.status, 200)
      assert.deepEqual(r.body.map((w) => w.slug).sort(), ['a', 'b'])
    })
  })

  describe('CRUD', () => {
    test('create, update, delete happy path', async () => {
      const full = work({
        summary: 's', body: 'b', cover_url: '/media/abc.webp',
        media: [
          { kind: 'image', url: '/media/x.webp', thumb_url: '/media/x_thumb.webp', alt: 'x' },
          { kind: 'embed', url: 'https://www.youtube.com/embed/abc' },
          { kind: 'embed', url: 'https://player.vimeo.com/video/1' },
        ],
        links: [{ label: 'Site', url: 'https://example.com' }],
        tags: ['travel'], shot_on: 'SONY FX3', date: '2026-01-31', published: true,
      })
      const c = await api('/api/works', { method: 'POST', headers: auth, json: full })
      assert.equal(c.status, 201)
      assert.equal(c.body.slug, 'lombok-film')
      assert.equal(c.body.date, '2026-01-31')
      assert.deepEqual(c.body.media, full.media)
      assert.deepEqual(c.body.tags, ['travel'])
      assert.equal((await api('/api/works/lombok-film')).status, 200)

      const u = await api(`/api/works/${c.body.id}`, { method: 'PUT', headers: auth, json: { ...full, title: 'New', published: false } })
      assert.equal(u.status, 200)
      assert.equal(u.body.title, 'New')
      assert.ok(new Date(u.body.updated_at) > new Date(c.body.updated_at))
      assert.equal((await api('/api/works/lombok-film')).status, 404)

      const d = await api(`/api/works/${c.body.id}`, { method: 'DELETE', headers: auth })
      assert.equal(d.status, 204)
      assert.equal((await api(`/api/works/${c.body.id}`, { method: 'DELETE', headers: auth })).status, 404)
    })

    test('create applies defaults for optional fields', async () => {
      const r = await api('/api/works', { method: 'POST', headers: auth, json: work() })
      assert.equal(r.status, 201)
      assert.equal(r.body.summary, '')
      assert.equal(r.body.published, false)
      assert.deepEqual(r.body.media, [])
      assert.match(r.body.date, /^\d{4}-\d{2}-\d{2}$/)
    })

    test('duplicate slug is 409 on create and update', async () => {
      await insert({ slug: 'taken' })
      const other = await insert({ slug: 'other' })
      assert.equal((await api('/api/works', { method: 'POST', headers: auth, json: work({ slug: 'taken' }) })).status, 409)
      assert.equal((await api(`/api/works/${other.id}`, { method: 'PUT', headers: auth, json: work({ slug: 'taken' }) })).status, 409)
    })

    test('update/delete of missing or non-numeric id', async () => {
      assert.equal((await api('/api/works/999', { method: 'PUT', headers: auth, json: work() })).status, 404)
      assert.equal((await api('/api/works/abc', { method: 'DELETE', headers: auth })).status, 404)
    })
  })

  describe('validation (400)', () => {
    const cases = {
      'bad type': { type: 'film' },
      'bad slug uppercase': { slug: 'Bad-Slug' },
      'bad slug double dash': { slug: 'a--b' },
      'missing title': { title: '' },
      'missing slug': { slug: undefined },
      'embed from evil host': { media: [{ kind: 'embed', url: 'https://evil.com/embed/x' }] },
      'embed lookalike host': { media: [{ kind: 'embed', url: 'https://youtube.com.evil.com/x' }] },
      'embed over http': { media: [{ kind: 'embed', url: 'http://www.youtube.com/embed/x' }] },
      'embed javascript url': { media: [{ kind: 'embed', url: 'javascript:alert(1)' }] },
      'unknown media kind': { media: [{ kind: 'video', url: 'https://www.youtube.com/embed/x' }] },
      'image without thumb': { media: [{ kind: 'image', url: '/media/x.webp', alt: '' }] },
      'image javascript url': { media: [{ kind: 'image', url: 'javascript:x', thumb_url: '/media/x.webp', alt: '' }] },
      'media not array': { media: 'x' },
      'link javascript url': { links: [{ label: 'x', url: 'javascript:alert(1)' }] },
      'link missing label': { links: [{ url: 'https://a.com' }] },
      'tags not strings': { tags: [1] },
      'bad date': { date: '2026-13-45' },
      'published not boolean': { published: 'yes' },
      'cover javascript url': { cover_url: 'javascript:x' },
      'cover over http': { cover_url: 'http://example.com/a.webp' },
      'image url over http': { media: [{ kind: 'image', url: 'http://example.com/a.webp', thumb_url: '/media/x.webp', alt: '' }] },
      'youtube non-embed path': { media: [{ kind: 'embed', url: 'https://www.youtube.com/watch?v=x' }] },
      'bare vimeo.com': { media: [{ kind: 'embed', url: 'https://vimeo.com/123' }] },
      'player.vimeo.com non-video path': { media: [{ kind: 'embed', url: 'https://player.vimeo.com/123' }] },
      'NUL in title': { title: 'a\u0000b' },
      'NUL in body': { body: 'a\u0000b' },
      'NUL in tag': { tags: ['a\u0000'] },
      'NUL in alt': { media: [{ kind: 'image', url: '/media/x.webp', thumb_url: '/media/x.webp', alt: '\u0000' }] },
      'title > 200': { title: 'x'.repeat(201) },
      'summary > 500': { summary: 'x'.repeat(501) },
      'slug > 100': { slug: 'a'.repeat(101) },
      'shot_on > 100': { shot_on: 'x'.repeat(101) },
      'body > 100000': { body: 'x'.repeat(100_001) },
      'tags > 30': { tags: Array(31).fill('t') },
      'tag > 50': { tags: ['x'.repeat(51)] },
      'media > 50': { media: Array(51).fill({ kind: 'embed', url: 'https://www.youtube.com/embed/x' }) },
      'links > 20': { links: Array(21).fill({ label: 'a', url: 'https://a.com' }) },
      'alt > 200': { media: [{ kind: 'image', url: '/media/x.webp', thumb_url: '/media/x.webp', alt: 'x'.repeat(201) }] },
      'label > 200': { links: [{ label: 'x'.repeat(201), url: 'https://a.com' }] },
      'url > 2048': { links: [{ label: 'a', url: `https://a.com/${'x'.repeat(2048)}` }] },
    }
    for (const [name, patch] of Object.entries(cases)) {
      test(name, async () => {
        const r = await api('/api/works', { method: 'POST', headers: auth, json: work(patch) })
        assert.equal(r.status, 400)
        assert.equal(typeof r.body.error, 'string')
      })
    }

    test('limits are inclusive and allowed embeds/images pass', async () => {
      const r = await api('/api/works', { method: 'POST', headers: auth, json: work({
        slug: 'a'.repeat(100), title: 'x'.repeat(200), summary: 'x'.repeat(500), body: 'x'.repeat(100_000), shot_on: 'x'.repeat(100),
        tags: Array(30).fill('x'.repeat(50)), links: Array(20).fill({ label: 'x'.repeat(200), url: 'https://a.com' }),
        cover_url: 'https://cdn.example.com/a.webp',
        media: [
          ...['www.youtube.com', 'youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].map((h) => ({ kind: 'embed', url: `https://${h}/embed/abc` })),
          { kind: 'embed', url: 'https://player.vimeo.com/video/1' },
          ...Array(45).fill({ kind: 'image', url: '/media/x.webp', thumb_url: '/media/x_thumb.webp', alt: 'x'.repeat(200) }),
        ],
      }) })
      assert.equal(r.status, 201, r.body?.error)
    })

    test('PUT validates too (bad embed host)', async () => {
      const w = await insert({})
      const r = await api(`/api/works/${w.id}`, { method: 'PUT', headers: auth, json: work({ media: [{ kind: 'embed', url: 'https://evil.com/x' }] }) })
      assert.equal(r.status, 400)
    })
  })

  describe('errors', () => {
    test('unknown /api route is JSON 404', async () => {
      const r = await api('/api/nope')
      assert.equal(r.status, 404)
      assert.ok(r.body.error)
    })

    test('malformed JSON is 400', async () => {
      const r = await api('/api/works', { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: '{bad' })
      assert.equal(r.status, 400)
      assert.ok(r.body.error)
    })

    test('JSON body over 1MB is 413', async () => {
      const r = await api('/api/works', { method: 'POST', headers: auth, json: work({ body: 'x'.repeat(1024 * 1024 + 1) }) })
      assert.equal(r.status, 413)
      assert.ok(r.body.error)
    })

    test('no x-powered-by header', async () => {
      assert.equal((await api('/api/health')).headers.get('x-powered-by'), null)
    })

    test('CORS allows only CORS_ORIGIN', async () => {
      const ok = await api('/api/health', { headers: { origin: 'https://jose.web.id' } })
      assert.equal(ok.headers.get('access-control-allow-origin'), 'https://jose.web.id')
      const no = await api('/api/health', { headers: { origin: 'https://evil.com' } })
      assert.notEqual(no.headers.get('access-control-allow-origin'), 'https://evil.com')
      assert.notEqual(no.headers.get('access-control-allow-origin'), '*')
    })
  })
})
