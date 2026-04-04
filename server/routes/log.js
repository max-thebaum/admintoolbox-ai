import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { logRequest } from '../lib/logger.js'

const router = Router()

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ ok: false })
})

// POST /api/log/view — pageview beacon (public, fire-and-forget)
router.post('/view', limiter, (req, res) => {
  const { page } = req.body ?? {}
  if (typeof page === 'string' && page.length > 0 && page.length <= 64) {
    logRequest('pageview', page, { ip: req.ip })
  }
  res.json({ ok: true })
})

export default router
