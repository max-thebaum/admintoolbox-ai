import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { spawn } from 'child_process'

const router = Router()

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Zu viele Anfragen. Bitte warten.' })
})

const PRIVATE_IP = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|fc|fd|fe80)/i

function validateTarget(t) {
  if (!t || t.length > 253) return 'Ungültiges Ziel.'
  if (!/^[a-zA-Z0-9.\-:]+$/.test(t)) return 'Ungültige Zeichen im Hostnamen.'
  if (PRIVATE_IP.test(t)) return 'Private IP-Adressen sind nicht erlaubt.'
  return null
}

function parseLine(line) {
  const m = line.match(/^\s*(\d+)\s+/)
  if (!m) return null
  const hop  = parseInt(m[1])
  const rest = line.slice(m[0].length).trim()

  if (/^\*[\s*]+$/.test(rest) || rest === '* * *') {
    return { hop, timeout: true, host: null, ip: null, rtts: [] }
  }

  // "hostname (ip)  x ms  y ms  z ms"
  const full = rest.match(/^(\S+)\s+\(([^)]+)\)\s*(.*)$/)
  if (full) {
    const rtts = (full[3].match(/[\d.]+(?=\s*ms)/g) || []).map(Number)
    return { hop, timeout: false, host: full[1], ip: full[2], rtts }
  }

  // Just IP/host with RTTs
  const simple = rest.match(/^(\S+)\s*(.*)$/)
  if (simple) {
    const rtts = (simple[2].match(/[\d.]+(?=\s*ms)/g) || []).map(Number)
    return { hop, timeout: false, host: simple[1], ip: simple[1], rtts }
  }

  return null
}

// GET /api/traceroute?target=... — SSE stream
router.get('/', limiter, (req, res) => {
  const target = (req.query.target || '').trim()
  const err = validateTarget(target)
  if (err) return res.status(400).json({ error: err })

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Accel-Buffering', 'no')  // disable nginx buffering
  res.flushHeaders()

  const sendEvent = (data) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  sendEvent({ type: 'start', target })

  const child = spawn('traceroute', ['-m', '30', '-w', '2', '-q', '3', target], {
    timeout: 60000
  })

  let buffer = ''

  child.stdout.on('data', chunk => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop()
    lines.forEach(line => {
      const hop = parseLine(line)
      if (hop) sendEvent({ type: 'hop', ...hop })
    })
  })

  child.stderr.on('data', chunk => {
    const msg = chunk.toString().trim()
    if (msg) sendEvent({ type: 'error', message: msg })
  })

  child.on('close', () => {
    sendEvent({ type: 'done' })
    res.end()
  })

  child.on('error', (e) => {
    sendEvent({ type: 'error', message: e.message })
    res.end()
  })

  // 45s hard timeout
  const timer = setTimeout(() => {
    child.kill()
    sendEvent({ type: 'timeout' })
    res.end()
  }, 45000)

  req.on('close', () => {
    clearTimeout(timer)
    child.kill()
  })
})

export default router
