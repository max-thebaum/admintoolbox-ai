import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { query } from '../lib/db.js'

const router = Router()

// GET /api/admin/stats — auth required
router.get('/stats', requireAuth, async (_req, res) => {
  try {
    const [today, week, hourly, topTools, topIps, recent] = await Promise.all([

      // Today summary
      query(`
        SELECT
          COUNT(*)                                        AS total,
          COUNT(*) FILTER (WHERE type = 'pageview')      AS pageviews,
          COUNT(*) FILTER (WHERE type = 'api')           AS api,
          COUNT(*) FILTER (WHERE status >= 400)          AS errors
        FROM request_logs
        WHERE ts >= NOW() - INTERVAL '24 hours'
      `),

      // 7-day total
      query(`
        SELECT COUNT(*) AS total
        FROM request_logs
        WHERE ts >= NOW() - INTERVAL '7 days'
      `),

      // Requests per hour, last 24h (fill all 24 slots)
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('hour', ts), 'HH24:MI') AS hour,
          COUNT(*)::int                               AS count
        FROM request_logs
        WHERE ts >= NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', ts)
        ORDER BY DATE_TRUNC('hour', ts)
      `),

      // Top 10 tools/paths (pageviews only, last 7 days)
      query(`
        SELECT path, COUNT(*)::int AS count
        FROM request_logs
        WHERE type = 'pageview'
          AND path != 'admin'
          AND ts >= NOW() - INTERVAL '7 days'
        GROUP BY path
        ORDER BY count DESC
        LIMIT 10
      `),

      // Top 10 IPs (last 7 days)
      query(`
        SELECT ip_anon AS ip, COUNT(*)::int AS count
        FROM request_logs
        WHERE ts >= NOW() - INTERVAL '7 days'
        GROUP BY ip_anon
        ORDER BY count DESC
        LIMIT 10
      `),

      // Last 50 entries
      query(`
        SELECT
          TO_CHAR(ts AT TIME ZONE 'UTC', 'HH24:MI:SS') AS ts,
          ip_anon, type, path, method, status, duration_ms
        FROM request_logs
        ORDER BY id DESC
        LIMIT 50
      `)
    ])

    const t  = today.rows[0]
    const w  = week.rows[0]
    const totalToday = parseInt(t.total)
    const errorsToday = parseInt(t.errors)
    const uniqueIps = new Set(recent.rows.map(r => r.ip_anon)).size

    res.json({
      summary: {
        today:    { total: totalToday, pageviews: parseInt(t.pageviews), api: parseInt(t.api), errors: errorsToday },
        week:     { total: parseInt(w.total) },
        errorRate: totalToday > 0 ? Math.round((errorsToday / totalToday) * 1000) / 10 : 0,
        uniqueIps
      },
      hourly:   hourly.rows,
      topTools: topTools.rows,
      topIps:   topIps.rows,
      recent:   recent.rows
    })
  } catch (err) {
    console.error('[adminStats]', err.message)
    res.status(500).json({ error: 'Datenbankfehler' })
  }
})

export default router
