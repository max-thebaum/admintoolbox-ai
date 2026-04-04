import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { rateLimit } from 'express-rate-limit'
import { getJwtSecret } from '../lib/jwt.js'
import { query } from '../lib/db.js'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5,
  message: { error: 'Zu viele Login-Versuche. Bitte warte 15 Minuten.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Dummy-Hash für Timing-sichere Ablehnung bei unbekanntem Username
// Verhindert Username-Enumeration über Zeitunterschiede
const DUMMY_HASH = '$2b$12$invalidhashpaddingtomakeittaketime00000000000000000000'

const router = Router()

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {}

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Ungültige Eingabe' })
  }

  try {
    const { rows } = await query(
      'SELECT username, password_hash FROM users WHERE username = $1',
      [username]
    )
    const user = rows[0]

    // Always run bcrypt to prevent timing-based username enumeration
    const hashToCheck = user ? user.password_hash : DUMMY_HASH
    const passwordMatch = await bcrypt.compare(password, hashToCheck)

    if (!user || !passwordMatch) {
      return res.status(401).json({ error: 'Benutzername oder Passwort falsch' })
    }

    const token = jwt.sign(
      { sub: user.username, role: 'admin' },
      getJwtSecret(),
      { expiresIn: '8h', algorithm: 'HS256' }
    )

    res.json({ token, expiresIn: 28800 })

  } catch (err) {
    console.error('[auth] Login error:', err.message)
    res.status(500).json({ error: 'Datenbankfehler beim Login' })
  }
})

export default router
