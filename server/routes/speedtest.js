import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { randomBytes } from 'crypto'

const router = Router()

// 5 complete tests/hour per IP (each test ≈ 20 requests: 10 pings + 5 DL + 5 UL)
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: 'Zu viele Tests. Bitte in einer Stunde erneut versuchen.' })
})

router.use(limiter)

// GET /api/speedtest/ping — latency probe, returns immediately
router.get('/ping', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ ts: Date.now() })
})

// GET /api/speedtest/download?size=N — stream N MB of incompressible random data
router.get('/download', (req, res) => {
  const MAX_MB = 100
  const size = Math.min(Math.max(parseInt(req.query.size) || 5, 1), MAX_MB)
  const totalBytes = size * 1024 * 1024

  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Length', totalBytes)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')

  const CHUNK = 256 * 1024  // 256 KB per write
  let remaining = totalBytes

  res.on('close', () => { remaining = 0 })

  function writeNext() {
    if (remaining <= 0) { res.end(); return }
    const n = Math.min(CHUNK, remaining)
    const buf = randomBytes(n)
    remaining -= n
    if (!res.write(buf)) {
      res.once('drain', writeNext)
    } else {
      setImmediate(writeNext)
    }
  }

  writeNext()
})

// POST /api/speedtest/upload — consume and discard uploaded bytes
router.post('/upload', (req, res) => {
  const MAX_BYTES = 105 * 1024 * 1024
  let bytes = 0
  let aborted = false

  req.on('data', chunk => {
    bytes += chunk.length
    if (bytes > MAX_BYTES && !aborted) {
      aborted = true
      req.destroy()
      res.status(413).json({ error: 'Upload-Limit überschritten (max 100 MB).' })
    }
  })

  req.on('end', () => {
    if (!aborted) res.json({ received: bytes })
  })

  req.on('error', () => {
    if (!aborted) res.status(400).json({ error: 'Upload-Fehler.' })
  })
})

export default router
