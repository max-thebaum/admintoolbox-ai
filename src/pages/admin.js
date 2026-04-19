// ============================================================
// Admin Panel — Login + Navigation Management
// ============================================================
import { getAllTools } from '../config/tools.js'

const TOKEN_KEY = 'admintoolbox-admin-token'

function getToken()    { return sessionStorage.getItem(TOKEN_KEY) }
function setToken(t)   { sessionStorage.setItem(TOKEN_KEY, t) }
function clearToken()  { sessionStorage.removeItem(TOKEN_KEY) }
function authHeaders() {
  return { 'Authorization': `Bearer ${getToken()}` }
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ---- Stats rendering ----
function renderStats(container, data) {
  const { summary, hourly, topTools, topIps, recent } = data

  // Summary cards
  container.querySelector('#sc-today').textContent  = summary.today.total.toLocaleString()
  container.querySelector('#sc-week').textContent   = summary.week.total.toLocaleString()
  container.querySelector('#sc-errors').textContent = summary.errorRate + '%'
  container.querySelector('#sc-ips').textContent    = summary.uniqueIps.toLocaleString()

  // Hourly bar chart
  renderHourlyChart(container.querySelector('#stats-chart'), hourly)

  // Top tools
  const maxCount = topTools.length ? topTools[0].count : 1
  container.querySelector('#stats-top-tools').innerHTML = topTools.length
    ? topTools.map(t => `
        <div class="stats-tool-row">
          <span class="stats-tool-name">${esc(t.path)}</span>
          <div class="stats-tool-bar-wrap">
            <div class="stats-tool-bar" style="width:${Math.round(t.count / maxCount * 100)}%"></div>
          </div>
          <span class="stats-tool-count">${t.count}</span>
        </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:13px">Noch keine Daten</p>'

  // Recent feed
  container.querySelector('#stats-feed').innerHTML = recent.length
    ? recent.map(r => {
        const statusClass = r.status >= 400 ? 'stats-status--err' : r.status >= 200 ? 'stats-status--ok' : ''
        const status = r.status ? `<span class="stats-status ${statusClass}">${r.status}</span>` : ''
        const dur    = r.duration_ms != null ? `<span class="stats-dur">${r.duration_ms}ms</span>` : ''
        const method = r.method ? `<span class="stats-method">${esc(r.method)}</span>` : ''
        return `<div class="stats-feed-row">
          <span class="stats-feed-ts">${esc(r.ts)}</span>
          <span class="stats-feed-ip">${esc(r.ip_anon)}</span>
          <span class="stats-feed-type ${r.type === 'pageview' ? 'stats-type--pv' : 'stats-type--api'}">${r.type === 'pageview' ? 'view' : 'api'}</span>
          ${method}
          <span class="stats-feed-path">${esc(r.path)}</span>
          ${status}${dur}
        </div>`
      }).join('')
    : '<p style="color:var(--text-muted);font-size:13px">Noch keine Aktivität</p>'
}

function renderHourlyChart(svg, hourly) {
  if (!svg) return
  const W = 520, H = 100
  const ML = 30, MR = 8, MT = 8, MB = 20
  const CW = W - ML - MR
  const CH = H - MT - MB
  const BARS = 24

  // Build hour→count map for last 24 hours
  const now   = new Date()
  const slots = []
  for (let i = BARS - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() - i)
    slots.push({ label: d.getHours().toString().padStart(2, '0') + ':00', count: 0 })
  }
  hourly.forEach(h => {
    const hh = h.hour + ':00'
    const slot = slots.find(s => s.label === hh)
    if (slot) slot.count = h.count
  })

  const maxVal = Math.max(...slots.map(s => s.count), 1)
  const barW   = (CW / BARS) * 0.7
  const gap    = CW / BARS

  let s = ''

  // Y gridline at max
  s += `<line x1="${ML}" y1="${MT}" x2="${W - MR}" y2="${MT}" stroke="var(--border-subtle)" stroke-width="1"/>`
  s += `<text x="${ML - 4}" y="${MT + 4}" text-anchor="end" fill="var(--text-muted)" font-size="9" font-family="monospace">${maxVal}</text>`
  s += `<line x1="${ML}" y1="${MT + CH}" x2="${W - MR}" y2="${MT + CH}" stroke="var(--border)" stroke-width="1"/>`
  s += `<text x="${ML - 4}" y="${MT + CH + 4}" text-anchor="end" fill="var(--text-muted)" font-size="9" font-family="monospace">0</text>`

  // Bars + X labels (every 4h)
  slots.forEach((slot, i) => {
    const x = ML + i * gap + (gap - barW) / 2
    const barH = slot.count > 0 ? Math.max(2, Math.round((slot.count / maxVal) * CH)) : 0
    const y = MT + CH - barH
    if (barH > 0) {
      s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH}" rx="2" fill="var(--accent)" opacity="0.8"/>`
    }
    if (i % 4 === 0) {
      s += `<text x="${(x + barW / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" fill="var(--text-muted)" font-size="9" font-family="monospace">${slot.label.slice(0,5)}</text>`
    }
  })

  svg.innerHTML = s
}

