import { Router } from 'express'
import rateLimit from 'express-rate-limit'

const router = Router()

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Zu viele Anfragen. Bitte warten.' })
})

const IS_IP = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/

// RDAP registries to try for IPs (in order)
const IP_RDAP = [
  'https://rdap.arin.net/registry/ip/',
  'https://rdap.db.ripe.net/ip/',
  'https://rdap.apnic.net/ip/',
  'https://rdap.lacnic.net/rdap/ip/',
  'https://rdap.afrinic.net/rdap/ip/'
]

async function fetchRdap(urls, path) {
  for (const base of urls) {
    try {
      const r = await fetch(base + path, {
        signal: AbortSignal.timeout(6000),
        headers: { Accept: 'application/rdap+json, application/json' }
      })
      if (r.ok) return await r.json()
    } catch { /* try next */ }
  }
  return null
}

function parseIpRdap(data) {
  if (!data) return null
  const out = {
    type: 'ip',
    handle:   data.handle   || null,
    name:     data.name     || null,
    country:  data.country  || null,
    cidr:     (data.cidr0s?.[0] ? `${data.cidr0s[0].v4prefix || data.cidr0s[0].v6prefix}/${data.cidr0s[0].length}` : null)
           || (data.startAddress && data.endAddress ? `${data.startAddress} – ${data.endAddress}` : null),
    org:      null,
    created:  null,
    updated:  null,
    rdapUrl:  data.links?.find(l => l.rel === 'self')?.href || null
  }

  // Organisation name
  const entity = data.entities?.find(e => e.roles?.includes('registrant') || e.roles?.includes('administrative'))
  if (entity?.vcardArray) {
    const fn = entity.vcardArray[1]?.find(f => f[0] === 'fn')
    if (fn) out.org = fn[3]
  }
  if (!out.org && data.entities?.[0]?.handle) out.org = data.entities[0].handle

  // Dates
  for (const ev of data.events || []) {
    if (ev.eventAction === 'registration') out.created = ev.eventDate?.split('T')[0] || null
    if (ev.eventAction === 'last changed')  out.updated = ev.eventDate?.split('T')[0] || null
  }

  return out
}

function parseDomainRdap(data) {
  if (!data) return null
  const out = {
    type:        'domain',
    handle:      data.handle || null,
    name:        data.ldhName || data.unicodeName || null,
    status:      data.status || [],
    registrar:   null,
    registrant:  null,
    nameservers: (data.nameservers || []).map(ns => ns.ldhName || ns.unicodeName).filter(Boolean),
    created:     null,
    expires:     null,
    updated:     null,
    rdapUrl:     data.links?.find(l => l.rel === 'self')?.href || null
  }

  for (const entity of data.entities || []) {
    const fn = entity.vcardArray?.[1]?.find(f => f[0] === 'fn')?.[3]
    if (entity.roles?.includes('registrar'))   out.registrar  = fn || entity.handle
    if (entity.roles?.includes('registrant'))  out.registrant = fn || entity.handle
  }

  for (const ev of data.events || []) {
    if (ev.eventAction === 'registration') out.created = ev.eventDate?.split('T')[0] || null
    if (ev.eventAction === 'expiration')   out.expires = ev.eventDate?.split('T')[0] || null
    if (ev.eventAction === 'last changed') out.updated = ev.eventDate?.split('T')[0] || null
  }

  return out
}

// GET /api/whois?q=<ip-or-domain>
router.get('/', limiter, async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!q || q.length > 253) return res.status(400).json({ error: 'Ungültige Anfrage.' })
  if (!/^[a-z0-9.\-:]+$/i.test(q)) return res.status(400).json({ error: 'Ungültige Zeichen.' })

  try {
    if (IS_IP.test(q)) {
      const data = await fetchRdap(IP_RDAP, q)
      const parsed = parseIpRdap(data)
      if (!parsed) return res.status(404).json({ error: 'Keine WHOIS-Daten gefunden.' })
      return res.json(parsed)
    } else {
      // Domain — try rdap.org bootstrap first, then IANA
      const data = await fetchRdap(
        ['https://rdap.org/domain/', 'https://rdap.iana.org/domain/'],
        q
      )
      const parsed = parseDomainRdap(data)
      if (!parsed) return res.status(404).json({ error: 'Keine WHOIS-Daten gefunden.' })
      return res.json(parsed)
    }
  } catch (err) {
    console.error('[whois]', err.message)
    res.status(500).json({ error: 'WHOIS-Abfrage fehlgeschlagen.' })
  }
})

export default router
