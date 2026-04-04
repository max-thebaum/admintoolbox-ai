// ============================================================
// Port Checker — TCP reachability check
// GET /api/portcheck?host=&port=
//
// Protections:
//   - Rate limit: 5 req/min per IP
//   - Concurrency cap: max 3 simultaneous checks globally
//   - SSRF: hostname string check + DNS resolution check (rebinding protection)
//   - Port blocklist: high-abuse ports (SMTP, SMB, RDP, Redis, …)
// ============================================================
import { Router }   from 'express'
import net          from 'net'
import dns          from 'dns'
import rateLimit    from 'express-rate-limit'

const router = Router()

// ---- Rate limit: 5 req/min per IP ----
const limiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte warte eine Minute.' }
})

// ---- Concurrency guard ----
let _active = 0
const MAX_CONCURRENT = 3

// ---- Blocked ports (commonly abused) ----
const BLOCKED_PORTS = new Set([
  25, 465, 587,          // SMTP — relay abuse / spam probing
  110, 143, 993, 995,    // POP3 / IMAP — mail credential probing
  445, 139,              // SMB — ransomware / lateral movement scanning
  3389,                  // RDP — brute-force probing
  6379,                  // Redis — unauthenticated instance probing
  11211,                 // Memcached — DDoS amplification
  27017, 27018,          // MongoDB — open instance scanning
  9200, 9300,            // Elasticsearch
  2375, 2376,            // Docker daemon
])

// ---- Hostname format ----
const HOSTNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,252}$/

// ---- Private / reserved IP ranges ----
function isPrivateOrReserved(addr) {
  const patterns = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^169\.254\./,
    /^0\.0\.0\.0/,
    /^::1$/,
    /^fc[0-9a-f]{2}:/i,
    /^fd[0-9a-f]{2}:/i,
    /^fe80:/i,
    /^localhost$/i,
    /^.*\.local$/i,
    /^.*\.internal$/i,
  ]
  return patterns.some(p => p.test(addr))
}

// ---- Resolve hostname → check resolved IP for private ranges ----
async function resolveAndCheck(host) {
  // If already an IP literal, skip DNS
  if (net.isIP(host)) {
    return isPrivateOrReserved(host) ? 'blocked' : host
  }
  try {
    const { address } = await dns.promises.lookup(host, { family: 0 })
    if (isPrivateOrReserved(address)) return 'blocked'
    return address
  } catch {
    return 'unresolvable'
  }
}

// ---- Route ----
router.get('/', limiter, async (req, res) => {
  const { host, port: portStr } = req.query

  if (!host || !portStr) {
    return res.status(400).json({ error: 'host und port sind Pflichtfelder.' })
  }

  const host_ = String(host).trim().toLowerCase()
  const port  = parseInt(portStr, 10)

  if (!HOSTNAME_RE.test(host_)) {
    return res.status(400).json({ error: 'Ungültiger Hostname oder IP-Adresse.' })
  }

  if (isPrivateOrReserved(host_)) {
    return res.status(400).json({ error: 'Private und reservierte Adressen sind nicht erlaubt.' })
  }

  if (isNaN(port) || port < 1 || port > 65535) {
    return res.status(400).json({ error: 'Port muss zwischen 1 und 65535 liegen.' })
  }

  if (BLOCKED_PORTS.has(port)) {
    return res.status(400).json({ error: `Port ${port} ist aus Sicherheitsgründen gesperrt.` })
  }

  if (_active >= MAX_CONCURRENT) {
    return res.status(429).json({ error: 'Server momentan ausgelastet. Bitte kurz warten.' })
  }

  // DNS resolution + rebinding check
  const resolved = await resolveAndCheck(host_)
  if (resolved === 'blocked') {
    return res.status(400).json({ error: 'Der Hostname löst zu einer privaten Adresse auf — nicht erlaubt.' })
  }
  if (resolved === 'unresolvable') {
    return res.json({ status: 'error_dns', ms: 0, host: host_, port })
  }

  _active++
  const start = Date.now()
  try {
    const status = await checkPort(resolved, port)
    const ms = Date.now() - start
    res.json({ status, ms, host: host_, port })
  } catch {
    res.status(500).json({ error: 'Interner Fehler beim Verbindungsversuch.' })
  } finally {
    _active--
  }
})

function checkPort(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let resolved = false

    const done = (result) => {
      if (resolved) return
      resolved = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(timeoutMs)
    socket.on('connect', () => done('open'))
    socket.on('timeout', () => done('timeout'))
    socket.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') done('closed')
      else if (err.code === 'ENOTFOUND' || err.code === 'ENOENT') done('error_dns')
      else done('error')
    })

    socket.connect(port, host)
  })
}

export default router
