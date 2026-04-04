// ============================================================
// Traceroute — SSE streaming traceroute via server
// ============================================================

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Traceroute</h1>
        <p class="tool-subtitle">Route zu einem Ziel-Host live verfolgen — Hop für Hop</p>
      </div>

      <div class="tr-search">
        <input
          type="text"
          id="tr-input"
          class="input"
          placeholder="Hostname oder IP, z. B. 8.8.8.8 oder google.com"
          autocomplete="off"
          spellcheck="false"
        />
        <button id="tr-start" class="btn btn-primary">Start</button>
        <button id="tr-stop"  class="btn btn-secondary" hidden>Stop</button>
      </div>

      <div id="tr-error" class="tr-error" hidden></div>

      <div id="tr-wrap" hidden>
        <div class="tr-status" id="tr-status"></div>
        <div class="tr-table-wrap">
          <table class="tr-table">
            <thead>
              <tr>
                <th class="tr-th-hop">#</th>
                <th>Host</th>
                <th>IP</th>
                <th class="tr-th-rtt">RTT 1</th>
                <th class="tr-th-rtt">RTT 2</th>
                <th class="tr-th-rtt">RTT 3</th>
              </tr>
            </thead>
            <tbody id="tr-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

export function init(container) {
  const input    = container.querySelector('#tr-input')
  const startBtn = container.querySelector('#tr-start')
  const stopBtn  = container.querySelector('#tr-stop')
  const errorEl  = container.querySelector('#tr-error')
  const wrap     = container.querySelector('#tr-wrap')
  const statusEl = container.querySelector('#tr-status')
  const tbody    = container.querySelector('#tr-tbody')

  let es = null

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.hidden = false
  }

  function clearError() {
    errorEl.hidden = true
    errorEl.textContent = ''
  }

  function setRunning(running) {
    startBtn.hidden  = running
    stopBtn.hidden   = !running
    input.disabled   = running
  }

  function rttCell(val) {
    if (val == null) return `<td class="tr-rtt tr-timeout">*</td>`
    return `<td class="tr-rtt">${val.toFixed(1)} ms</td>`
  }

  function addHopRow(hop) {
    const existing = tbody.querySelector(`tr[data-hop="${hop.hop}"]`)
    const rtts = hop.timeout
      ? [null, null, null]
      : [hop.rtts[0] ?? null, hop.rtts[1] ?? null, hop.rtts[2] ?? null]

    const rowHtml = `
      <tr data-hop="${hop.hop}" class="${hop.timeout ? 'tr-row-timeout' : ''}">
        <td class="tr-hop-num">${hop.hop}</td>
        <td class="tr-host">${hop.timeout ? '<span class="tr-star">* * *</span>' : escapeHtml(hop.host || hop.ip || '—')}</td>
        <td class="mono tr-ip">${hop.timeout ? '' : (hop.ip && hop.ip !== hop.host ? escapeHtml(hop.ip) : '—')}</td>
        ${rttCell(rtts[0])}
        ${rttCell(rtts[1])}
        ${rttCell(rtts[2])}
      </tr>
    `
    if (existing) {
      existing.outerHTML = rowHtml
    } else {
      tbody.insertAdjacentHTML('beforeend', rowHtml)
    }
  }

  function startTrace() {
    const target = input.value.trim()
    if (!target) { showError('Bitte einen Hostnamen oder eine IP eingeben.'); return }

    clearError()
    tbody.innerHTML = ''
    wrap.hidden = false
    statusEl.textContent = `Traceroute zu ${target} …`
    setRunning(true)

    if (es) { es.close(); es = null }

    es = new EventSource(`/api/traceroute?target=${encodeURIComponent(target)}`)

    es.onmessage = (e) => {
      let data
      try { data = JSON.parse(e.data) } catch { return }

      switch (data.type) {
        case 'start':
          statusEl.textContent = `Traceroute zu ${data.target} …`
          break
        case 'hop':
          addHopRow(data)
          break
        case 'error':
          showError(data.message || 'Unbekannter Fehler')
          break
        case 'done':
          statusEl.textContent = `Fertig — ${tbody.querySelectorAll('tr').length} Hops`
          cleanup(false)
          break
        case 'timeout':
          statusEl.textContent = 'Timeout — Traceroute abgebrochen'
          cleanup(false)
          break
      }
    }

    es.onerror = () => {
      if (!wrap.hidden && statusEl.textContent.startsWith('Traceroute')) {
        showError('Verbindung zum Server unterbrochen.')
      }
      cleanup(false)
    }
  }

  function cleanup(showDone) {
    if (es) { es.close(); es = null }
    setRunning(false)
    if (showDone) statusEl.textContent = 'Gestoppt.'
  }

  startBtn.addEventListener('click', startTrace)
  stopBtn.addEventListener('click', () => { cleanup(true) })
  input.addEventListener('keydown', e => { if (e.key === 'Enter') startTrace() })

  // Stop stream when navigating away
  window.addEventListener('at:navigate', () => { if (es) { es.close(); es = null } }, { once: true })
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
