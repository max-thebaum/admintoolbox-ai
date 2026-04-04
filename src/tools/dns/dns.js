// ============================================================
// DNS Lookup Tool
// ============================================================

const DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'SRV']

const TYPE_LABELS = {
  A:     { label: 'A',     desc: 'IPv4-Adresse' },
  AAAA:  { label: 'AAAA',  desc: 'IPv6-Adresse' },
  MX:    { label: 'MX',    desc: 'Mail Exchange' },
  NS:    { label: 'NS',    desc: 'Nameserver' },
  TXT:   { label: 'TXT',   desc: 'Texteinträge' },
  CNAME: { label: 'CNAME', desc: 'Canonical Name' },
  SOA:   { label: 'SOA',   desc: 'Start of Authority' },
  CAA:   { label: 'CAA',   desc: 'Cert. Authority Authorization' },
  SRV:   { label: 'SRV',   desc: 'Service Record' }
}

export function html() {
  return `
<div class="tool-panel">
  <div class="tool-header">
    <h2>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      DNS Lookup
    </h2>
    <p>Alle DNS-Einträge einer Domain abfragen — A, AAAA, MX, NS, TXT, CNAME, SOA und mehr</p>
  </div>

  <div class="tool-body">
    <!-- Input -->
    <div class="dns-input-row">
      <div class="form-row" style="flex:1">
        <label for="dns-domain">Domain</label>
        <input id="dns-domain" class="input mono" type="text"
               placeholder="example.com" autocomplete="off"
               aria-describedby="dns-err" />
      </div>
      <div class="form-row dns-lookup-btn-wrap">
        <label>&nbsp;</label>
        <button class="btn btn-primary" id="dns-lookup-btn">Abfragen</button>
      </div>
    </div>

    <!-- Record type filter -->
    <div class="dns-type-filter" id="dns-type-filter" role="group" aria-label="DNS-Eintragstypen">
      <span class="dns-filter-label">Typen:</span>
      <button class="dns-type-btn active" data-type="ALL">Alle</button>
      ${DNS_TYPES.map(t => `<button class="dns-type-btn" data-type="${t}">${t}</button>`).join('')}
    </div>

    <div class="input-error-msg" id="dns-err" role="alert"></div>

    <!-- Results -->
    <div id="dns-results" style="display:none">
      <div class="divider"></div>
      <div id="dns-results-inner"></div>
    </div>

    <!-- Loading -->
    <div id="dns-loading" style="display:none">
      <div class="divider"></div>
      <div class="blog-loading"><div class="spinner"></div><span>Abfrage läuft…</span></div>
    </div>
  </div>
</div>
  `
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderRecordSection(type, records) {
  const info = TYPE_LABELS[type] || { label: type, desc: '' }
  if (records.length === 0) return ''

  const rows = records.map(r => `
    <tr>
      <td class="mono">${escHtml(r.name)}</td>
      <td>${r.ttl}s</td>
      <td class="mono dns-data">${escHtml(r.data)}</td>
    </tr>
  `).join('')

  return `
    <div class="dns-section" data-type="${type}">
      <div class="dns-section-header">
        <span class="badge badge-accent">${info.label}</span>
        <span class="dns-section-desc">${info.desc}</span>
        <span class="dns-record-count">${records.length} Eintrag${records.length !== 1 ? 'e' : ''}</span>
      </div>
      <div class="ref-table-wrap" style="margin-top:8px">
        <table class="ref-table dns-table" aria-label="${info.label} Einträge">
          <thead><tr><th>Name</th><th>TTL</th><th>Wert</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `
}

function renderResults(domain, data) {
  const { results, errors } = data
  const hasAny = Object.values(results).some(r => r.length > 0)

  if (!hasAny) {
    return `
      <div class="dns-no-results">
        <p>Keine DNS-Einträge für <strong>${escHtml(domain)}</strong> gefunden.</p>
        <p style="font-size:13px;color:var(--text-muted)">Die Domain existiert möglicherweise nicht oder hat keine Einträge für die abgefragten Typen.</p>
      </div>
    `
  }

  const sections = DNS_TYPES
    .filter(t => results[t] && results[t].length > 0)
    .map(t => renderRecordSection(t, results[t]))
    .join('')

  const errorWarnings = Object.entries(errors)
    .map(([t, msg]) => `<span class="dns-error-badge">${t}: ${escHtml(msg)}</span>`)
    .join('')

  return `
    <div class="dns-summary">
      <span>Ergebnisse für <strong class="mono">${escHtml(domain)}</strong></span>
      ${errorWarnings ? `<div class="dns-errors">${errorWarnings}</div>` : ''}
    </div>
    <div id="dns-sections">${sections}</div>
  `
}

export function init(container) {
  const domainInput = container.querySelector('#dns-domain')
  const lookupBtn   = container.querySelector('#dns-lookup-btn')
  const errEl       = container.querySelector('#dns-err')
  const resultsWrap = container.querySelector('#dns-results')
  const resultsInner = container.querySelector('#dns-results-inner')
  const loadingEl   = container.querySelector('#dns-loading')
  const typeFilter  = container.querySelector('#dns-type-filter')

  let activeType = 'ALL'
  let lastDomain = ''

  // Type filter buttons
  typeFilter.querySelectorAll('.dns-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeType = btn.dataset.type
      typeFilter.querySelectorAll('.dns-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === activeType))
      filterSections()
    })
  })

  function filterSections() {
    container.querySelectorAll('.dns-section').forEach(sec => {
      sec.style.display = (activeType === 'ALL' || sec.dataset.type === activeType) ? 'block' : 'none'
    })
  }

  async function lookup() {
    const domain = domainInput.value.trim()
    errEl.textContent = ''

    if (!domain) {
      errEl.textContent = 'Bitte Domain eingeben (z. B. example.com)'
      return
    }

    lastDomain = domain
    lookupBtn.disabled    = true
    lookupBtn.textContent = 'Abfrage…'
    resultsWrap.style.display = 'none'
    loadingEl.style.display   = 'block'

    try {
      const res  = await fetch(`/api/dns/lookup?domain=${encodeURIComponent(domain)}`)
      const data = await res.json()

      if (!res.ok) {
        errEl.textContent = data.error || 'Abfrage fehlgeschlagen.'
        loadingEl.style.display = 'none'
        return
      }

      resultsInner.innerHTML    = renderResults(domain, data)
      resultsWrap.style.display = 'block'
      loadingEl.style.display   = 'none'
      filterSections()

    } catch {
      errEl.textContent = 'Server nicht erreichbar. Ist der Backend-Server gestartet?'
      loadingEl.style.display = 'none'
    } finally {
      lookupBtn.disabled    = false
      lookupBtn.textContent = 'Abfragen'
    }
  }

  lookupBtn.addEventListener('click', lookup)
  domainInput.addEventListener('keydown', e => { if (e.key === 'Enter') lookup() })

  // Pre-fill from URL if ?domain= param
  const urlDomain = new URLSearchParams(location.search).get('domain')
  if (urlDomain) {
    domainInput.value = urlDomain
    lookup()
  } else {
    domainInput.focus()
  }
}
