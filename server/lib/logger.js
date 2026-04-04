import { query } from './db.js'

function anonymizeIp(ip) {
  if (!ip) return 'unknown'
  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4)
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) ip = mapped[1]
  // IPv4: mask last octet
  const v4 = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/)
  if (v4) return v4[1] + '.xxx'
  // IPv6: keep first 3 groups, mask rest
  const parts = ip.split(':')
  if (parts.length >= 3) return parts.slice(0, 3).join(':') + ':xxxx:…'
  return 'xxx'
}

/**
 * Fire-and-forget request logger — never blocks the response.
 * @param {'pageview'|'api'} type
 * @param {string} path
 * @param {{ ip?: string, method?: string, status?: number, duration_ms?: number }} opts
 */
export function logRequest(type, path, opts = {}) {
  const ip_anon = anonymizeIp(opts.ip || '')
  query(
    `INSERT INTO request_logs (ip_anon, type, path, method, status, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [ip_anon, type, path, opts.method ?? null, opts.status ?? null, opts.duration_ms ?? null]
  ).catch(err => console.error('[logger] insert failed:', err.message))
}
