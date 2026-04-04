// ============================================================
// Passwort-Generator
// ============================================================

const CHARSETS = {
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:   'abcdefghijklmnopqrstuvwxyz',
  digits:  '0123456789',
  special: '!@#$%^&*()-_=+[]{}|;:,.<>?'
}

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Passwort-Generator</h1>
        <p class="tool-subtitle">Kryptografisch sichere Passwörter mit konfigurierbaren Zeichensätzen</p>
      </div>

      <div class="pg-controls">
        <div class="pg-length-row">
          <label for="pg-length">Länge</label>
          <div class="pg-length-input">
            <input type="range" id="pg-length-range" min="8" max="128" value="24" class="pg-range">
            <input type="number" id="pg-length" min="8" max="128" value="24" class="input pg-length-number">
          </div>
        </div>

        <div class="pg-checkboxes">
          <label class="pg-check"><input type="checkbox" id="pg-upper"   checked> Großbuchstaben <span class="pg-sample">A–Z</span></label>
          <label class="pg-check"><input type="checkbox" id="pg-lower"   checked> Kleinbuchstaben <span class="pg-sample">a–z</span></label>
          <label class="pg-check"><input type="checkbox" id="pg-digits"  checked> Ziffern <span class="pg-sample">0–9</span></label>
          <label class="pg-check"><input type="checkbox" id="pg-special" checked> Sonderzeichen <span class="pg-sample">!@#…</span></label>
        </div>

        <div class="pg-count-row">
          <label for="pg-count">Anzahl generieren</label>
          <div class="pg-count-btns">
            <button class="pg-count-btn active" data-count="1">1</button>
            <button class="pg-count-btn" data-count="5">5</button>
            <button class="pg-count-btn" data-count="10">10</button>
          </div>
        </div>
      </div>

      <button id="pg-generate-btn" class="btn btn-primary pg-generate-btn">Generieren</button>

      <div id="pg-output" class="pg-output" hidden></div>
    </div>
  `
}

export function init(container) {
  const rangeEl   = container.querySelector('#pg-length-range')
  const numEl     = container.querySelector('#pg-length')
  const upperEl   = container.querySelector('#pg-upper')
  const lowerEl   = container.querySelector('#pg-lower')
  const digitsEl  = container.querySelector('#pg-digits')
  const specialEl = container.querySelector('#pg-special')
  const countBtns = container.querySelectorAll('.pg-count-btn')
  const generateBtn = container.querySelector('#pg-generate-btn')
  const output    = container.querySelector('#pg-output')

  let selectedCount = 1

  // Sync range ↔ number input
  rangeEl.addEventListener('input', () => { numEl.value = rangeEl.value })
  numEl.addEventListener('input', () => {
    let v = parseInt(numEl.value, 10)
    if (isNaN(v)) return
    v = Math.max(8, Math.min(128, v))
    rangeEl.value = v
    numEl.value = v
  })

  // Count selector
  countBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      countBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      selectedCount = parseInt(btn.dataset.count, 10)
    })
  })

  generateBtn.addEventListener('click', generate)
  container.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target !== generateBtn) generate()
  })

  function buildCharset() {
    let cs = ''
    if (upperEl.checked)   cs += CHARSETS.upper
    if (lowerEl.checked)   cs += CHARSETS.lower
    if (digitsEl.checked)  cs += CHARSETS.digits
    if (specialEl.checked) cs += CHARSETS.special
    return cs
  }

  function generateOne(length, charset) {
    const arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    return Array.from(arr, n => charset[n % charset.length]).join('')
  }

  function entropy(length, charsetSize) {
    return (length * Math.log2(charsetSize)).toFixed(1)
  }

  function entropyLabel(bits) {
    if (bits < 40)  return { label: 'Schwach',     cls: 'strength-weak' }
    if (bits < 60)  return { label: 'Ausreichend', cls: 'strength-fair' }
    if (bits < 80)  return { label: 'Gut',         cls: 'strength-good' }
    if (bits < 100) return { label: 'Stark',       cls: 'strength-strong' }
    return              { label: 'Sehr stark',  cls: 'strength-excellent' }
  }

  function generate() {
    const charset = buildCharset()
    if (!charset) {
      output.hidden = false
      output.innerHTML = '<p class="pg-error">Bitte mindestens einen Zeichensatz auswählen.</p>'
      return
    }

    const length  = parseInt(numEl.value, 10)
    const bits    = entropy(length, charset.length)
    const { label, cls } = entropyLabel(parseFloat(bits))
    const passwords = Array.from({ length: selectedCount }, () => generateOne(length, charset))

    output.hidden = false
    output.innerHTML = `
      <div class="pg-entropy ${cls}">
        Entropie: <strong>${bits} bit</strong> — <span>${label}</span>
      </div>
      <div class="pg-list">
        ${passwords.map((pw, i) => `
          <div class="pg-item">
            <span class="pg-pw" id="pg-pw-${i}">${pw}</span>
            <button class="btn btn-sm btn-secondary pg-copy-btn" data-index="${i}" title="Kopieren">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
              </svg>
              Kopieren
            </button>
          </div>
        `).join('')}
      </div>
      ${passwords.length === 1 ? '' : `
        <button class="btn btn-secondary pg-copy-all-btn">Alle kopieren</button>
      `}
    `

    // Copy single
    output.querySelectorAll('.pg-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pw = output.querySelector(`#pg-pw-${btn.dataset.index}`).textContent
        copyToClipboard(pw, btn)
      })
    })

    // Copy all
    const copyAllBtn = output.querySelector('.pg-copy-all-btn')
    if (copyAllBtn) {
      copyAllBtn.addEventListener('click', () => {
        copyToClipboard(passwords.join('\n'), copyAllBtn)
      })
    }
  }

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML
      btn.textContent = 'Kopiert!'
      btn.disabled = true
      setTimeout(() => { btn.innerHTML = orig; btn.disabled = false }, 1500)
    })
  }
}
