// Projects and products share the crud() router, so one suite covers both; works.test.js holds the deep validation cases.
import { describe, test, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { start, auth, pool, dbSkip } from './helpers.js'

const skip = await dbSkip()
if (skip) console.log(`SKIP content tests: ${skip}`)

const resources = {
  projects: {
    valid: (o = {}) => ({ slug: 'antarbul', title: 'AntarBul', ...o }),
    heavy: 'body',
    full: {
      year: 2025, company: 'Hex & Code', role: 'Lead Backend Engineer', summary: 's', body: '# b',
      cover_url: '/media/c.webp', tags: ['Node.js'], notes: [{ label: 'Key insight', text: 't' }],
      links: [{ label: 'Repo', url: 'https://github.com/x' }], featured: true, position: 2,
    },
    invalid: {
      'missing title': { title: '' },
      'bad year': { year: 1800 },
      'year as string': { year: '2025' },
      'note without label': { notes: [{ text: 'x' }] },
      'position not integer': { position: 1.5 },
    },
  },
  products: {
    valid: (o = {}) => ({ slug: 'splitter', name: 'Splitter', ...o }),
    heavy: 'writeup',
    full: {
      tagline: 't', url: 'https://splitter.jose.web.id', status: 'Live', stack: ['React'], role: 'r', summary: 's',
      writeup: 'para one\n\npara two', screenshot_desktop: '/media/d.webp', screenshot_mobile: '/media/m.webp',
      case_study: { problem: 'p', architecture: null }, featured: true,
    },
    invalid: {
      'missing name': { name: '' },
      'bad status': { status: 'Beta' },
      'url javascript': { url: 'javascript:alert(1)' },
      'screenshot over http': { screenshot_desktop: 'http://a.com/x.webp' },
      'case_study not object': { case_study: 'x' },
      'stack not strings': { stack: [1] },
    },
  },
}

describe('content API', { skip }, () => {
  let api
  before(() => { api = start() })
  after(() => { api.server.close(); return pool.end() })

  for (const [path, r] of Object.entries(resources)) {
    describe(path, () => {
      beforeEach(() => pool.query(`TRUNCATE ${path} RESTART IDENTITY`))
      const post = (json) => api(`/api/${path}`, { method: 'POST', headers: auth, json })

      test('create applies defaults; public list hides drafts and the heavy field', async () => {
        const c = await post(r.valid())
        assert.equal(c.status, 201, c.body?.error)
        assert.equal(c.body.published, false)
        assert.equal(c.body.position, 0)
        assert.deepEqual((await api(`/api/${path}`)).body, [])
        assert.equal((await api(`/api/${path}/${c.body.slug}`)).status, 404)

        const u = await api(`/api/${path}/${c.body.id}`, { method: 'PUT', headers: auth, json: r.valid({ ...r.full, published: true }) })
        assert.equal(u.status, 200, u.body?.error)
        const list = (await api(`/api/${path}`)).body
        assert.equal(list.length, 1)
        assert.ok(!(r.heavy in list[0]))
        const one = await api(`/api/${path}/${c.body.slug}`)
        assert.equal(one.status, 200)
        for (const [k, v] of Object.entries(r.full)) assert.deepEqual(one.body[k], v, k)
      })

      test('list is ordered by position', async () => {
        await post(r.valid({ slug: 'b', position: 2, published: true }))
        await post(r.valid({ slug: 'a', position: 1, published: true }))
        assert.deepEqual((await api(`/api/${path}`)).body.map((x) => x.slug), ['a', 'b'])
      })

      test('admin list needs auth and includes drafts', async () => {
        await post(r.valid())
        assert.equal((await api(`/api/admin/${path}`)).status, 401)
        assert.equal((await api(`/api/${path}`, { method: 'POST', json: r.valid({ slug: 'y' }) })).status, 401)
        await post(r.valid({ slug: 'x', published: true }))
        assert.equal((await api(`/api/admin/${path}`, { headers: auth })).body.length, 2)
      })

      test('duplicate slug 409, missing id 404, delete 204', async () => {
        const c = await post(r.valid())
        assert.equal((await post(r.valid())).status, 409)
        assert.equal((await api(`/api/${path}/999`, { method: 'PUT', headers: auth, json: r.valid() })).status, 404)
        assert.equal((await api(`/api/${path}/${c.body.id}`, { method: 'DELETE', headers: auth })).status, 204)
        assert.equal((await api(`/api/${path}/${c.body.id}`, { method: 'DELETE', headers: auth })).status, 404)
      })

      for (const [name, patch] of Object.entries(r.invalid)) {
        test(`400: ${name}`, async () => {
          const res = await post(r.valid(patch))
          assert.equal(res.status, 400)
          assert.equal(typeof res.body.error, 'string')
        })
      }
    })
  }
})
