// ============================================================
// IP-Info / Geolocation — ip-api.com (free, CORS-friendly)
// ============================================================

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">IP-Info</h1>
        <p class="tool-subtitle">Geolocation, ISP, ASN und Netzwerkinfos zu einer IP-Adresse</p>
      </div>

      <div class="ipinfo-search">
        <input
          type="text"
          id="ipinfo-input"
          class="input"
          placeholder="IP-Adresse oder Domain, z. B. 8.8.8.8 oder leer lassen für eigene IP"
          autocomplete="off"
          spellcheck="false"
        />
        <button id="ipinfo-btn" class="btn btn-primary">Abfragen</button>
      </div>

      <button id="ipinfo-own-btn" class="btn btn-secondary ipinfo-own-btn">Meine IP anzeigen</button>

      <div id="ipinfo-error" class="ipinfo-error" hidden></div>
      <div id="ipinfo-spinner" class="spinner" hidden></div>
      <div id="ipinfo-result" hidden></div>

      <details id="ipinfo-whois" class="ipinfo-whois-details" hidden>
        <summary class="ipinfo-whois-summary">
          WHOIS / RDAP
          <span class="ipinfo-whois-chevron">▸</span>
        </summary>
        <div id="ipinfo-whois-body" class="ipinfo-whois-body">
          <div class="spinner" id="ipinfo-whois-spinner" hidden></div>
          <div id="ipinfo-whois-error" class="ipinfo-error" hidden></div>
          <div id="ipinfo-whois-result"></div>
        </div>
      </details>
    </div>
  `
}

export function init(container) {
  const input     = container.querySelector('#ipinfo-input')
  const queryBtn  = container.querySelector('#ipinfo-btn')
  const ownBtn    = container.querySelector('#ipinfo-own-btn')
  const spinner   = container.querySelector('#ipinfo-spinner')
  const errorEl   = container.querySelector('#ipinfo-error')
  const resultEl  = container.querySelector('#ipinfo-result')
  const whoisDetails = container.querySelector('#ipinfo-whois')
  const whoisBody    = container.querySelector('#ipinfo-whois-body')
  const whoisSpinner = container.querySelector('#ipinfo-whois-spinner')
  const whoisError   = container.querySelector('#ipinfo-whois-error')
  const whoisResult  = container.querySelector('#ipinfo-whois-result')

  let lastQuery = ''
  let whoisLoaded = false

  const FIELDS = 'status,message,continent,continentCode,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,query'

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.hidden = false
    resultEl.hidden = true
  }

  function clearError() {
    errorEl.hidden = true
    errorEl.textContent = ''
  }

  async function lookup(target) {
    clearError()
    resultEl.hidden = true
    spinner.hidden = false
    queryBtn.disabled = true
    ownBtn.disabled = true

    try {
      const endpoint = target
        ? `https://pro.ip-api.com/json/${encodeURIComponent(target)}?fields=${FIELDS}&lang=de`
        : `https://ip-api.com/json/?fields=${FIELDS}&lang=de`

      // ip-api.com free tier has no HTTPS for pro endpoints; use http for free tier
      const freeEndpoint = target
        ? `http://ip-api.com/json/${encodeURIComponent(target)}?fields=${FIELDS}&lang=de`
        : `http://ip-api.com/json/?fields=${FIELDS}&lang=de`

      const res = await fetch(freeEndpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()

      if (d.status === 'fail') {
        showError(d.message || 'Ungültige IP-Adresse oder Domain.')
        return
      }

      lastQuery = d.query || target
      whoisLoaded = false
      whoisDetails.hidden = false
      whoisDetails.open = false
      whoisResult.innerHTML = ''
      whoisError.hidden = true
      renderResult(d)
    } catch {
      showError('Abfrage fehlgeschlagen. Bitte Internetverbindung prüfen.')
    } finally {
      spinner.hidden = true
      queryBtn.disabled = false
      ownBtn.disabled = false
    }
  }

  function flag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return ''
    return countryCode.toUpperCase().replace(/./g, c =>
      String.fromCodePoint(c.charCodeAt(0) + 127397)
    )
  }

  function renderResult(d) {
    resultEl.hidden = false

    const rows = [
      ['IP-Adresse',   d.query,                   'mono'],
      ['Land',         `${flag(d.countryCode)} ${d.country}`,  ''],
      ['Region',       d.regionName,              ''],
      ['Stadt',        `${d.city}${d.zip ? ` (${d.zip})` : ''}`, ''],
      ['Kontinent',    d.continent,               ''],
      ['Zeitzone',     d.timezone,                'mono'],
      ['ISP',          d.isp,                     ''],
      ['Organisation', d.org,                     ''],
      ['AS',           d.as,                      'mono'],
      ['AS-Name',      d.asname,                  ''],
      ['Koordinaten',  d.lat && d.lon ? `${d.lat}, ${d.lon}` : '—', 'mono'],
    ].filter(([, val]) => val && val !== '—')

    const tags = [
      d.proxy   && { label: 'Proxy / VPN', cls: 'tag-warn' },
      d.hosting && { label: 'Hosting / Datacenter', cls: 'tag-info' },
      d.mobile  && { label: 'Mobil', cls: 'tag-info' },
    ].filter(Boolean)

    resultEl.innerHTML = `
      <div class="ipinfo-card">
        <div class="ipinfo-ip-header">
          <span class="ipinfo-ip-main">${escapeHtml(d.query)}</span>
          ${tags.map(t => `<span class="ipinfo-tag ${t.cls}">${t.label}</span>`).join('')}
        </div>
        <div class="ipinfo-table">
          ${rows.map(([label, val, cls]) => `
            <div class="ipinfo-row">
              <span class="ipinfo-label">${label}</span>
              <span class="ipinfo-value ${cls === 'mono' ? 'mono' : ''}">${escapeHtml(String(val))}</span>
            </div>
          `).join('')}
        </div>
        ${d.lat && d.lon ? `
          <a
            class="ipinfo-map-link"
            href="https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lon}&zoom=10"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path fill-rule="evenodd" d="m7.539 14.841.003.003.002.001a.75.75 0 0 0 .912 0l.002-.001.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597a5 5 0 0 0-10 0c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
            </svg>
            Auf Karte anzeigen (OpenStreetMap)
          </a>
        ` : ''}
      </div>
    `
  }

  async function loadWhois(q) {
    if (!q) return
    whoisLoaded = true
    whoisSpinner.hidden = false
    whoisError.hidden = true
    whoisResult.innerHTML = ''

    try {
      const res = await fetch(`/api/whois?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) { whoisError.textContent = data.error || 'WHOIS nicht verfügbar.'; whoisError.hidden = false; return }
      renderWhois(data)
    } catch {
      whoisError.textContent = 'WHOIS-Abfrage fehlgeschlagen.'
      whoisError.hidden = false
    } finally {
      whoisSpinner.hidden = true
    }
  }

  function whoisRow(label, val) {
    if (!val) return ''
    return `<div class="ipinfo-row"><span class="ipinfo-label">${label}</span><span class="ipinfo-value">${escapeHtml(String(val))}</span></div>`
  }

  function renderWhois(d) {
    if (d.type === 'ip') {
      whoisResult.innerHTML = `
        <div class="ipinfo-table">
          ${whoisRow('Handle',      d.handle)}
          ${whoisRow('Netzname',    d.name)}
          ${whoisRow('Organisation', d.org)}
          ${whoisRow('Land',        d.country)}
          ${whoisRow('CIDR / Range', d.cidr)}
          ${whoisRow('Erstellt',    d.created)}
          ${whoisRow('Aktualisiert', d.updated)}
        </div>
        ${d.rdapUrl ? `<a href="${escapeHtml(d.rdapUrl)}" target="_blank" rel="noopener noreferrer" class="ipinfo-map-link" style="margin-top:8px;display:inline-block">RDAP-Quelle ↗</a>` : ''}
      `
    } else {
      const nsHtml = d.nameservers?.length
        ? d.nameservers.map(ns => `<span class="ipinfo-tag tag-info">${escapeHtml(ns)}</span>`).join('')
        : ''
      const statusHtml = d.status?.length
        ? d.status.map(s => `<span class="ipinfo-tag tag-info">${escapeHtml(s)}</span>`).join('')
        : ''
      whoisResult.innerHTML = `
        <div class="ipinfo-table">
          ${whoisRow('Domain',     d.name)}
          ${whoisRow('Registrar',  d.registrar)}
          ${whoisRow('Registrant', d.registrant)}
          ${whoisRow('Erstellt',   d.created)}
          ${whoisRow('Läuft ab',   d.expires)}
          ${whoisRow('Aktualisiert', d.updated)}
        </div>
        ${nsHtml   ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">${nsHtml}</div>`   : ''}
        ${statusHtml ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px">${statusHtml}</div>` : ''}
        ${d.rdapUrl ? `<a href="${escapeHtml(d.rdapUrl)}" target="_blank" rel="noopener noreferrer" class="ipinfo-map-link" style="margin-top:8px;display:inline-block">RDAP-Quelle ↗</a>` : ''}
      `
    }
  }

  // Lazy-load WHOIS when accordion is opened
  whoisDetails.addEventListener('toggle', () => {
    if (whoisDetails.open && !whoisLoaded) loadWhois(lastQuery)
  })

  // Events
  queryBtn.addEventListener('click', () => lookup(input.value.trim()))
  ownBtn.addEventListener('click', () => { input.value = ''; lookup('') })
  input.addEventListener('keydown', e => { if (e.key === 'Enter') lookup(input.value.trim()) })
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
