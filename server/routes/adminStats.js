import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/admin/stats — auth required (no request logging, returns empty stats)
router.get('/stats', requireAuth, (_req, res) => {
  res.json({
    summary: {
      today: { total: 0, pageviews: 0, api: 0, errors: 0 },
      week:  { total: 0 },
      errorRate: 0,
      uniqueIps: 0
    },
    hourly:   [],
    topTools: [],
    topIps:   [],
    recent:   []
  })
})

export default router
