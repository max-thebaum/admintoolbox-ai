export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">UUID Generator</h1>
        <p class="tool-subtitle">UUID v4 kryptografisch sicher generieren</p>
      </div>
      <div class="tool-body">

        <div class="uuid-controls">
          <div class="form-row" style="flex-direction:row;align-items:center;gap:16px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:8px">
              <label for="uuid-qty" style="white-space:nowrap">Anzahl</label>
              <select id="uuid-qty" class="select" style="width:80px">
                <option>1</option>
                <option>5</option>
                <option>10</option>
                <option>25</option>
              </select>
            </div>
            <label class="uuid-toggle-label">
              <input type="checkbox" id="uuid-nodash"> Ohne Bindestriche
            </label>
            <button class="btn btn-primary" id="uuid-gen-btn">Generieren</button>
          </div>
        </div>

        <div id="uuid-list" class="uuid-list"></div>

        <div id="uuid-actions" class="btn-row" hidden>
          <button class="btn btn-secondary" id="uuid-copy-all-btn">Alle kopieren</button>
        </div>

      </div>
    </div>`
}

export function init(container) {
  const listEl    = container.querySelector('#uuid-list')
  const actionsEl = container.querySelector('#uuid-actions')

  container.querySelector('#uuid-gen-btn').addEventListener('click', generate)

  function generate() {
    const qty    = parseInt(container.querySelector('#uuid-qty').value)
    const noDash = container.querySelector('#uuid-nodash').checked

    const uuids = Array.from({ length: qty }, () => {
      const u = crypto.randomUUID()
      return noDash ? u.replace(/-/g, '') : u
    })

    listEl.innerHTML = uuids.map((u, i) => `
      <div class="uuid-item">
        <span class="uuid-value">${u}</span>
        <button class="btn btn-ghost btn-sm uuid-copy-one" data-i="${i}" title="Kopieren">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>`).join('')

    actionsEl.hidden = false

    listEl.querySelectorAll('.uuid-copy-one').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = uuids[parseInt(btn.dataset.i)]
        navigator.clipboard.writeText(val).then(() => {
          btn.textContent = '✓'
          setTimeout(() => {
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
          }, 1200)
        })
      })
    })
  }

  container.querySelector('#uuid-copy-all-btn').addEventListener('click', function() {
    const vals = [...listEl.querySelectorAll('.uuid-value')].map(el => el.textContent).join('\n')
    navigator.clipboard.writeText(vals).then(() => {
      const orig = this.textContent
      this.textContent = 'Kopiert!'
      this.disabled = true
      setTimeout(() => { this.textContent = orig; this.disabled = false }, 1500)
    })
  })
}
