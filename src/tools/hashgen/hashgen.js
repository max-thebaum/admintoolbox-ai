// ============================================================
// Hash-Generator — SHA-1 / SHA-256 / SHA-384 / SHA-512
// Web Crypto API, 100% clientseitig
// ============================================================

const ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Hash-Generator</h1>
        <p class="tool-subtitle">Prüfsummen für Text oder Dateien berechnen — SHA-1, SHA-256, SHA-384, SHA-512</p>
      </div>

      <div class="hash-tabs">
        <button class="hash-tab active" data-tab="text">Text</button>
        <button class="hash-tab" data-tab="file">Datei</button>
      </div>

      <div id="hash-tab-text" class="hash-tab-panel">
        <textarea id="hash-input" class="input hash-textarea"
                  placeholder="Text hier eingeben…"
                  rows="5" spellcheck="false"></textarea>
        <div class="hash-encoding-row">
          <label>Ausgabe:</label>
          <button class="hash-enc-btn active" data-enc="hex">Hex</button>
          <button class="hash-enc-btn" data-enc="base64">Base64</button>
        </div>
      </div>

      <div id="hash-tab-file" class="hash-tab-panel" hidden>
        <label class="hash-file-drop" id="hash-file-drop">
          <input type="file" id="hash-file-input" class="hash-file-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span id="hash-file-label">Datei hier ablegen oder klicken</span>
        </label>
        <div class="hash-encoding-row">
          <label>Ausgabe:</label>
          <button class="hash-enc-btn active" data-enc="hex">Hex</button>
          <button class="hash-enc-btn" data-enc="base64">Base64</button>
        </div>
      </div>

      <div id="hash-spinner" class="pki-spinner-row" hidden>
        <div class="spinner"></div>
        <span>Hash wird berechnet…</span>
      </div>

      <div id="hash-results" class="hash-results" hidden>
        <div class="hash-results-header">
          <span class="hash-results-title">Ergebnisse</span>
          <button id="hash-copy-all" class="btn btn-sm btn-secondary">Alle kopieren</button>
        </div>
        ${ALGOS.map(algo => `
          <div class="hash-row">
            <span class="hash-algo-label">${algo}</span>
            <span class="hash-value mono" id="hash-val-${algo.replace('-','')}" title="${algo}">—</span>
            <button class="btn btn-sm btn-secondary hash-copy-btn" data-algo="${algo}">Kopieren</button>
          </div>
        `).join('')}
        <div id="hash-file-info" class="hash-file-info"></div>
      </div>
    </div>
  `
}

export function init(container) {
  let currentTab = 'text'
  let currentEnc = 'hex'
  let currentFile = null
  let debounceTimer = null

  const tabs       = container.querySelectorAll('.hash-tab')
  const panels     = { text: container.querySelector('#hash-tab-text'), file: container.querySelector('#hash-tab-file') }
  const textInput  = container.querySelector('#hash-input')
  const fileInput  = container.querySelector('#hash-file-input')
  const fileDrop   = container.querySelector('#hash-file-drop')
  const fileLabel  = container.querySelector('#hash-file-label')
  const spinner    = container.querySelector('#hash-spinner')
  const results    = container.querySelector('#hash-results')
  const fileInfo   = container.querySelector('#hash-file-info')
  const encBtns    = container.querySelectorAll('.hash-enc-btn')

  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      currentTab = tab.dataset.tab
      panels.text.hidden = currentTab !== 'text'
      panels.file.hidden = currentTab !== 'file'
      results.hidden = true
    })
  })

  // Encoding toggle
  encBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      encBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentEnc = btn.dataset.enc
      if (currentTab === 'text' && textInput.value) scheduleHash()
      if (currentTab === 'file' && currentFile)    hashFile(currentFile)
    })
  })

  // Text input — debounce 300ms
  textInput.addEventListener('input', scheduleHash)

  function scheduleHash() {
    clearTimeout(debounceTimer)
    if (!textInput.value.trim()) { results.hidden = true; return }
    debounceTimer = setTimeout(() => hashText(textInput.value), 300)
  }

  // File input
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0]
    if (file) handleFile(file)
  })

  // Drag & Drop
  fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('drag-over') })
  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'))
  fileDrop.addEventListener('drop', e => {
    e.preventDefault()
    fileDrop.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  })

  function handleFile(file) {
    currentFile = file
    fileLabel.textContent = `${file.name} (${formatSize(file.size)})`
    hashFile(file)
  }

  async function hashText(text) {
    const buffer = new TextEncoder().encode(text)
    await computeAll(buffer)
    fileInfo.textContent = `${text.length} Zeichen`
    fileInfo.hidden = false
  }

  async function hashFile(file) {
    spinner.hidden = false
    results.hidden = true
    const buffer = await file.arrayBuffer()
    await computeAll(new Uint8Array(buffer))
    fileInfo.textContent = `${file.name} · ${formatSize(file.size)}`
    fileInfo.hidden = false
    spinner.hidden = true
  }

  async function computeAll(data) {
    spinner.hidden = false
    results.hidden = true

    try {
      await Promise.all(ALGOS.map(async algo => {
        const hashBuf = await crypto.subtle.digest(algo, data)
        const valEl   = container.querySelector(`#hash-val-${algo.replace('-','')}`)
        valEl.textContent = encode(hashBuf, currentEnc)
      }))
      results.hidden = false
    } finally {
      spinner.hidden = true
    }
  }

  function encode(buffer, enc) {
    const bytes = new Uint8Array(buffer)
    if (enc === 'base64') {
      return btoa(String.fromCharCode(...bytes))
    }
    return bytes.reduce((hex, b) => hex + b.toString(16).padStart(2, '0'), '')
  }

  function formatSize(bytes) {
    if (bytes < 1024)       return `${bytes} B`
    if (bytes < 1048576)    return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1048576).toFixed(2)} MB`
  }

  // Copy single
  results.addEventListener('click', e => {
    const btn = e.target.closest('.hash-copy-btn')
    if (!btn) return
    const val = container.querySelector(`#hash-val-${btn.dataset.algo.replace('-','')}`).textContent
    if (val === '—') return
    copyToClipboard(val, btn)
  })

  // Copy all
  container.querySelector('#hash-copy-all').addEventListener('click', btn => {
    const lines = ALGOS.map(algo => {
      const val = container.querySelector(`#hash-val-${algo.replace('-','')}`).textContent
      return `${algo}: ${val}`
    }).join('\n')
    copyToClipboard(lines, container.querySelector('#hash-copy-all'))
  })

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent
      btn.textContent = 'Kopiert!'
      btn.disabled = true
      setTimeout(() => { btn.textContent = orig; btn.disabled = false }, 1500)
    })
  }
}
