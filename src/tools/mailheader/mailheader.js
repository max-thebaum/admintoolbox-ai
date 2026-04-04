// ============================================================
// Mail Header Analyzer — pure client-side
// ============================================================

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Mail Header Analyzer</h1>
        <p class="tool-subtitle">E-Mail-Header analysieren — Routing, Authentifizierung, Spam-Score</p>
      </div>

      <div class="mh-input-wrap">
        <textarea
          id="mh-input"
          class="input mh-textarea"
          placeholder="Vollständige E-Mail-Header hier einfügen…

Beispiel:
Received: from mail.example.com ([1.2.3.4])
        by mx.google.com with ESMTP
        for <user@gmail.com>; Mon, 1 Apr 2024 10:00:00 +0000
From: sender@example.com
To: user@gmail.com
Subject: Test
Date: Mon, 1 Apr 2024 10:00:00 +0000
Authentication-Results: mx.google.com;
   dkim=pass; spf=pass; dmarc=pass"
          rows="10"
          spellcheck="false"
        ></textarea>
        <div class="mh-input-actions">
          <button id="mh-analyze-btn" class="btn btn-primary">Analysieren</button>
          <button id="mh-clear-btn"   class="btn btn-secondary">Löschen</button>
        </div>
      </div>

      <div id="mh-error"  class="mh-error"  hidden></div>
      <div id="mh-result" hidden></div>
    </div>
  `
}

export function init(container) {
  const textarea  = container.querySelector('#mh-input')
  const analyzeBtn= container.querySelector('#mh-analyze-btn')
  const clearBtn  = container.querySelector('#mh-clear-btn')
  const errorEl   = container.querySelector('#mh-error')
  const resultEl  = container.querySelector('#mh-result')

  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; resultEl.hidden = true }
  function clearError()   { errorEl.hidden = true; errorEl.textContent = '' }

  analyzeBtn.addEventListener('click', analyze)
  clearBtn.addEventListener('click', () => {
    textarea.value = ''; resultEl.hidden = true; clearError()
  })
  textarea.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) analyze() })

  function analyze() {
    const raw = textarea.value.trim()
    if (!raw) { showError('Bitte Header einfügen.'); return }
    clearError()

    // Strip email body (everything after blank line)
    const headerText = raw.split(/\r?\n\r?\n/)[0]
    const headers = parseHeaders(headerText)
    if (!headers.length) { showError('Keine gültigen Header erkannt.'); return }

    render(headers)
  }

  // ── Rendering ───────────────────────────────────────────────────
  function render(headers) {
    const get  = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
    const getAll = (name) => headers.filter(h => h.name.toLowerCase() === name.toLowerCase()).map(h => h.value)

    const summary = buildSummary(headers, get)
    const auth    = buildAuth(headers, get, getAll)
    const routing = buildRouting(getAll('Received'))
    const spam    = buildSpam(headers, get)
    const allRows = buildAllHeaders(headers)

    resultEl.hidden = false
    resultEl.innerHTML = `
      ${summary}
      ${auth}
      ${spam}
      ${routing}
      ${allRows}
    `
  }

  // ── Summary ──────────────────────────────────────────────────────
  function buildSummary(headers, get) {
    const rows = [
      ['Von',        get('From')       || get('from')],
      ['An',         get('To')         || get('to')],
      ['CC',         get('Cc')         || get('cc')],
      ['Betreff',    get('Subject')    || get('subject')],
      ['Datum',      get('Date')       || get('date')],
      ['Message-ID', get('Message-ID') || get('message-id')],
      ['Reply-To',   get('Reply-To')   || get('reply-to')],
    ].filter(([, v]) => v)

    return `
      <div class="mh-section">
        <div class="mh-section-title">Zusammenfassung</div>
        <div class="mh-card">
          ${rows.map(([l, v]) => `
            <div class="mh-row">
              <span class="mh-label">${escapeHtml(l)}</span>
              <span class="mh-value">${escapeHtml(v)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  // ── Authentication ───────────────────────────────────────────────
  function buildAuth(headers, get, getAll) {
    // Collect all Authentication-Results values
    const authResults = getAll('Authentication-Results').join(' ')
    const receivedSpf = get('Received-SPF')

    const spf   = extractAuthResult(authResults, 'spf')   || extractSpfResult(receivedSpf)
    const dkim  = extractAuthResult(authResults, 'dkim')
    const dmarc = extractAuthResult(authResults, 'dmarc')
    const arc   = extractAuthResult(authResults, 'arc')

    if (!spf && !dkim && !dmarc && !arc) return ''

    const badge = (label, result) => {
      if (!result) return ''
      const cls = result === 'pass' ? 'mh-badge--ok'
                : result === 'fail' ? 'mh-badge--err'
                : 'mh-badge--warn'
      return `<div class="mh-auth-item">
        <span class="mh-auth-label">${label}</span>
        <span class="mh-badge ${cls}">${escapeHtml(result)}</span>
      </div>`
    }

    return `
      <div class="mh-section">
        <div class="mh-section-title">Authentifizierung</div>
        <div class="mh-auth-row">
          ${badge('SPF',   spf)}
          ${badge('DKIM',  dkim)}
          ${badge('DMARC', dmarc)}
          ${arc ? badge('ARC', arc) : ''}
        </div>
      </div>
    `
  }

  function extractAuthResult(authStr, protocol) {
    if (!authStr) return null
    const re = new RegExp(protocol + '=(\\S+)', 'i')
    const m  = authStr.match(re)
    if (!m) return null
    return m[1].replace(/[;,].*$/, '').toLowerCase()
  }

  function extractSpfResult(receivedSpf) {
    if (!receivedSpf) return null
    const m = receivedSpf.match(/^(\w+)/i)
    return m ? m[1].toLowerCase() : null
  }

  // ── Spam ─────────────────────────────────────────────────────────
  function buildSpam(headers, get) {
    const score  = get('X-Spam-Score') || get('X-SpamScore')
    const status = get('X-Spam-Status')
    const flag   = get('X-Spam-Flag')
    const report = get('X-Spam-Report')

    if (!score && !status && !flag) return ''

    const isSpam   = (flag || '').toUpperCase() === 'YES' || (status || '').toLowerCase().startsWith('yes')
    const scoreNum = parseFloat(score)

    let scoreBadge = ''
    if (!isNaN(scoreNum)) {
      const cls = scoreNum >= 5 ? 'mh-badge--err' : scoreNum >= 2 ? 'mh-badge--warn' : 'mh-badge--ok'
      scoreBadge = `<span class="mh-badge ${cls}">Score: ${scoreNum}</span>`
    }

    const rows = [
      score  && ['Score',   score],
      status && ['Status',  status],
      flag   && ['Flag',    flag],
      report && ['Report',  report],
    ].filter(Boolean)

    return `
      <div class="mh-section">
        <div class="mh-section-title">
          Spam-Analyse
          ${isSpam ? '<span class="mh-badge mh-badge--err" style="margin-left:8px">SPAM</span>' : scoreBadge}
        </div>
        <div class="mh-card">
          ${rows.map(([l, v]) => `
            <div class="mh-row">
              <span class="mh-label">${escapeHtml(l)}</span>
              <span class="mh-value mono">${escapeHtml(v)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  // ── Routing (Received headers) ───────────────────────────────────
  function buildRouting(receivedHeaders) {
    if (!receivedHeaders.length) return ''

    // Received headers are newest-first; reverse for chronological order
    const hops = receivedHeaders.map(parseReceived).reverse()

    // Calculate delays
    let totalDelay = null
    hops.forEach((hop, i) => {
      if (i === 0) { hop.delay = null; return }
      const prev = hops[i - 1]
      if (hop.date && prev.date) {
        hop.delay = Math.round((hop.date - prev.date) / 1000)
      }
    })

    if (hops[0]?.date && hops[hops.length - 1]?.date) {
      totalDelay = Math.round((hops[hops.length - 1].date - hops[0].date) / 1000)
    }

    const rows = hops.map((hop, i) => `
      <tr>
        <td class="mh-hop-num">${i + 1}</td>
        <td class="mh-hop-from">${escapeHtml(hop.from || '—')}</td>
        <td class="mh-hop-by">${escapeHtml(hop.by || '—')}</td>
        <td class="mh-hop-proto">${escapeHtml(hop.proto || '—')}</td>
        <td class="mh-hop-date">${hop.date ? hop.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }) : '—'}</td>
        <td class="mh-hop-delay">${hop.delay != null ? delayBadge(hop.delay) : '—'}</td>
      </tr>
    `).join('')

    const totalHtml = totalDelay != null
      ? `<div class="mh-routing-total">Gesamtdauer: <strong>${fmtDelay(totalDelay)}</strong></div>`
      : ''

    return `
      <div class="mh-section">
        <div class="mh-section-title">Routing-Pfad (${hops.length} Hops)</div>
        <div class="mh-table-wrap">
          <table class="mh-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Von</th>
                <th>Über (by)</th>
                <th>Protokoll</th>
                <th>Zeit</th>
                <th>Verzögerung</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${totalHtml}
      </div>
    `
  }

  function parseReceived(val) {
    const hop = { from: null, by: null, proto: null, date: null, delay: null }

    const fromM  = val.match(/from\s+(\S+)/i)
    const byM    = val.match(/by\s+(\S+)/i)
    const withM  = val.match(/with\s+(\S+)/i)

    if (fromM) hop.from  = fromM[1]
    if (byM)   hop.by    = byM[1]
    if (withM) hop.proto = withM[1].toUpperCase()

    // Date is after the last semicolon
    const semi = val.lastIndexOf(';')
    if (semi !== -1) {
      const dateStr = val.slice(semi + 1).trim()
      const d = new Date(dateStr)
      if (!isNaN(d)) hop.date = d
    }

    return hop
  }

  function delayBadge(secs) {
    const cls = secs > 30 ? 'mh-delay--warn' : secs > 5 ? 'mh-delay--med' : 'mh-delay--ok'
    return `<span class="mh-delay ${cls}">${fmtDelay(secs)}</span>`
  }

  function fmtDelay(secs) {
    if (secs < 0)    return `−${Math.abs(secs)}s`
    if (secs < 60)   return `${secs}s`
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`
    return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
  }

  // ── All headers table ────────────────────────────────────────────
  function buildAllHeaders(headers) {
    // Deduplicate display: show count for repeated headers
    const rows = headers.map(h => `
      <tr>
        <td class="mh-all-name">${escapeHtml(h.name)}</td>
        <td class="mh-all-value">${escapeHtml(h.value)}</td>
      </tr>
    `).join('')

    return `
      <details class="mh-section mh-details">
        <summary class="mh-details-summary">
          Alle Header (${headers.length})
          <span class="mh-details-chevron">▸</span>
        </summary>
        <div class="mh-table-wrap">
          <table class="mh-table mh-all-table">
            <thead><tr><th>Name</th><th>Wert</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>
    `
  }
}

// ── Parser ────────────────────────────────────────────────────────
function parseHeaders(raw) {
  // Unfold: continuation lines (starting with whitespace) belong to previous header
  const unfolded = raw.replace(/\r?\n([ \t]+)/g, ' ')
  const lines    = unfolded.split(/\r?\n/)
  const headers  = []

  for (const line of lines) {
    if (!line.trim()) continue
    const colon = line.indexOf(':')
    if (colon < 1) continue
    const name  = line.slice(0, colon).trim()
    const value = line.slice(colon + 1).trim()
    if (name && !/\s/.test(name)) {
      headers.push({ name, value })
    }
  }

  return headers
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
