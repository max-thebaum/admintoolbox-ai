export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">JSON Formatter</h1>
        <p class="tool-subtitle">JSON formatieren, minifizieren und validieren</p>
      </div>
      <div class="tool-body">

        <div class="form-row">
          <label for="jf-input">JSON-Eingabe</label>
          <textarea id="jf-input" class="input jf-textarea" spellcheck="false" placeholder='{ "key": "value" }'></textarea>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="jf-format-btn">Formatieren</button>
          <button class="btn btn-secondary" id="jf-minify-btn">Minifizieren</button>
          <button class="btn btn-secondary" id="jf-validate-btn">Validieren</button>
          <button class="btn btn-ghost" id="jf-clear-btn">Leeren</button>
        </div>

        <div class="input-error-msg" id="jf-err" role="alert"></div>
        <div class="jf-valid-msg" id="jf-ok" role="status"></div>

        <div id="jf-output-wrap" hidden>
          <div class="form-row" style="margin-top:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <label for="jf-output">Ausgabe</label>
              <button class="btn btn-ghost btn-sm" id="jf-copy-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Kopieren
              </button>
            </div>
            <textarea id="jf-output" class="input jf-textarea" readonly spellcheck="false"></textarea>
          </div>
        </div>

      </div>
    </div>`
}

export function init(container) {
  const inputEl  = container.querySelector('#jf-input')
  const outputEl = container.querySelector('#jf-output')
  const errEl    = container.querySelector('#jf-err')
  const okEl     = container.querySelector('#jf-ok')
  const wrapEl   = container.querySelector('#jf-output-wrap')

  function clearMessages() {
    errEl.textContent = ''
    okEl.textContent  = ''
  }

  function showOutput(text) {
    outputEl.value  = text
    wrapEl.hidden   = false
    clearMessages()
  }

  function showError(msg) {
    errEl.textContent = msg
    okEl.textContent  = ''
    wrapEl.hidden     = true
  }

  function showOk(msg) {
    okEl.textContent  = msg
    errEl.textContent = ''
  }

  function tryParse(raw) {
    try {
      return { ok: true, data: JSON.parse(raw) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }

  container.querySelector('#jf-format-btn').addEventListener('click', () => {
    const raw = inputEl.value.trim()
    if (!raw) { showError('Bitte JSON eingeben.'); return }
    const { ok, data, error } = tryParse(raw)
    if (!ok) { showError('Ungültiges JSON: ' + error); return }
    showOutput(JSON.stringify(data, null, 2))
  })

  container.querySelector('#jf-minify-btn').addEventListener('click', () => {
    const raw = inputEl.value.trim()
    if (!raw) { showError('Bitte JSON eingeben.'); return }
    const { ok, data, error } = tryParse(raw)
    if (!ok) { showError('Ungültiges JSON: ' + error); return }
    showOutput(JSON.stringify(data))
  })

  container.querySelector('#jf-validate-btn').addEventListener('click', () => {
    const raw = inputEl.value.trim()
    if (!raw) { showError('Bitte JSON eingeben.'); return }
    const { ok, error } = tryParse(raw)
    wrapEl.hidden = true
    if (ok) showOk('✓ Gültiges JSON')
    else    showError('Ungültiges JSON: ' + error)
  })

  container.querySelector('#jf-clear-btn').addEventListener('click', () => {
    inputEl.value   = ''
    outputEl.value  = ''
    wrapEl.hidden   = true
    clearMessages()
  })

  container.querySelector('#jf-copy-btn').addEventListener('click', function() {
    navigator.clipboard.writeText(outputEl.value).then(() => {
      const orig = this.textContent
      this.textContent = 'Kopiert!'
      this.disabled = true
      setTimeout(() => { this.textContent = orig; this.disabled = false }, 1500)
    })
  })

  // Auto-format on paste
  inputEl.addEventListener('paste', () => {
    setTimeout(() => {
      const raw = inputEl.value.trim()
      if (!raw) return
      const { ok, data } = tryParse(raw)
      if (ok) showOutput(JSON.stringify(data, null, 2))
    }, 0)
  })
}
