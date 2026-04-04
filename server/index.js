import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

// Initialize DB pool + run schema migrations
import './lib/db.js'
import { query } from './lib/db.js'
import { ensureSchema } from './lib/schema.js'

import authRouter       from './routes/auth.js'
import dnsRouter        from './routes/dns.js'
import settingsRouter   from './routes/settings.js'
import portcheckRouter    from './routes/portcheck.js'
import dnspropRouter      from './routes/dnsprop.js'
import scriptstoreRouter  from './routes/scriptstore.js'
import speedtestRouter    from './routes/speedtest.js'
import logRouter          from './routes/log.js'
import adminStatsRouter   from './routes/adminStats.js'
import { logRequest }     from './lib/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT      = process.env.PORT || 3001
const DIST      = join(__dirname, '../dist')

const app = express()

// Trust the first proxy hop (Traefik / Coolify reverse proxy)
// Required for express-rate-limit to read X-Forwarded-For correctly
app.set('trust proxy', 1)

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

// ---- API request logging (skip health + log beacon itself) ----
app.use('/api', (req, res, next) => {
  const skip = ['/health', '/log/view', '/admin']
  if (skip.some(p => req.path.startsWith(p))) return next()
  const t0 = Date.now()
  res.on('finish', () => {
    logRequest('api', req.path, {
      ip: req.ip, method: req.method,
      status: res.statusCode, duration_ms: Date.now() - t0
    })
  })
  next()
})

// ---- API Routes ----
app.use('/api/auth',       authRouter)
app.use('/api/dns',        dnsRouter)
app.use('/api/settings',   settingsRouter)
app.use('/api/portcheck',   portcheckRouter)
app.use('/api/dnsprop',     dnspropRouter)
app.use('/api/scriptstore', scriptstoreRouter)
app.use('/script',          scriptstoreRouter)   // serves GET /script/:token.sh
app.use('/api/speedtest',   speedtestRouter)
app.use('/api/log',         logRouter)
app.use('/api/admin',       adminStatsRouter)

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

    // Daily cleanup: delete request_logs older than 5 days
    const runCleanup = () =>
      query(`DELETE FROM request_logs WHERE ts < NOW() - INTERVAL '5 days'`)
        .then(r => { if (r.rowCount > 0) console.log(`[cron] ${r.rowCount} alte Log-Einträge gelöscht`) })
        .catch(e => console.error('[cron] log cleanup:', e.message))
    runCleanup()
    setInterval(runCleanup, 24 * 60 * 60 * 1000)
  })
  .catch(err => {
    console.error('[startup] Schema-Migration fehlgeschlagen:', err.message)
    process.exit(1)
  })
