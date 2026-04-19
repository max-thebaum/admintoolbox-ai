import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { query } from '../lib/db.js'

const router = Router()

const DEFAULT_NAV_CONFIG = [
  { id: 1, label: 'Netzwerk',  tools: ['subnet', 'speedcalc', 'dns', 'ipinfo', 'portref'] },
  { id: 2, label: 'Security',  tools: ['passgen', 'hashgen'] },
  { id: 3, label: 'PKI',       tools: ['csrgen', 'certgen', 'certchain'] },
  { id: 4, label: 'MDM',       tools: ['intune'] }
]

// GET /api/settings/nav — public
router.get('/nav', async (req, res) => {
  try {
    const { rows } = await query(`SELECT value FROM settings WHERE key = 'nav_config'`)
    res.json(rows[0] ? rows[0].value : DEFAULT_NAV_CONFIG)
  } catch {
    res.json(DEFAULT_NAV_CONFIG)
  }
})

// PUT /api/settings/nav — admin only
router.put('/nav', requireAuth, async (req, res) => {
  const config = req.body
  if (!Array.isArray(config)) return res.status(400).json({ error: 'Ungültiges Format (Array erwartet)' })

  // Validate structure
  for (const cat of config) {
    if (!cat.label || typeof cat.label !== 'string') return res.status(400).json({ error: 'Jede Kategorie braucht ein label' })
    if (!Array.isArray(cat.tools)) return res.status(400).json({ error: 'tools muss ein Array sein' })
  }

  try {
    await query(
      `INSERT INTO settings (key, value) VALUES ('nav_config', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [JSON.stringify(config)]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('[settings] PUT /nav error:', err.message)
    res.status(500).json({ error: 'Datenbankfehler' })
  }
})

export default router
