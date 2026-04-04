export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">Port Checker</h1>
        <p class="tool-subtitle">TCP-Port auf Erreichbarkeit prüfen</p>
      </div>
      <div class="tool-body">

        <div class="form-grid">
          <div class="form-row">
            <label for="pc-host">Hostname / IP-Adresse</label>
            <input id="pc-host" class="input" type="text" placeholder="z.B. example.com oder 8.8.8.8">
          </div>
          <div class="form-row">
            <label for="pc-port">Port</label>
            <input id="pc-port" class="input" type="number" min="1" max="65535" placeholder="z.B. 443">
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="pc-check-btn">Port prüfen</button>
        </div>

        <div class="input-error-msg" id="pc-err" role="alert"></div>

        <div id="pc-result" hidden>
          <div class="pc-result-card" id="pc-result-card">
            <div class="pc-status-icon" id="pc-icon"></div>
            <div class="pc-result-info">
              <div class="pc-status-label" id="pc-status-label"></div>
              <div class="pc-status-detail" id="pc-status-detail"></div>
            </div>
          </div>
        </div>

      </div>
    </div>`
}

const STATUS_MAP = {
  open:      { label: 'Offen',         detail: 'Der Port ist erreichbar.',         color: 'var(--success, #3fb950)', icon: '✓' },
  closed:    { label: 'Geschlossen',   detail: 'Verbindung abgelehnt (ECONNREFUSED).', color: 'var(--error, #f85149)', icon: '✗' },
  timeout:   { label: 'Timeout',       detail: 'Keine Antwort innerhalb von 5 Sekunden.', color: 'var(--warning, #d29922)', icon: '⏱' },
  error_dns: { label: 'DNS-Fehler',    detail: 'Hostname konnte nicht aufgelöst werden.', color: 'var(--error, #f85149)', icon: '?' },
  error:     { label: 'Fehler',        detail: 'Verbindungsfehler.',               color: 'var(--error, #f85149)', icon: '!' },
}

export function init(container) {
  const hostEl   = container.querySelector('#pc-host')
  const portEl   = container.querySelector('#pc-port')
  const errEl    = container.querySelector('#pc-err')
  const resultEl = container.querySelector('#pc-result')
  const cardEl   = container.querySelector('#pc-result-card')
  const checkBtn = container.querySelector('#pc-check-btn')

  async function doCheck() {
    errEl.textContent = ''
    resultEl.hidden   = true

    const host = hostEl.value.trim()
    const port = portEl.value.trim()
    if (!host || !port) { errEl.textContent = 'Bitte Hostname und Port eingeben.'; return }

    checkBtn.disabled    = true
    checkBtn.textContent = 'Prüfe…'

    try {
      const res  = await fetch(`/api/portcheck?host=${encodeURIComponent(host)}&port=${encodeURIComponent(port)}`)
      const data = await res.json()

      if (!res.ok) { errEl.textContent = data.error || 'Fehler beim Prüfen.'; return }

      const info = STATUS_MAP[data.status] || STATUS_MAP.error
      container.querySelector('#pc-icon').textContent          = info.icon
      container.querySelector('#pc-status-label').textContent  = info.label
      container.querySelector('#pc-status-detail').textContent = info.detail + (data.ms != null ? ` (${data.ms} ms)` : '')
      cardEl.style.borderColor = info.color
      container.querySelector('#pc-icon').style.color          = info.color
      resultEl.hidden = false
    } catch {
      errEl.textContent = 'Server nicht erreichbar.'
    } finally {
      checkBtn.disabled    = false
      checkBtn.textContent = 'Port prüfen'
    }
  }

  checkBtn.addEventListener('click', doCheck)
  portEl.addEventListener('keydown', e => { if (e.key === 'Enter') doCheck() })
  hostEl.addEventListener('keydown', e => { if (e.key === 'Enter') portEl.focus() })
}
