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
        <p>Navigation verwalten</p>
      </div>
      <div class="tool-body">

        <div class="admin-toolbar">
          <button class="btn btn-secondary" id="admin-logout-btn">Abmelden</button>
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

        <!-- Spenden-Links verwalten -->
        <div class="admin-section">
          <div class="admin-section-header">
            <h3 class="admin-section-title">Spenden-Links</h3>
          </div>
          <div class="form-row">
            <label for="donate-paypal">PayPal URL</label>
            <input id="donate-paypal" class="input" type="url" placeholder="https://paypal.me/...">
          </div>
          <div class="form-row" style="margin-top:10px">
            <label for="donate-bitcoin">Bitcoin Wallet-Adresse</label>
            <input id="donate-bitcoin" class="input" type="text" placeholder="bc1q... oder 1... oder 3...">
          </div>
          <div class="form-row" style="margin-top:10px">
            <label for="donate-bmac">Buy Me a Coffee URL</label>
            <input id="donate-bmac" class="input" type="url" placeholder="https://buymeacoffee.com/...">
          </div>
          <div id="admin-donate-err" class="input-error-msg"></div>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn btn-primary" id="admin-donate-save-btn">Spenden-Links speichern</button>
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

  // ---- Donate settings ----
  const donatePaypalEl = container.querySelector('#donate-paypal')
  const donateBtcEl    = container.querySelector('#donate-bitcoin')
  const donateBmacEl   = container.querySelector('#donate-bmac')
  const donateErrEl    = container.querySelector('#admin-donate-err')
  const donateSaveBtn  = container.querySelector('#admin-donate-save-btn')

  async function loadDonateLinks() {
    try {
      const res  = await fetch('/api/settings/donate')
      const data = await res.json()
      donatePaypalEl.value = data.paypal  ?? ''
      donateBtcEl.value    = data.bitcoin ?? ''
      donateBmacEl.value   = data.bmac    ?? ''
    } catch { /* leave empty */ }
  }

  donateSaveBtn.addEventListener('click', async () => {
    donateErrEl.textContent  = ''
    donateErrEl.style.color  = ''
    donateSaveBtn.disabled   = true
    donateSaveBtn.textContent = 'Speichere…'
    try {
      const res = await fetch('/api/settings/donate', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypal:  donatePaypalEl.value.trim(),
          bitcoin: donateBtcEl.value.trim(),
          bmac:    donateBmacEl.value.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) { donateErrEl.textContent = data.error || 'Fehler beim Speichern.'; return }
      donateErrEl.style.color = 'var(--success, green)'
      donateErrEl.textContent = 'Gespeichert!'
      setTimeout(() => { donateErrEl.textContent = ''; donateErrEl.style.color = '' }, 2500)
    } catch {
      donateErrEl.textContent = 'Server nicht erreichbar.'
    } finally {
      donateSaveBtn.disabled    = false
      donateSaveBtn.textContent = 'Spenden-Links speichern'
    }
  })

  loadNavConfig()
  loadDonateLinks()
}
