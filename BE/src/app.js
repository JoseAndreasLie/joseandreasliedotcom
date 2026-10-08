import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { checkPassword, signToken } from './auth.js'
import { adminWorks, publicWorks } from './works.js'
import { uploadRouter } from './upload.js'

// opts.storage: MinIO-like client for uploads (tests inject a fake). Default: built from env on first upload.
export function createApp({ storage } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // behind Caddy: req.ip = real client IP for the login rate limit
  app.use(cors({ origin: process.env.CORS_ORIGIN || false }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (req, res) => res.json({ ok: true }))

  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'too many login attempts, try again later' },
  })
  app.post('/api/login', loginLimit, (req, res) => {
    if (!checkPassword(req.body?.password)) return res.status(401).json({ error: 'wrong password' })
    res.json({ token: signToken() })
  })

  app.use('/api', publicWorks)
  app.use('/api', adminWorks, uploadRouter(storage)) // each route applies requireAuth itself
  app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }))

  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'file too large (max 20MB)' : err.message })
    }
    const status = err.status ?? err.statusCode
    if (status >= 400 && status < 500) {
      return res.status(status).json({ error: err.type === 'entity.parse.failed' ? 'invalid JSON body' : err.expose ? err.message : 'bad request' })
    }
    console.error(err)
    res.status(500).json({ error: 'internal error' })
  })
  return app
}

export const app = createApp()
