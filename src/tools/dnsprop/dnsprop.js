export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">DNS Propagation</h1>
        <p class="tool-subtitle">DNS-Ausbreitung auf 8 globalen Resolvern prüfen</p>
      </div>
      <div class="tool-body">

        <div class="form-grid">
          <div class="form-row">
            <label for="dp-domain">Domain</label>
            <input id="dp-domain" class="input" type="text" placeholder="z.B. example.com">
          </div>
          <div class="form-row">
            <label for="dp-type">Record-Typ</label>
            <select id="dp-type" class="select">
              <option>A</option>
              <option>AAAA</option>
              <option>MX</option>
              <option>TXT</option>
              <option>NS</option>
            </select>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="dp-check-btn">Prüfen</button>
        </div>

        <div class="input-error-msg" id="dp-err" role="alert"></div>

        <div id="dp-result" hidden>
          <div class="dp-summary" id="dp-summary"></div>
          <div class="dp-table-wrap">
            <table class="dp-table">
              <thead>
                <tr>
                  <th>Resolver</th>
                  <th>Standort</th>
                  <th>IP</th>
                  <th>Ergebnis</th>
                </tr>
              </thead>
              <tbody id="dp-tbody"></tbody>
            </table>
          </div>
        </div>

      </div>
    </div>`
}

export function init(container) {
  const domainEl = container.querySelector('#dp-domain')
  const typeEl   = container.querySelector('#dp-type')
  const errEl    = container.querySelector('#dp-err')
  const resultEl = container.querySelector('#dp-result')
  const checkBtn = container.querySelector('#dp-check-btn')

  async function doCheck() {
    errEl.textContent = ''
    resultEl.hidden   = true

    const domain = domainEl.value.trim()
    if (!domain) { errEl.textContent = 'Bitte Domain eingeben.'; return }

    checkBtn.disabled    = true
    checkBtn.textContent = 'Prüfe…'

    try {
      const type = typeEl.value
      const res  = await fetch(`/api/dnsprop?domain=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`)
      const data = await res.json()

      if (!res.ok) { errEl.textContent = data.error || 'Fehler beim Prüfen.'; return }

      const okCount = data.results.filter(r => r.status === 'ok').length
      container.querySelector('#dp-summary').textContent =
        `${okCount} von ${data.results.length} Resolvern haben eine Antwort zurückgegeben.`

      const tbody = container.querySelector('#dp-tbody')
      tbody.innerHTML = data.results.map(r => {
        const isOk = r.status === 'ok'
        return `<tr class="${isOk ? '' : 'dp-row-err'}">
          <td class="dp-name">${r.name}</td>
          <td class="dp-loc">${r.location}</td>
          <td class="dp-ip">${r.ip}</td>
          <td class="dp-records">${r.result.map(v => `<span class="dp-record">${esc(v)}</span>`).join('')}</td>
        </tr>`
      }).join('')

      resultEl.hidden = false
    } catch {
      errEl.textContent = 'Server nicht erreichbar.'
    } finally {
      checkBtn.disabled    = false
      checkBtn.textContent = 'Prüfen'
    }
  }

  checkBtn.addEventListener('click', doCheck)
  domainEl.addEventListener('keydown', e => { if (e.key === 'Enter') doCheck() })

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }
}
