// ============================================================
// SSL/TLS Checker — certificate inspection via server-side tls module
// ============================================================

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">SSL/TLS Checker</h1>
        <p class="tool-subtitle">TLS-Zertifikat und Verbindungsparameter eines Servers prüfen</p>
      </div>

      <div class="ssl-search">
        <input
          type="text"
          id="ssl-host"
          class="input"
          placeholder="Domain, z. B. github.com"
          autocomplete="off"
          spellcheck="false"
        />
        <input
          type="number"
          id="ssl-port"
          class="input ssl-port-input"
          value="443"
          min="1"
          max="65535"
          placeholder="Port"
        />
        <button id="ssl-btn" class="btn btn-primary">Prüfen</button>
      </div>

      <div id="ssl-error"  class="ssl-error"  hidden></div>
      <div id="ssl-spinner" class="spinner"   hidden></div>
      <div id="ssl-result" hidden></div>
    </div>
  `
}

export function init(container) {
  const hostInput = container.querySelector('#ssl-host')
  const portInput = container.querySelector('#ssl-port')
  const btn       = container.querySelector('#ssl-btn')
  const errorEl   = container.querySelector('#ssl-error')
  const spinner   = container.querySelector('#ssl-spinner')
  const resultEl  = container.querySelector('#ssl-result')

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.hidden = false
    resultEl.hidden = true
  }

  function clearError() { errorEl.hidden = true; errorEl.textContent = '' }

  async function check() {
    const host = hostInput.value.trim()
    const port = parseInt(portInput.value) || 443
    if (!host) { showError('Bitte einen Hostnamen eingeben.'); return }

    clearError()
    resultEl.hidden = true
    spinner.hidden = false
    btn.disabled = true

    try {
      const res = await fetch(`/api/ssltls?host=${encodeURIComponent(host)}&port=${port}`)
      const data = await res.json()
      if (!res.ok) { showError(data.error || `Fehler ${res.status}`); return }
      render(data)
    } catch {
      showError('Abfrage fehlgeschlagen. Bitte Verbindung prüfen.')
    } finally {
      spinner.hidden = true
      btn.disabled = false
    }
  }

  function statusBadge(s) {
    const map = {
      valid:          { cls: 'ssl-badge--ok',    icon: '✓', label: 'Gültig' },
      expiring_soon:  { cls: 'ssl-badge--warn',  icon: '⚠', label: 'Läuft bald ab' },
      expired:        { cls: 'ssl-badge--err',   icon: '✗', label: 'Abgelaufen' },
      self_signed:    { cls: 'ssl-badge--info',  icon: '⊙', label: 'Self-Signed' },
    }
    const b = map[s] || map.valid
    return `<span class="ssl-badge ${b.cls}">${b.icon} ${b.label}</span>`
  }

  function progressBar(pct) {
    const safe = Math.max(0, Math.min(100, pct))
    const cls  = pct < 0 ? 'ssl-prog--err' : pct < 15 ? 'ssl-prog--warn' : 'ssl-prog--ok'
    return `
      <div class="ssl-prog-wrap">
        <div class="ssl-prog-bar ${cls}" style="width:${safe}%"></div>
      </div>
    `
  }

  function sslRow(label, value, mono) {
    if (!value && value !== 0) return ''
    return `
      <div class="ssl-row">
        <span class="ssl-label">${label}</span>
        <span class="ssl-value${mono ? ' mono' : ''}">${escapeHtml(String(value))}</span>
      </div>
    `
  }

  function render(d) {
    resultEl.hidden = false
    const pct = d.totalDays > 0 ? Math.round((d.daysLeft / d.totalDays) * 100) : (d.daysLeft < 0 ? -1 : 100)

    const sans = d.sans?.length
      ? `<div class="ssl-sans">${d.sans.map(s => `<span class="ssl-san">${escapeHtml(s)}</span>`).join('')}</div>`
      : ''

    const chain = (d.chain || []).slice(1).map((c, i) => `
      <div class="ssl-chain-item">
        <span class="ssl-chain-depth">${i + 2}</span>
        <span class="ssl-chain-cn">${escapeHtml(c.issuer || c.subject || '—')}</span>
      </div>
    `).join('')

    resultEl.innerHTML = `
      <div class="ssl-card">
        <div class="ssl-card-head">
          ${statusBadge(d.status)}
          <span class="ssl-host-label">${escapeHtml(d.host)}:${d.port}</span>
        </div>

        <div class="ssl-section-title">Zertifikat</div>
        <div class="ssl-rows">
          ${sslRow('CN (Subject)',    d.subject?.cn)}
          ${sslRow('Organisation',   d.subject?.o)}
          ${sslRow('Land',           d.subject?.c)}
          ${sslRow('Aussteller',     d.issuer?.cn)}
          ${sslRow('Ausgestellt am', d.validFrom, true)}
          ${sslRow('Läuft ab',       d.validTo,   true)}
          ${sslRow('Verbleibend',    d.daysLeft >= 0 ? `${d.daysLeft} Tage` : `Abgelaufen (${Math.abs(d.daysLeft)} Tage überfällig)`)}
          ${progressBar(pct)}
          ${sslRow('Fingerprint',    d.fingerprint,  true)}
          ${sslRow('Seriennummer',   d.serialNumber, true)}
        </div>

        <div class="ssl-section-title">Verbindung</div>
        <div class="ssl-rows">
          ${sslRow('TLS-Version',  d.protocol,      true)}
          ${sslRow('Cipher',       d.cipher?.name,  true)}
          ${sslRow('Schlüsselbits', d.cipher?.bits != null ? `${d.cipher.bits} Bit` : null)}
        </div>

        ${d.sans?.length ? `
          <div class="ssl-section-title">Subject Alternative Names (${d.sans.length})</div>
          ${sans}
        ` : ''}

        ${d.chain?.length > 1 ? `
          <div class="ssl-section-title">Zertifikatskette</div>
          <div class="ssl-chain">${chain}</div>
        ` : ''}
      </div>
    `
  }

  btn.addEventListener('click', check)
  hostInput.addEventListener('keydown', e => { if (e.key === 'Enter') check() })
  portInput.addEventListener('keydown', e => { if (e.key === 'Enter') check() })
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
