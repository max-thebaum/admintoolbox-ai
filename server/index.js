import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

// Initialize DB pool + run schema migrations
import './lib/db.js'
import { ensureSchema } from './lib/schema.js'

import authRouter       from './routes/auth.js'
import dnsRouter        from './routes/dns.js'
import settingsRouter   from './routes/settings.js'
import portcheckRouter    from './routes/portcheck.js'
import dnspropRouter      from './routes/dnsprop.js'
import scriptstoreRouter  from './routes/scriptstore.js'
import speedtestRouter    from './routes/speedtest.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT      = process.env.PORT || 3001
const DIST      = join(__dirname, '../dist')

const app = express()

// ---- Middleware ----
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false, limit: '10mb' }))

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'http://127.0.0.1:5173'
    ]
    if (process.env.APP_URL) {
      const base = process.env.APP_URL.replace(/\/$/, '')
      allowed.push(base)
      allowed.push(base.replace('://', '://www.'))
    }
    if (!origin || allowed.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options',  'nosniff')
  res.setHeader('X-Frame-Options',         'DENY')
  res.setHeader('X-XSS-Protection',        '1; mode=block')
  res.setHeader('Referrer-Policy',         'strict-origin-when-cross-origin')
  next()
})

// ---- Health check (used by Coolify) ----
app.get('/api/health', (req, res) => res.json({ ok: true }))

// ---- API Routes ----
app.use('/api/auth',       authRouter)
app.use('/api/dns',        dnsRouter)
app.use('/api/settings',   settingsRouter)
app.use('/api/portcheck',   portcheckRouter)
app.use('/api/dnsprop',     dnspropRouter)
app.use('/api/scriptstore', scriptstoreRouter)
app.use('/script',          scriptstoreRouter)   // serves GET /script/:token.sh
app.use('/api/speedtest',   speedtestRouter)

// ---- Serve static dist in production ----
if (existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(DIST, 'index.html'))
  })
}

// ---- 404 for unknown API routes ----
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Nicht gefunden' })
})

// ---- Error handler ----
app.use((err, req, res, _next) => {
  console.error('[error]', err.message)
  res.status(500).json({ error: 'Interner Serverfehler' })
})

// ---- Start ----
ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[AdminToolbox API] läuft auf http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('[startup] Schema-Migration fehlgeschlagen:', err.message)
    process.exit(1)
  })
