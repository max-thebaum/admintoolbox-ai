import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'

const dnsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 30,
  message: { error: 'Zu viele DNS-Anfragen. Bitte warte kurz.' }
})

const DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'SRV', 'PTR']
const CF_DOH = 'https://cloudflare-dns.com/dns-query'

// Validate domain — allow hostnames and IPs
function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') return false
  const d = domain.trim().toLowerCase()
  if (d.length > 253) return false
  // Basic hostname regex — no protocol prefix
  return /^(?:[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(d)
}

const router = Router()

router.get('/lookup', dnsLimiter, async (req, res) => {
  const raw    = (req.query.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  const types  = req.query.types ? req.query.types.split(',').filter(t => DNS_TYPES.includes(t.toUpperCase())).map(t => t.toUpperCase()) : DNS_TYPES

  if (!isValidDomain(raw)) {
    return res.status(400).json({ error: 'Ungültige Domain. Bitte ohne http:// eingeben, z. B. example.com' })
  }

  const results = {}
  const errors  = {}

  await Promise.allSettled(
    types.map(async type => {
      try {
        const url = `${CF_DOH}?name=${encodeURIComponent(raw)}&type=${type}`
        const resp = await fetch(url, {
          headers: { 'Accept': 'application/dns-json' },
          signal: AbortSignal.timeout(5000)
        })

        if (!resp.ok) {
          errors[type] = `HTTP ${resp.status}`
          return
        }

        const data = await resp.json()

        if (data.Status !== 0) {
          // NXDOMAIN (3) = domain doesn't exist, NOERROR (0) = ok
          results[type] = []
          return
        }

        results[type] = (data.Answer || []).map(rec => ({
          name:  rec.name,
          ttl:   rec.TTL,
          data:  rec.data
        }))
      } catch (err) {
        errors[type] = err.message || 'Timeout'
      }
    })
  )

  res.json({ domain: raw, results, errors })
})

export default router
