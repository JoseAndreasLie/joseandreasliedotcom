import { Router } from 'express'
import { UniqueConstraintError } from 'sequelize'
import { requireAuth } from './auth.js'

const isId = (s) => /^\d{1,9}$/.test(s)

/**
 * Public + admin REST routes for one model, mounted under /api.
 *   GET  /{path}            published rows, list columns (no `heavy` fields). `filter(query)` -> { where } | { error }
 *   GET  /{path}/:slug      one published row
 *   GET  /admin/{path}      every row, full
 *   POST /{path}, PUT /{path}/:id, DELETE /{path}/:id   (requireAuth)
 * keepIfNull: columns that fall back to the DB default on create and keep their value on update when sent null.
 */
export function crud({ Model, path, validate, order, heavy = [], filter = () => ({}), keepIfNull = [] }) {
  const r = Router()
  const name = path.replace(/s$/, '')
  const notFound = (res) => res.status(404).json({ error: `${name} not found` })
  const strip = (v) => {
    const out = { ...v }
    for (const k of keepIfNull) if (out[k] == null) delete out[k]
    return out
  }
  async function save(res, status, run) {
    try {
      const row = await run()
      if (!row) return notFound(res)
      res.status(status).json(row)
    } catch (e) {
      if (e instanceof UniqueConstraintError) return res.status(409).json({ error: 'slug already exists' })
      throw e
    }
  }

  r.get(`/${path}`, async (req, res) => {
    const { error, where } = filter(req.query)
    if (error) return res.status(400).json({ error })
    res.json(await Model.findAll({ where: { ...where, published: true }, attributes: { exclude: heavy }, order }))
  })

  r.get(`/${path}/:slug`, async (req, res) => {
    const row = await Model.findOne({ where: { slug: req.params.slug, published: true } })
    if (!row) return notFound(res)
    res.json(row)
  })

  r.get(`/admin/${path}`, requireAuth, async (req, res) => {
    res.json(await Model.findAll({ order }))
  })

  r.post(`/${path}`, requireAuth, async (req, res) => {
    const { error, value } = validate(req.body)
    if (error) return res.status(400).json({ error })
    await save(res, 201, () => Model.create(strip(value)))
  })

  r.put(`/${path}/:id`, requireAuth, async (req, res) => {
    if (!isId(req.params.id)) return notFound(res)
    const { error, value } = validate(req.body)
    if (error) return res.status(400).json({ error })
    await save(res, 200, async () => {
      const row = await Model.findByPk(req.params.id)
      return row && row.update(strip(value))
    })
  })

  r.delete(`/${path}/:id`, requireAuth, async (req, res) => {
    if (!isId(req.params.id)) return notFound(res)
    const n = await Model.destroy({ where: { id: req.params.id } })
    if (!n) return notFound(res)
    res.status(204).end()
  })

  return r
}
