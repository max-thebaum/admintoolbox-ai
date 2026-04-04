import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import tls from 'tls'

const router = Router()

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Zu viele Anfragen. Bitte warten.' })
})

function validateHost(h) {
  if (!h || h.length > 253) return 'Ungültiger Hostname.'
  if (!/^[a-zA-Z0-9.\-]+$/.test(h)) return 'Ungültige Zeichen im Hostnamen.'
  return null
}

function certChain(cert) {
  const chain = []
  let c = cert
  while (c) {
    chain.push({
      subject: c.subject?.CN || c.subject?.O || null,
      issuer:  c.issuer?.CN  || c.issuer?.O  || null,
      valid_from: c.valid_from  || null,
      valid_to:   c.valid_to    || null
    })
    if (!c.issuerCertificate || c.issuerCertificate === c) break
    c = c.issuerCertificate
  }
  return chain
}

// GET /api/ssltls?host=<domain>&port=<port>
router.get('/', limiter, (req, res) => {
  const host = (req.query.host || '').trim().toLowerCase()
  const port = Math.min(65535, Math.max(1, parseInt(req.query.port) || 443))

  const err = validateHost(host)
  if (err) return res.status(400).json({ error: err })

  const options = {
    host,
    port,
    servername: host,
    rejectUnauthorized: false,
    timeout: 8000
  }

  const socket = tls.connect(options, () => {
    try {
      const cert      = socket.getPeerCertificate(true)
      const authorized = socket.authorized
      const protocol  = socket.getProtocol()
      const cipher    = socket.getCipher()

      if (!cert || !cert.subject) {
        socket.destroy()
        return res.status(502).json({ error: 'Kein Zertifikat erhalten.' })
      }

      const now       = Date.now()
      const validFrom = new Date(cert.valid_from)
      const validTo   = new Date(cert.valid_to)
      const daysLeft  = Math.floor((validTo - now) / 86400000)
      const totalDays = Math.floor((validTo - validFrom) / 86400000)

      const sans = cert.subjectaltname
        ? cert.subjectaltname.split(', ')
            .filter(s => s.startsWith('DNS:'))
            .map(s => s.slice(4))
        : []

      let statusCode = 'valid'
      if (!authorized && cert.selfSigned) statusCode = 'self_signed'
      else if (daysLeft < 0)              statusCode = 'expired'
      else if (daysLeft < 30)             statusCode = 'expiring_soon'

      const result = {
        host,
        port,
        status:     statusCode,
        authorized,
        daysLeft,
        totalDays,
        validFrom:  validFrom.toISOString().split('T')[0],
        validTo:    validTo.toISOString().split('T')[0],
        subject: {
          cn:  cert.subject?.CN  || null,
          o:   cert.subject?.O   || null,
          ou:  cert.subject?.OU  || null,
          c:   cert.subject?.C   || null
        },
        issuer: {
          cn:  cert.issuer?.CN   || null,
          o:   cert.issuer?.O    || null,
          c:   cert.issuer?.C    || null
        },
        fingerprint:  cert.fingerprint256 || cert.fingerprint || null,
        serialNumber: cert.serialNumber   || null,
        sans,
        protocol,
        cipher: {
          name:    cipher?.name    || null,
          version: cipher?.version || null,
          bits:    cipher?.secretKeyLength || null
        },
        chain: certChain(cert)
      }

      socket.destroy()
      res.json(result)
    } catch (e) {
      socket.destroy()
      res.status(500).json({ error: e.message })
    }
  })

  socket.on('timeout', () => {
    socket.destroy()
    if (!res.headersSent) res.status(504).json({ error: 'Verbindung Timeout.' })
  })

  socket.on('error', (e) => {
    if (!res.headersSent) res.status(502).json({ error: e.message })
  })
})

export default router
