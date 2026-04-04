// ============================================================
// JWT Decoder — pure client-side, no backend
// ============================================================

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">JWT Decoder</h1>
        <p class="tool-subtitle">JSON Web Token dekodieren — Header, Payload und Signatur anzeigen</p>
      </div>

      <div class="jwt-input-wrap">
        <textarea
          id="jwt-input"
          class="input jwt-textarea"
          placeholder="JWT hier einfügen, z. B. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
          spellcheck="false"
          autocomplete="off"
          rows="4"
        ></textarea>
        <div class="jwt-input-actions">
          <button id="jwt-decode-btn" class="btn btn-primary">Dekodieren</button>
          <button id="jwt-clear-btn"  class="btn btn-secondary">Löschen</button>
        </div>
      </div>

      <div id="jwt-error"  class="jwt-error"  hidden></div>
      <div id="jwt-result" hidden>
        <div class="jwt-parts">

          <div class="jwt-part">
            <div class="jwt-part-head">
              <span class="jwt-part-label jwt-label-header">Header</span>
              <button class="btn btn-secondary jwt-copy-btn" data-target="jwt-header-json">Kopieren</button>
            </div>
            <pre class="jwt-json" id="jwt-header-json"></pre>
          </div>

          <div class="jwt-part">
            <div class="jwt-part-head">
              <span class="jwt-part-label jwt-label-payload">Payload</span>
              <div class="jwt-badges" id="jwt-badges"></div>
              <button class="btn btn-secondary jwt-copy-btn" data-target="jwt-payload-json">Kopieren</button>
            </div>
            <pre class="jwt-json" id="jwt-payload-json"></pre>
          </div>

          <div class="jwt-part">
            <div class="jwt-part-head">
              <span class="jwt-part-label jwt-label-sig">Signatur</span>
            </div>
            <div class="jwt-sig" id="jwt-sig"></div>
            <div class="jwt-sig-note">
              Die Signatur kann nur mit dem geheimen Schlüssel verifiziert werden.
              Dieser Decoder prüft die Signatur <strong>nicht</strong>.
            </div>
          </div>

        </div>
      </div>
    </div>
  `
}

export function init(container) {
  const textarea = container.querySelector('#jwt-input')
  const decodeBtn = container.querySelector('#jwt-decode-btn')
  const clearBtn  = container.querySelector('#jwt-clear-btn')
  const errorEl   = container.querySelector('#jwt-error')
  const resultEl  = container.querySelector('#jwt-result')
  const headerPre = container.querySelector('#jwt-header-json')
  const payloadPre = container.querySelector('#jwt-payload-json')
  const sigEl     = container.querySelector('#jwt-sig')
  const badgesEl  = container.querySelector('#jwt-badges')

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.hidden = false
    resultEl.hidden = true
  }

  function clearError() { errorEl.hidden = true; errorEl.textContent = '' }

  function b64UrlDecode(str) {
    // Base64url → Base64 → decode
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64
    return atob(padded)
  }

  function parseJwtPart(str) {
    const raw = b64UrlDecode(str)
    return JSON.parse(raw)
  }

  function fmtTimestamp(ts) {
    try { return new Date(ts * 1000).toLocaleString() } catch { return String(ts) }
  }

  function isExpired(exp) {
    return typeof exp === 'number' && exp * 1000 < Date.now()
  }

  // Syntax-highlight a JSON object as HTML
  function highlightJson(obj) {
    const TIME_CLAIMS = new Set(['iat', 'exp', 'nbf'])

    function renderValue(key, val, indent) {
      const pad = '  '.repeat(indent)
      if (val === null) return `<span class="jj-null">null</span>`
      if (typeof val === 'boolean') return `<span class="jj-bool">${val}</span>`
      if (typeof val === 'number') {
        if (TIME_CLAIMS.has(key)) {
          return `<span class="jj-num">${val}</span> <span class="jj-date">(${fmtTimestamp(val)})</span>`
        }
        return `<span class="jj-num">${val}</span>`
      }
      if (typeof val === 'string') return `<span class="jj-str">"${escapeHtml(val)}"</span>`
      if (Array.isArray(val)) {
        if (val.length === 0) return `[]`
        const items = val.map(v => `${pad}  ${renderValue(null, v, indent + 1)}`).join(',\n')
        return `[\n${items}\n${pad}]`
      }
      if (typeof val === 'object') {
        return renderObj(val, indent)
      }
      return escapeHtml(String(val))
    }

    function renderObj(o, indent = 0) {
      const pad = '  '.repeat(indent)
      const entries = Object.entries(o)
      if (entries.length === 0) return '{}'
      const lines = entries.map(([k, v]) =>
        `${pad}  <span class="jj-key">"${escapeHtml(k)}"</span>: ${renderValue(k, v, indent + 1)}`
      )
      return `{\n${lines.join(',\n')}\n${pad}}`
    }

    return renderObj(obj)
  }

  function decode() {
    const raw = textarea.value.trim()
    if (!raw) { showError('Bitte einen JWT einfügen.'); return }

    clearError()

    const parts = raw.split('.')
    if (parts.length !== 3) { showError('Ungültiges JWT-Format. Ein JWT besteht aus drei Base64url-Teilen, getrennt durch Punkte.'); return }

    let header, payload
    try { header  = parseJwtPart(parts[0]) } catch { showError('Header konnte nicht dekodiert werden.'); return }
    try { payload = parseJwtPart(parts[1]) } catch { showError('Payload konnte nicht dekodiert werden.'); return }

    // Badges
    const badges = []
    if (payload.exp != null) {
      if (isExpired(payload.exp)) {
        badges.push({ label: 'Abgelaufen', cls: 'jwt-badge--err' })
      } else {
        const secs = payload.exp - Math.floor(Date.now() / 1000)
        const label = secs < 3600
          ? `Läuft ab in ${Math.floor(secs / 60)} Min`
          : secs < 86400
            ? `Läuft ab in ${Math.floor(secs / 3600)} Std`
            : `Läuft ab in ${Math.floor(secs / 86400)} Tagen`
        badges.push({ label, cls: 'jwt-badge--ok' })
      }
    }
    if (header.alg) badges.push({ label: header.alg, cls: 'jwt-badge--info' })

    badgesEl.innerHTML = badges.map(b =>
      `<span class="jwt-badge ${b.cls}">${escapeHtml(b.label)}</span>`
    ).join('')

    headerPre.innerHTML  = highlightJson(header)
    payloadPre.innerHTML = highlightJson(payload)
    sigEl.textContent    = parts[2]

    resultEl.hidden = false
  }

  // Copy buttons
  container.querySelectorAll('.jwt-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = container.querySelector('#' + btn.dataset.target)
      const text   = target?.textContent || ''
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent
        btn.textContent = 'Kopiert!'
        setTimeout(() => { btn.textContent = orig }, 1500)
      }).catch(() => {})
    })
  })

  decodeBtn.addEventListener('click', decode)
  clearBtn.addEventListener('click', () => {
    textarea.value = ''
    resultEl.hidden = true
    clearError()
  })
  textarea.addEventListener('input', () => {
    // Auto-decode on paste / input if looks complete
    const v = textarea.value.trim()
    if (v.split('.').length === 3 && v.length > 20) decode()
  })
  textarea.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) decode() })
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
