// ============================================================
// Script Store — temporary download links (5-minute TTL)
// POST /api/scriptstore  → store script, return token + expiry
// GET  /script/:token.sh → serve script or 410 Gone
// ============================================================
import { Router } from 'express'
import { randomUUID } from 'crypto'
import rateLimit from 'express-rate-limit'

const router = Router()

// In-memory store: token → { content, expiresAt, filename }
const store = new Map()
const EXPIRY_MS = 5 * 60 * 1000  // 5 minutes
const MAX_SIZE  = 512 * 1024      // 512 KB per script

const postLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen.' }
})

function cleanup() {
  const now = Date.now()
  for (const [token, entry] of store) {
    if (entry.expiresAt < now) store.delete(token)
  }
}

// POST /api/scriptstore
router.post('/', postLimiter, (req, res) => {
  const { script } = req.body

  if (!script || typeof script !== 'string') {
    return res.status(400).json({ error: 'script ist ein Pflichtfeld.' })
  }
  if (script.length > MAX_SIZE) {
    return res.status(400).json({ error: 'Script zu groß (max. 512 KB).' })
  }
  if (!script.startsWith('#!/bin/bash')) {
    return res.status(400).json({ error: 'Ungültiges Script-Format.' })
  }

  cleanup()

  const token     = randomUUID()
  const expiresAt = Date.now() + EXPIRY_MS

  store.set(token, { content: script, expiresAt })

  res.json({
    token,
    expires: new Date(expiresAt).toISOString(),
    expiresInSeconds: Math.floor(EXPIRY_MS / 1000)
  })
})

// GET /script/:filename  (mounted at /script in index.js)
router.get('/:filename', (req, res) => {
  const { filename } = req.params

  if (!filename.endsWith('.sh')) {
    return res.status(404).send('Not found.')
  }

  const token = filename.slice(0, -3)
  const entry = store.get(token)

  if (!entry) {
    return res.status(404).type('text/plain').send(
      '# Error: Script not found.\n# This link was never created or has already been cleaned up.\n'
    )
  }

  if (entry.expiresAt < Date.now()) {
    store.delete(token)
    return res.status(410).type('text/plain').send(
      '# Error: This link has expired (5-minute limit).\n# Generate a new link in the AdminToolbox Bootstrap Generator.\n'
    )
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="bootstrap_${token.slice(0, 8)}.sh"`)
  res.send(entry.content)
})

export default router
