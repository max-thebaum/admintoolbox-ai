export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">Base64 En/Decode</h1>
        <p class="tool-subtitle">Text in Base64 kodieren und dekodieren (UTF-8)</p>
      </div>
      <div class="tool-body">

        <div class="form-row">
          <label for="b64-input">Eingabe</label>
          <textarea id="b64-input" class="input b64-textarea" spellcheck="false" placeholder="Text oder Base64-String eingeben…"></textarea>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="b64-encode-btn">Kodieren →</button>
          <button class="btn btn-primary" id="b64-decode-btn">← Dekodieren</button>
          <button class="btn btn-ghost" id="b64-clear-btn">Leeren</button>
        </div>

        <div class="input-error-msg" id="b64-err" role="alert"></div>

        <div id="b64-output-wrap" hidden>
          <div class="form-row" style="margin-top:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <label for="b64-output">Ausgabe</label>
              <button class="btn btn-ghost btn-sm" id="b64-copy-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Kopieren
              </button>
            </div>
            <textarea id="b64-output" class="input b64-textarea" readonly spellcheck="false"></textarea>
          </div>
        </div>

      </div>
    </div>`
}

export function init(container) {
  const inputEl  = container.querySelector('#b64-input')
  const outputEl = container.querySelector('#b64-output')
  const errEl    = container.querySelector('#b64-err')
  const wrapEl   = container.querySelector('#b64-output-wrap')

  function showOutput(text) {
    outputEl.value = text
    wrapEl.hidden  = false
    errEl.textContent = ''
  }

  function showError(msg) {
    errEl.textContent = msg
    wrapEl.hidden = true
  }

  // UTF-8 safe encode
  function encodeB64(str) {
    const bytes = new TextEncoder().encode(str)
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    return btoa(binary)
  }

  // UTF-8 safe decode
  function decodeB64(str) {
    const binary = atob(str)
    const bytes  = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  }

  container.querySelector('#b64-encode-btn').addEventListener('click', () => {
    const val = inputEl.value
    if (!val) { showError('Bitte Text eingeben.'); return }
    try {
      showOutput(encodeB64(val))
    } catch (e) {
      showError('Fehler beim Kodieren: ' + e.message)
    }
  })

  container.querySelector('#b64-decode-btn').addEventListener('click', () => {
    const val = inputEl.value.trim()
    if (!val) { showError('Bitte Base64-String eingeben.'); return }
    try {
      showOutput(decodeB64(val))
    } catch (e) {
      showError('Ungültiger Base64-String.')
    }
  })

  container.querySelector('#b64-clear-btn').addEventListener('click', () => {
    inputEl.value = ''
    outputEl.value = ''
    wrapEl.hidden = true
    errEl.textContent = ''
  })

  container.querySelector('#b64-copy-btn').addEventListener('click', function() {
    navigator.clipboard.writeText(outputEl.value).then(() => {
      const orig = this.textContent
      this.textContent = 'Kopiert!'
      this.disabled = true
      setTimeout(() => { this.textContent = orig; this.disabled = false }, 1500)
    })
  })
}
