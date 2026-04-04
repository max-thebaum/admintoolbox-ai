// ============================================================
// DNS Propagation Checker
// GET /api/dnsprop?domain=&type=A
// Queries 8 global resolvers in parallel
// Rate limited: 10 req/min per IP
// ============================================================
import { Router } from 'express'
import dns from 'dns'
import rateLimit from 'express-rate-limit'

const router = Router()

const limiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte warte eine Minute.' }
})

const ALLOWED_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS']

const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

const RESOLVERS = [
  { name: 'Google',        ip: '8.8.8.8',        location: 'USA' },
  { name: 'Google 2',      ip: '8.8.4.4',        location: 'USA' },
  { name: 'Cloudflare',    ip: '1.1.1.1',        location: 'Global' },
  { name: 'Cloudflare 2',  ip: '1.0.0.1',        location: 'Global' },
  { name: 'Quad9',         ip: '9.9.9.9',        location: 'Global' },
  { name: 'OpenDNS',       ip: '208.67.222.222',  location: 'USA' },
  { name: 'Verisign',      ip: '64.6.64.6',      location: 'USA' },
  { name: 'CleanBrowsing', ip: '185.228.168.9',  location: 'EU' },
]

router.get('/', limiter, async (req, res) => {
  const { domain: rawDomain, type: rawType = 'A' } = req.query

  if (!rawDomain) {
    return res.status(400).json({ error: 'domain ist ein Pflichtfeld.' })
  }

  const domain = String(rawDomain).trim().toLowerCase().replace(/\.$/, '')
  const type   = String(rawType).toUpperCase()

  if (!DOMAIN_RE.test(domain) || domain.length > 253) {
    return res.status(400).json({ error: 'Ungültiger Domainname.' })
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: `Ungültiger Record-Typ. Erlaubt: ${ALLOWED_TYPES.join(', ')}` })
  }

  const results = await Promise.all(
    RESOLVERS.map(r => queryResolver(r, domain, type))
  )

  res.json({ domain, type, results })
})

async function queryResolver(resolver, domain, type) {
  const r = new dns.promises.Resolver()
  r.setServers([resolver.ip])

  try {
    let records = []

    if (type === 'A')    records = await r.resolve4(domain)
    else if (type === 'AAAA') records = await r.resolve6(domain)
    else if (type === 'MX')   records = (await r.resolveMx(domain)).map(m => `${m.priority} ${m.exchange}`)
    else if (type === 'TXT')  records = (await r.resolveTxt(domain)).map(a => a.join(''))
    else if (type === 'NS')   records = await r.resolveNs(domain)

    return {
      ...resolver,
      status: 'ok',
      result: records.length ? records : ['(keine Einträge)']
    }
  } catch (err) {
    const msg = err.code === 'ENOTFOUND' || err.code === 'ENODATA'
      ? 'Kein Eintrag'
      : err.code === 'ETIMEOUT'
        ? 'Timeout'
        : err.code || 'Fehler'

    return { ...resolver, status: 'error', result: [msg] }
  }
}

export default router
