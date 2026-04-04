// ============================================================
// Intune App Store Export — iTunes Search + CSV Download
// ============================================================

let cart = []

function csvEscape(val) {
  return '"' + String(val ?? '').replace(/"/g, '""') + '"'
}

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">App Store Export</h1>
        <p class="tool-subtitle">iOS-Apps suchen, auswählen und als CSV für Microsoft Intune exportieren</p>
      </div>

      <div class="intune-search">
        <input
          type="text"
          id="intune-input"
          class="input"
          placeholder="App suchen, z. B. Slack, Teams, VPN …"
          autocomplete="off"
          spellcheck="false"
        />
        <button id="intune-search-btn" class="btn btn-primary">Suchen</button>
      </div>

      <div id="intune-error" class="intune-error" hidden></div>
      <div id="intune-spinner" class="spinner" hidden></div>

      <div id="intune-results-section" hidden>
        <h2 class="intune-section-title">Suchergebnisse <span id="intune-result-count" class="badge"></span></h2>
        <div id="intune-results" class="app-grid"></div>
      </div>

      <div id="intune-cart-section" hidden>
        <div class="intune-cart-header">
          <h2 class="intune-section-title">Ausgewählt <span id="intune-cart-count" class="badge badge-accent"></span></h2>
          <button id="intune-export-btn" class="btn btn-primary export-btn">CSV exportieren</button>
        </div>
        <div id="intune-cart" class="cart-list"></div>
      </div>
    </div>
  `
}

export function init(container) {
  // Reset cart on each page load
  cart = []

  const input      = container.querySelector('#intune-input')
  const searchBtn  = container.querySelector('#intune-search-btn')
  const spinner    = container.querySelector('#intune-spinner')
  const errorEl    = container.querySelector('#intune-error')
  const resultsEl  = container.querySelector('#intune-results')
  const resultsSec = container.querySelector('#intune-results-section')
  const resultCount= container.querySelector('#intune-result-count')
  const cartEl     = container.querySelector('#intune-cart')
  const cartSec    = container.querySelector('#intune-cart-section')
  const cartCount  = container.querySelector('#intune-cart-count')
  const exportBtn  = container.querySelector('#intune-export-btn')

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.hidden = false
  }

  function clearError() {
    errorEl.hidden = true
    errorEl.textContent = ''
  }

  async function doSearch() {
    const term = input.value.trim()
    if (!term) return

    clearError()
    resultsSec.hidden = true
    spinner.hidden = false
    searchBtn.disabled = true

    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&country=de&limit=25`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      renderResults(data.results || [])
    } catch (err) {
      showError('Suche fehlgeschlagen. Bitte Internetverbindung prüfen.')
    } finally {
      spinner.hidden = true
      searchBtn.disabled = false
    }
  }

  function renderResults(apps) {
    resultsSec.hidden = false
    resultCount.textContent = apps.length

    if (apps.length === 0) {
      resultsEl.innerHTML = '<p class="intune-empty">Keine Apps gefunden.</p>'
      return
    }

    resultsEl.innerHTML = apps.map(app => {
      const inCart = cart.some(a => a.bundleId === app.bundleId)
      return `
        <div class="app-card" data-bundle="${app.bundleId}">
          <img class="app-icon" src="${app.artworkUrl100}" alt="" loading="lazy" onerror="this.style.display='none'">
          <div class="app-info">
            <div class="app-name">${escapeHtml(app.trackName)}</div>
            <div class="app-developer">${escapeHtml(app.sellerName)}</div>
            <div class="app-bundle">${escapeHtml(app.bundleId)}</div>
          </div>
          <button
            class="btn btn-sm ${inCart ? 'btn-secondary' : 'btn-primary'} add-btn"
            data-bundle="${app.bundleId}"
            data-name="${escapeAttr(app.trackName)}"
            data-developer="${escapeAttr(app.sellerName)}"
            data-url="${escapeAttr(app.trackViewUrl)}"
            ${inCart ? 'disabled' : ''}
          >${inCart ? 'Hinzugefügt' : 'Hinzufügen'}</button>
        </div>
      `
    }).join('')
  }

  function renderCart() {
    cartCount.textContent = cart.length
    cartSec.hidden = cart.length === 0

    cartEl.innerHTML = cart.map(app => `
      <div class="cart-item" data-bundle="${app.bundleId}">
        <div class="cart-item-info">
          <span class="cart-item-name">${escapeHtml(app.name)}</span>
          <span class="cart-item-bundle">${escapeHtml(app.bundleId)}</span>
        </div>
        <button class="btn btn-sm btn-danger remove-btn" data-bundle="${app.bundleId}">Entfernen</button>
      </div>
    `).join('')
  }

  function addToCart(btn) {
    const { bundle, name, developer, url } = btn.dataset
    if (cart.some(a => a.bundleId === bundle)) return
    cart.push({ bundleId: bundle, name, developer, url })
    btn.disabled = true
    btn.textContent = 'Hinzugefügt'
    btn.classList.replace('btn-primary', 'btn-secondary')
    renderCart()
  }

  function removeFromCart(bundleId) {
    cart = cart.filter(a => a.bundleId !== bundleId)
    renderCart()
    // Re-enable the add button in results if visible
    const addBtn = resultsEl.querySelector(`[data-bundle="${bundleId}"].add-btn`)
    if (addBtn) {
      addBtn.disabled = false
      addBtn.textContent = 'Hinzufügen'
      addBtn.classList.replace('btn-secondary', 'btn-primary')
    }
  }

  function exportCsv() {
    if (cart.length === 0) return
    const header = 'Name,BundleId,AppStoreURL,Developer'
    const rows = cart.map(a =>
      [a.name, a.bundleId, a.url, a.developer].map(csvEscape).join(',')
    )
    const csv = [header, ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'intune-apps.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 10000)
  }

  // Events
  searchBtn.addEventListener('click', doSearch)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch() })

  resultsEl.addEventListener('click', e => {
    const btn = e.target.closest('.add-btn')
    if (btn && !btn.disabled) addToCart(btn)
  })

  cartEl.addEventListener('click', e => {
    const btn = e.target.closest('.remove-btn')
    if (btn) removeFromCart(btn.dataset.bundle)
  })

  exportBtn.addEventListener('click', exportCsv)
}

// Helpers — minimal HTML escaping for dynamic content
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}