// ---- Login ----
function loginHtml() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Admin-Login
        </h2>
        <p>Anmeldung für den Verwaltungsbereich</p>
      </div>
      <div class="tool-body">
        <div class="admin-login-wrap">
          <div class="form-row">
            <label for="admin-username">Benutzername</label>
            <input id="admin-username" class="input" type="text" autocomplete="username" placeholder="admin">
          </div>
          <div class="form-row" style="margin-top:12px">
            <label for="admin-password">Passwort</label>
            <input id="admin-password" class="input" type="password" autocomplete="current-password" placeholder="••••••••">
          </div>
          <div class="input-error-msg" id="login-err" role="alert" style="margin-top:8px"></div>
          <div class="btn-row" style="margin-top:16px">
            <button class="btn btn-primary" id="login-btn">Anmelden</button>
          </div>
        </div>
      </div>
    </div>`
}

// ---- Dashboard ----
function dashboardHtml() {
  return `
    <div class="tool-panel admin-panel">
      <div class="tool-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Admin — Einstellungen
        </h2>
        <p>Navigation &amp; Statistiken verwalten</p>
      </div>
      <div class="tool-body">

        <div class="admin-toolbar">
          <button class="btn btn-secondary" id="admin-logout-btn">Abmelden</button>
        </div>

        <!-- Statistik-Dashboard -->
        <div class="admin-section">
          <div class="admin-section-header">
            <h3 class="admin-section-title">Statistiken</h3>
            <div style="display:flex;gap:8px;align-items:center">
              <span class="stats-refresh-label" id="stats-refresh-label" style="font-size:0.75rem;color:var(--text-muted)"></span>
              <button class="btn btn-sm btn-secondary" id="stats-refresh-btn">Aktualisieren</button>
            </div>
          </div>

          <!-- Summary cards -->
          <div class="stats-cards" id="stats-cards">
            <div class="stats-card"><div class="stats-card-val" id="sc-today">—</div><div class="stats-card-label">Heute</div></div>
            <div class="stats-card"><div class="stats-card-val" id="sc-week">—</div><div class="stats-card-label">7 Tage</div></div>
            <div class="stats-card"><div class="stats-card-val" id="sc-errors">—</div><div class="stats-card-label">Fehlerrate</div></div>
            <div class="stats-card"><div class="stats-card-val" id="sc-ips">—</div><div class="stats-card-label">Unique IPs</div></div>
          </div>

          <!-- Hourly bar chart -->
          <div class="stats-chart-wrap">
            <div class="stats-chart-title">Anfragen / Stunde (letzte 24h)</div>
            <svg id="stats-chart" viewBox="0 0 520 100" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block"></svg>
          </div>

          <!-- Tools + Recent side by side -->
          <div class="stats-bottom">
            <div class="stats-tools">
              <div class="stats-sub-title">Top Tools (7 Tage)</div>
              <div id="stats-top-tools" class="stats-tool-list"></div>
            </div>
            <div class="stats-recent">
              <div class="stats-sub-title">Letzte Aktivität</div>
              <div id="stats-feed" class="stats-feed"></div>
            </div>
          </div>

          <div id="stats-err" class="input-error-msg"></div>
        </div>

        <!-- Navigation verwalten -->
        <div class="admin-section">
          <div class="admin-section-header">
            <h3 class="admin-section-title">Navigation verwalten</h3>
            <button class="btn btn-secondary" id="admin-nav-add-cat-btn">+ Kategorie</button>
          </div>
          <div id="admin-nav-list" class="admin-nav-list"></div>
          <div id="admin-nav-err" class="input-error-msg"></div>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn btn-primary" id="admin-nav-save-btn">Navigation speichern</button>
          </div>
        </div>

      </div>
    </div>`
}

// ---- Exports ----
export function html() {
  return getToken() ? dashboardHtml() : loginHtml()
}

export function init(container) {
  if (getToken()) initDashboard(container)
  else initLogin(container)
}

// ---- Login ----
function initLogin(container) {
  const usernameEl = container.querySelector('#admin-username')
  const passwordEl = container.querySelector('#admin-password')
  const loginBtn   = container.querySelector('#login-btn')
  const errEl      = container.querySelector('#login-err')

  async function doLogin() {
    const username = usernameEl.value.trim()
    const password = passwordEl.value
    if (!username || !password) { errEl.textContent = 'Bitte Benutzername und Passwort eingeben.'; return }

    loginBtn.disabled = true
    loginBtn.textContent = 'Anmelden…'
    errEl.textContent = ''

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) { errEl.textContent = data.error || 'Login fehlgeschlagen.'; passwordEl.value = ''; return }
      setToken(data.token)
      container.innerHTML = dashboardHtml()
      initDashboard(container)
    } catch {
      errEl.textContent = 'Server nicht erreichbar.'
    } finally {
      loginBtn.disabled = false
      loginBtn.textContent = 'Anmelden'
    }
  }

  loginBtn.addEventListener('click', doLogin)
  passwordEl.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin() })
  usernameEl.addEventListener('keydown', e => { if (e.key === 'Enter') passwordEl.focus() })
  usernameEl.focus()
}

// ---- Dashboard ----
function initDashboard(container) {
  const logoutBtn    = container.querySelector('#admin-logout-btn')
  const navList      = container.querySelector('#admin-nav-list')
  const navErr       = container.querySelector('#admin-nav-err')
  const navSaveBtn   = container.querySelector('#admin-nav-save-btn')
  const navAddCatBtn = container.querySelector('#admin-nav-add-cat-btn')

  let navConfig = []

  async function loadNavConfig() {
    try {
      const res = await fetch('/api/settings/nav')
      navConfig = await res.json()
    } catch {
      navConfig = []
    }
    renderNavConfig()
  }

  function getAssignedTools() {
    return navConfig.flatMap(c => c.tools)
  }

  function renderNavConfig() {
    const allTools = getAllTools()
    navList.innerHTML = navConfig.map((cat, ci) => {
      const unassigned = allTools.filter(t => !getAssignedTools().includes(t.hash) || cat.tools.includes(t.hash))
        .filter(t => !cat.tools.includes(t.hash))

      return `
        <div class="admin-nav-cat" data-ci="${ci}">
          <div class="admin-nav-cat-header">
            <input class="input admin-nav-cat-name" type="text" value="${esc(cat.label)}" data-ci="${ci}" maxlength="40" aria-label="Kategoriename">
            <button class="btn btn-sm admin-nav-del-cat" data-ci="${ci}" title="Kategorie entfernen" style="color:var(--error);border-color:currentColor;background:var(--error-bg)">×</button>
          </div>
          <div class="admin-nav-tools">
            ${cat.tools.map((hash, ti) => {
              const tool = allTools.find(t => t.hash === hash)
              return tool ? `<span class="admin-nav-tool-tag">
                ${esc(tool.label)}
                <button class="admin-nav-tool-remove" data-ci="${ci}" data-ti="${ti}" title="Entfernen">×</button>
              </span>` : ''
            }).join('')}
            ${unassigned.length ? `
              <select class="select admin-nav-tool-add" data-ci="${ci}" aria-label="Tool hinzufügen">
                <option value="">+ Tool hinzufügen…</option>
                ${unassigned.map(t => `<option value="${esc(t.hash)}">${esc(t.label)}</option>`).join('')}
              </select>` : ''}
          </div>
        </div>`
    }).join('')

    navList.querySelectorAll('.admin-nav-cat-name').forEach(input => {
      input.addEventListener('input', () => {
        navConfig[parseInt(input.dataset.ci)].label = input.value
      })
    })

    navList.querySelectorAll('.admin-nav-del-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        navConfig.splice(parseInt(btn.dataset.ci), 1)
        renderNavConfig()
      })
    })

    navList.querySelectorAll('.admin-nav-tool-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const ci = parseInt(btn.dataset.ci)
        const ti = parseInt(btn.dataset.ti)
        navConfig[ci].tools.splice(ti, 1)
        renderNavConfig()
      })
    })

    navList.querySelectorAll('.admin-nav-tool-add').forEach(sel => {
      sel.addEventListener('change', () => {
        if (!sel.value) return
        const ci = parseInt(sel.dataset.ci)
        navConfig[ci].tools.push(sel.value)
        renderNavConfig()
      })
    })
  }

  navAddCatBtn.addEventListener('click', () => {
    const newId = navConfig.length ? Math.max(...navConfig.map(c => c.id)) + 1 : 1
    navConfig.push({ id: newId, label: 'Neue Kategorie', tools: [] })
    renderNavConfig()
    const inputs = navList.querySelectorAll('.admin-nav-cat-name')
    if (inputs.length) { inputs[inputs.length - 1].focus(); inputs[inputs.length - 1].select() }
  })

  navSaveBtn.addEventListener('click', async () => {
    navErr.textContent = ''
    if (navConfig.some(c => !c.label.trim())) {
      navErr.textContent = 'Alle Kategorien müssen einen Namen haben.'
      return
    }
    navSaveBtn.disabled    = true
    navSaveBtn.textContent = 'Speichere…'
    try {
      const res = await fetch('/api/settings/nav', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(navConfig)
      })
      const data = await res.json()
      if (!res.ok) { navErr.textContent = data.error || 'Fehler beim Speichern.'; return }
      navErr.style.color = 'var(--success, green)'
      navErr.textContent = 'Gespeichert!'
      setTimeout(() => { navErr.textContent = ''; navErr.style.color = '' }, 2500)
    } catch {
      navErr.textContent = 'Server nicht erreichbar.'
    } finally {
      navSaveBtn.disabled    = false
      navSaveBtn.textContent = 'Navigation speichern'
    }
  })

  logoutBtn.addEventListener('click', () => {
    clearToken()
    container.innerHTML = loginHtml()
    initLogin(container)
  })

  // ---- Statistics dashboard ----
  const statsRefreshBtn   = container.querySelector('#stats-refresh-btn')
  const statsRefreshLabel = container.querySelector('#stats-refresh-label')
  const statsErr          = container.querySelector('#stats-err')
  let statsTimer          = null
  let statsLoading        = false

  async function loadStats() {
    if (statsLoading) return
    statsLoading = true
    statsRefreshBtn.disabled = true
    statsErr.textContent = ''
    try {
      const res  = await fetch('/api/admin/stats', { headers: authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `HTTP ${res.status}`) }
      const data = await res.json()
      renderStats(container, data)
      const now = new Date()
      statsRefreshLabel.textContent = `Aktualisiert: ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`
    } catch (e) {
      statsErr.textContent = 'Statistiken konnten nicht geladen werden: ' + e.message
    } finally {
      statsLoading = false
      statsRefreshBtn.disabled = false
    }
  }

  statsRefreshBtn.addEventListener('click', loadStats)

  // Auto-refresh every 30s, stop when leaving admin page
  loadStats()
  statsTimer = setInterval(loadStats, 30_000)
  window.addEventListener('at:navigate', function stopTimer(e) {
    if (e.detail.hash !== 'admin') {
      clearInterval(statsTimer)
      window.removeEventListener('at:navigate', stopTimer)
    }
  })

  loadNavConfig()
}
