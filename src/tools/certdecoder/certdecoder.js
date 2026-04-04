import forge from 'node-forge'

export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">Zertifikat-Decoder</h1>
        <p class="tool-subtitle">PEM-Zertifikat analysieren und alle Details anzeigen</p>
      </div>
      <div class="tool-body">

        <div class="form-row">
          <label for="cd-input">PEM-Zertifikat</label>
          <textarea id="cd-input" class="input cd-textarea" spellcheck="false"
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"></textarea>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="cd-decode-btn">Dekodieren</button>
          <button class="btn btn-ghost" id="cd-clear-btn">Leeren</button>
        </div>

        <div class="input-error-msg" id="cd-err" role="alert"></div>

        <div id="cd-result" hidden>
          <div class="result-section">
            <div class="result-section-title">Subject</div>
            <div class="result-grid" id="cd-subject"></div>
          </div>
          <div class="result-section">
            <div class="result-section-title">Aussteller (Issuer)</div>
            <div class="result-grid" id="cd-issuer"></div>
          </div>
          <div class="result-section">
            <div class="result-section-title">Gültigkeit</div>
            <div class="result-grid" id="cd-validity"></div>
          </div>
          <div class="result-section">
            <div class="result-section-title">Schlüssel &amp; Fingerprint</div>
            <div class="result-grid" id="cd-key"></div>
          </div>
          <div id="cd-san-section" class="result-section" hidden>
            <div class="result-section-title">Subject Alternative Names (SANs)</div>
            <div id="cd-sans" class="cd-sans"></div>
          </div>
        </div>

      </div>
    </div>`
}

const DN_FIELDS = { CN: 'Common Name', O: 'Organisation', OU: 'Organisationseinheit', C: 'Land', ST: 'Bundesland', L: 'Stadt', E: 'E-Mail' }

function row(label, value) {
  return `<div class="result-row">
    <span class="result-label">${label}</span>
    <span class="result-value">${value}</span>
  </div>`
}

function formatDN(attrs) {
  return attrs.map(a => {
    const label = DN_FIELDS[a.shortName] || a.shortName || a.name || '?'
    return row(label, a.value)
  }).join('')
}

function formatDate(d) {
  return d ? d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : '—'
}

export function init(container) {
  const inputEl  = container.querySelector('#cd-input')
  const errEl    = container.querySelector('#cd-err')
  const resultEl = container.querySelector('#cd-result')

  container.querySelector('#cd-decode-btn').addEventListener('click', () => {
    errEl.textContent = ''
    resultEl.hidden   = true

    const pem = inputEl.value.trim()
    if (!pem) { errEl.textContent = 'Bitte PEM-Zertifikat eingeben.'; return }

    let cert
    try {
      cert = forge.pki.certificateFromPem(pem)
    } catch (e) {
      errEl.textContent = 'Ungültiges Zertifikat: ' + e.message
      return
    }

    // Subject
    container.querySelector('#cd-subject').innerHTML = formatDN(cert.subject.attributes)

    // Issuer
    container.querySelector('#cd-issuer').innerHTML = formatDN(cert.issuer.attributes)

    // Validity
    const now = new Date()
    const isValid = now >= cert.validity.notBefore && now <= cert.validity.notAfter
    container.querySelector('#cd-validity').innerHTML =
      row('Gültig ab',  formatDate(cert.validity.notBefore)) +
      row('Gültig bis', formatDate(cert.validity.notAfter)) +
      row('Status',     isValid ? '<span style="color:var(--success,#3fb950)">✓ Gültig</span>' : '<span style="color:var(--error,#f85149)">✗ Abgelaufen</span>') +
      row('Seriennummer', cert.serialNumber)

    // Key info
    const pubKey = cert.publicKey
    let keyInfo = '—'
    try {
      if (pubKey.n) keyInfo = `RSA ${pubKey.n.bitLength()} Bit`
      else if (pubKey.type) keyInfo = pubKey.type
    } catch {}

    // SHA-256 fingerprint
    let fp = '—'
    try {
      const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
      const md  = forge.md.sha256.create()
      md.update(der)
      fp = md.digest().toHex().match(/.{2}/g).join(':').toUpperCase()
    } catch {}

    container.querySelector('#cd-key').innerHTML =
      row('Schlüsseltyp', keyInfo) +
      row('SHA-256 Fingerprint', `<span style="font-family:var(--font-mono);font-size:11px;word-break:break-all">${fp}</span>`)

    // SANs
    const sanExt = cert.extensions.find(e => e.name === 'subjectAltName')
    if (sanExt && sanExt.altNames?.length) {
      const sanSection = container.querySelector('#cd-san-section')
      const sanEl      = container.querySelector('#cd-sans')
      sanEl.innerHTML  = sanExt.altNames.map(a => {
        const type = a.type === 2 ? 'DNS' : a.type === 7 ? 'IP' : 'Sonstige'
        return `<span class="cd-san-badge">${type}: ${a.value || a.ip || '?'}</span>`
      }).join('')
      sanSection.hidden = false
    } else {
      container.querySelector('#cd-san-section').hidden = true
    }

    resultEl.hidden = false
  })

  container.querySelector('#cd-clear-btn').addEventListener('click', () => {
    inputEl.value   = ''
    resultEl.hidden = true
    errEl.textContent = ''
  })
}
