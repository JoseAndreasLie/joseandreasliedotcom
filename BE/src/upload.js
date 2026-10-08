import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import * as Minio from 'minio'
import { requireAuth } from './auth.js'

const MAX_BYTES = 20 * 1024 * 1024

function minioFromEnv() {
  const e = process.env
  return new Minio.Client({
    endPoint: e.MINIO_ENDPOINT, port: Number(e.MINIO_PORT) || 9000, useSSL: e.MINIO_USE_SSL === 'true',
    accessKey: e.MINIO_ACCESS_KEY, secretKey: e.MINIO_SECRET_KEY,
  })
}

// storage: anything with minio's putObject(bucket, name, buffer, size, meta). Tests pass a fake.
export function uploadRouter(storage) {
  const r = Router()
  const parse = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
  }).single('file')

  r.post('/upload', requireAuth, parse, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'image file required (field "file")' })
    // Decode once; limitInputPixels rejects decompression bombs (sharp's default is 268M px).
    const img = sharp(req.file.buffer, { limitInputPixels: 50_000_000 }).rotate()
    const resize = (width) => img.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
    let full, thumb
    try {
      [full, thumb] = await Promise.all([resize(1600), resize(600)])
    } catch {
      return res.status(400).json({ error: 'file is not a readable image (or exceeds 50M pixels)' })
    }
    storage ??= minioFromEnv()
    const name = randomUUID()
    const bucket = process.env.MINIO_BUCKET
    const meta = { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' }
    await storage.putObject(bucket, `${name}.webp`, full, full.length, meta)
    await storage.putObject(bucket, `${name}_thumb.webp`, thumb, thumb.length, meta)
    res.status(201).json({ url: `/media/${name}.webp`, thumb_url: `/media/${name}_thumb.webp` })
  })
  return r
}
