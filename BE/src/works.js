import { Router } from 'express'
import { pool } from './db.js'
import { TYPES, validateWork } from './validate.js'
import { requireAuth } from './auth.js'

const LIST_COLS = 'id, slug, type, title, summary, cover_url, media, links, tags, shot_on, date, published, created_at, updated_at'
const ORDER = 'ORDER BY date DESC, id DESC'

export const publicWorks = Router()

publicWorks.get('/works', async (req, res) => {
  const { type } = req.query
  if (type === undefined || type === '') {
    return res.json((await pool.query(`SELECT ${LIST_COLS} FROM works WHERE published ${ORDER}`)).rows)
  }
  if (!TYPES.includes(type)) return res.status(400).json({ error: `type must be one of ${TYPES.join(', ')}` })
  res.json((await pool.query(`SELECT ${LIST_COLS} FROM works WHERE published AND type = $1 ${ORDER}`, [type])).rows)
})

publicWorks.get('/works/:slug', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM works WHERE published AND slug = $1', [req.params.slug])
  if (!rows[0]) return res.status(404).json({ error: 'work not found' })
  res.json(rows[0])
})

export const adminWorks = Router()

adminWorks.get('/admin/works', requireAuth, async (req, res) => {
  res.json((await pool.query(`SELECT * FROM works ${ORDER}`)).rows)
})

const COLS = ['slug', 'type', 'title', 'summary', 'body', 'cover_url', 'media', 'links', 'tags', 'shot_on', 'date', 'published']
const params = (v) => COLS.map((c) => (c === 'media' || c === 'links' ? JSON.stringify(v[c]) : v[c]))

async function save(res, status, sql, args) {
  try {
    const { rows } = await pool.query(sql, args)
    if (!rows[0]) return res.status(404).json({ error: 'work not found' })
    res.status(status).json(rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'slug already exists' })
    throw e
  }
}

adminWorks.post('/works', requireAuth, async (req, res) => {
  const { error, value } = validateWork(req.body)
  if (error) return res.status(400).json({ error })
  // COALESCE($11, current_date): omitted date falls back to today, like the column default.
  await save(res, 201,
    `INSERT INTO works (${COLS.join(', ')}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11::date, current_date),$12) RETURNING *`,
    params(value))
})

const isId = (s) => /^\d{1,9}$/.test(s)

adminWorks.put('/works/:id', requireAuth, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'work not found' })
  const { error, value } = validateWork(req.body)
  if (error) return res.status(400).json({ error })
  await save(res, 200,
    `UPDATE works SET ${COLS.map((c, i) => (c === 'date' ? `date = COALESCE($${i + 1}::date, date)` : `${c} = $${i + 1}`)).join(', ')},
     updated_at = now() WHERE id = $13 RETURNING *`,
    [...params(value), req.params.id])
})

adminWorks.delete('/works/:id', requireAuth, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'work not found' })
  const { rowCount } = await pool.query('DELETE FROM works WHERE id = $1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'work not found' })
  res.status(204).end()
})
