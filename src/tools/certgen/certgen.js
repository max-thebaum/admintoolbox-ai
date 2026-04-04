// ============================================================
// Self-Signed Certificate Generator
// Outputs: Private Key + CSR + Self-Signed Certificate
// ============================================================
import forge from 'node-forge'
import { generateKeyPair, hashMd, downloadText } from '../csrgen/csrgen.js'

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Zertifikat-Generator</h1>
        <p class="tool-subtitle">Self-signed Zertifikat erstellen — Private Key, CSR und signiertes Zertifikat (PEM)</p>
      </div>

      <div class="pki-form">
        <!-- Subject -->
        <fieldset class="pki-fieldset">
          <legend class="pki-legend">Subject Distinguished Name</legend>
          <div class="pki-grid">
            <div class="pki-field pki-field-wide">
              <label for="certgen-cn">Common Name (CN) <span class="required">*</span></label>
              <input id="certgen-cn" class="input" type="text" placeholder="z. B. server.example.com oder *.example.com" autocomplete="off">
            </div>
            <div class="pki-field">
              <label for="certgen-o">Organization (O)</label>
              <input id="certgen-o" class="input" type="text" placeholder="Meine GmbH">
            </div>
            <div class="pki-field">
              <label for="certgen-ou">Organizational Unit (OU)</label>
              <input id="certgen-ou" class="input" type="text" placeholder="IT-Abteilung">
            </div>
            <div class="pki-field">
              <label for="certgen-l">Locality (L)</label>
              <input id="certgen-l" class="input" type="text" placeholder="Berlin">
            </div>
            <div class="pki-field">
              <label for="certgen-st">State / Province (ST)</label>
              <input id="certgen-st" class="input" type="text" placeholder="Bayern">
            </div>
            <div class="pki-field">
              <label for="certgen-c">Country (C)</label>
              <input id="certgen-c" class="input" type="text" maxlength="2" placeholder="DE" style="text-transform:uppercase">
            </div>
            <div class="pki-field pki-field-wide">
              <label for="certgen-email">E-Mail</label>
              <input id="certgen-email" class="input" type="email" placeholder="admin@example.com">
            </div>
          </div>
        </fieldset>

        <!-- Key + Validity -->
        <fieldset class="pki-fieldset">
          <legend class="pki-legend">Schlüssel &amp; Gültigkeit</legend>
          <div class="pki-keyrow">
            <div class="pki-field">
              <label>Schlüssellänge</label>
              <div class="pki-segmented">
                <button class="pki-seg" data-bits="2048">2048 Bit</button>
                <button class="pki-seg active" data-bits="3072">3072 Bit</button>
                <button class="pki-seg" data-bits="4096">4096 Bit</button>
              </div>
            </div>
            <div class="pki-field">
              <label>Signatur-Hash</label>
              <div class="pki-segmented">
                <button class="pki-seg active" data-hash="SHA-256">SHA-256</button>
                <button class="pki-seg" data-hash="SHA-384">SHA-384</button>
                <button class="pki-seg" data-hash="SHA-512">SHA-512</button>
              </div>
            </div>
            <div class="pki-field">
              <label>Gültigkeitsdauer</label>
              <div class="pki-segmented">
                <button class="pki-seg" data-days="365">1 Jahr</button>
                <button class="pki-seg active" data-days="730">2 Jahre</button>
                <button class="pki-seg" data-days="3650">10 Jahre</button>
              </div>
            </div>
          </div>
          <div class="pki-options-row">
            <label class="pki-check-label">
              <input type="checkbox" id="certgen-ca"> Als CA-Zertifikat (basicConstraints: CA:TRUE)
            </label>
          </div>
        </fieldset>

        <!-- SANs -->
        <fieldset class="pki-fieldset">
          <legend class="pki-legend">Subject Alternative Names (SAN)</legend>
          <div class="pki-san-section">
            <div class="pki-san-col">
              <label class="pki-san-label">DNS-Namen</label>
              <div class="pki-san-input-row">
                <input id="certgen-dns-input" class="input" type="text" placeholder="z. B. www.example.com">
                <button id="certgen-dns-add" class="btn btn-secondary pki-san-add">+ Hinzufügen</button>
              </div>
              <ul id="certgen-dns-list" class="pki-san-list"></ul>
            </div>
            <div class="pki-san-col">
              <label class="pki-san-label">IP-Adressen</label>
              <div class="pki-san-input-row">
                <input id="certgen-ip-input" class="input" type="text" placeholder="z. B. 192.168.1.1">
                <button id="certgen-ip-add" class="btn btn-secondary pki-san-add">+ Hinzufügen</button>
              </div>
              <ul id="certgen-ip-list" class="pki-san-list"></ul>
            </div>
          </div>
        </fieldset>
      </div>

      <div id="certgen-error" class="pki-error" hidden></div>

      <button id="certgen-generate-btn" class="btn btn-primary pki-generate-btn">Private Key + Zertifikat generieren</button>

      <div id="certgen-spinner" class="pki-spinner-row" hidden>
        <div class="spinner"></div>
        <span>Schlüssel wird generiert…</span>
      </div>

      <div id="certgen-output" hidden>
        <div class="pki-output-block">
          <div class="pki-output-header">
            <span class="pki-output-label">Private Key (PEM)</span>
            <div class="pki-output-actions">
              <button class="btn btn-sm btn-secondary" data-copy="certgen-key-out">Kopieren</button>
              <button class="btn btn-sm btn-secondary" data-download="private.key" data-source="certgen-key-out">Download .key</button>
            </div>
          </div>
          <textarea id="certgen-key-out" class="pki-textarea" readonly rows="8"></textarea>
        </div>
        <div class="pki-output-block">
          <div class="pki-output-header">
            <span class="pki-output-label">Certificate Signing Request (PEM)</span>
            <div class="pki-output-actions">
              <button class="btn btn-sm btn-secondary" data-copy="certgen-csr-out">Kopieren</button>
              <button class="btn btn-sm btn-secondary" data-download="request.csr" data-source="certgen-csr-out">Download .csr</button>
            </div>
          </div>
          <textarea id="certgen-csr-out" class="pki-textarea" readonly rows="8"></textarea>
        </div>
        <div class="pki-output-block">
          <div class="pki-output-header">
            <span class="pki-output-label">Zertifikat / Certificate (PEM)</span>
            <div class="pki-output-actions">
              <button class="btn btn-sm btn-secondary" data-copy="certgen-cert-out">Kopieren</button>
              <button class="btn btn-sm btn-secondary" data-download="certificate.crt" data-source="certgen-cert-out">Download .crt</button>
            </div>
          </div>
          <textarea id="certgen-cert-out" class="pki-textarea" readonly rows="10"></textarea>
        </div>
        <div class="pki-output-block">
          <div class="pki-output-header">
            <span class="pki-output-label">Zertifikat-Details</span>
          </div>
          <div id="certgen-info" class="pki-cert-info"></div>
        </div>
      </div>
    </div>
  `
}

export function init(container) {
  let selectedBits = 3072
  let selectedHash = 'SHA-256'
  let selectedDays = 730
  const dnsList = []
  const ipList  = []

  container.querySelectorAll('.pki-segmented').forEach(group => {
    group.querySelectorAll('.pki-seg').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.pki-seg').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        if (btn.dataset.bits) selectedBits = parseInt(btn.dataset.bits)
        if (btn.dataset.hash) selectedHash = btn.dataset.hash
        if (btn.dataset.days) selectedDays = parseInt(btn.dataset.days)
      })
    })
  })

  function addSan(arr, inputEl, listEl) {
    const val = inputEl.value.trim()
    if (!val || arr.includes(val)) { inputEl.value = ''; return }
    arr.push(val)
    inputEl.value = ''
    renderSanList(arr, listEl)
  }

  function renderSanList(arr, listEl) {
    listEl.innerHTML = arr.map((v, i) => `
      <li class="pki-san-item">
        <span>${escapeHtml(v)}</span>
        <button class="pki-san-remove" data-index="${i}">×</button>
      </li>
    `).join('')
    listEl.querySelectorAll('.pki-san-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        arr.splice(parseInt(btn.dataset.index), 1)
        renderSanList(arr, listEl)
      })
    })
  }

  const dnsInput = container.querySelector('#certgen-dns-input')
  const ipInput  = container.querySelector('#certgen-ip-input')
  const dnsListEl = container.querySelector('#certgen-dns-list')
  const ipListEl  = container.querySelector('#certgen-ip-list')

  container.querySelector('#certgen-dns-add').addEventListener('click', () => addSan(dnsList, dnsInput, dnsListEl))
  container.querySelector('#certgen-ip-add').addEventListener('click',  () => addSan(ipList, ipInput, ipListEl))
  dnsInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSan(dnsList, dnsInput, dnsListEl) } })
  ipInput.addEventListener('keydown',  e => { if (e.key === 'Enter') { e.preventDefault(); addSan(ipList, ipInput, ipListEl) } })

  const generateBtn = container.querySelector('#certgen-generate-btn')
  const spinner     = container.querySelector('#certgen-spinner')
  const errorEl     = container.querySelector('#certgen-error')
  const output      = container.querySelector('#certgen-output')

  generateBtn.addEventListener('click', async () => {
    errorEl.hidden = true
    output.hidden  = true

    const cn = container.querySelector('#certgen-cn').value.trim()
    if (!cn) { showError('Common Name (CN) ist erforderlich.'); return }

    const c = container.querySelector('#certgen-c').value.trim().toUpperCase()
    if (c && !/^[A-Z]{2}$/.test(c)) { showError('Country (C) muss ein 2-stelliger ISO-Ländercode sein (z. B. DE).'); return }

    generateBtn.disabled = true
    spinner.hidden = false

    try {
      const keypair = await generateKeyPair(selectedBits)
      const md      = hashMd(selectedHash)
      const isCA    = container.querySelector('#certgen-ca').checked

      const attrs = buildSubjectAttrs(container)

      // Build CSR
      const csr = forge.pki.createCertificationRequest()
      csr.publicKey = keypair.publicKey
      csr.setSubject(attrs)
      const altNames = [
        ...dnsList.map(v => ({ type: 2, value: v })),
        ...ipList.map(v  => ({ type: 7, ip: v }))
      ]
      if (altNames.length) {
        csr.setAttributes([{
          name: 'extensionRequest',
          extensions: [{ name: 'subjectAltName', altNames }]
        }])
      }
      csr.sign(keypair.privateKey, forge.md.sha256.create())

      // Build self-signed cert
      const cert = forge.pki.createCertificate()
      cert.publicKey  = keypair.publicKey
      cert.serialNumber = serialNumber()
      const notBefore = new Date()
      const notAfter  = new Date()
      notAfter.setDate(notBefore.getDate() + selectedDays)
      cert.validity.notBefore = notBefore
      cert.validity.notAfter  = notAfter
      cert.setSubject(attrs)
      cert.setIssuer(attrs) // self-signed

      const extensions = [
        { name: 'basicConstraints', cA: isCA },
        {
          name: 'keyUsage',
          critical: true,
          keyCertSign: isCA,
          digitalSignature: true,
          nonRepudiation: false,
          keyEncipherment: !isCA,
          dataEncipherment: false
        },
        {
          name: 'extKeyUsage',
          serverAuth: !isCA,
          clientAuth: !isCA
        },
        { name: 'subjectKeyIdentifier' }
      ]
      if (altNames.length) {
        extensions.push({ name: 'subjectAltName', altNames })
      }
      cert.setExtensions(extensions)
      cert.sign(keypair.privateKey, md)

      container.querySelector('#certgen-key-out').value  = forge.pki.privateKeyToPem(keypair.privateKey)
      container.querySelector('#certgen-csr-out').value  = forge.pki.certificationRequestToPem(csr)
      container.querySelector('#certgen-cert-out').value = forge.pki.certificateToPem(cert)

      renderCertInfo(container.querySelector('#certgen-info'), cert, selectedBits, selectedHash)

      output.hidden = false
      output.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      showError('Fehler beim Generieren: ' + err.message)
    } finally {
      spinner.hidden = true
      generateBtn.disabled = false
    }
  })

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.hidden = false
  }

  output.addEventListener('click', e => {
    const btn = e.target.closest('[data-copy],[data-download]')
    if (!btn) return
    const ta = container.querySelector(`#${btn.dataset.copy || btn.dataset.source}`)
    if (btn.dataset.copy) {
      navigator.clipboard.writeText(ta.value).then(() => {
        const orig = btn.textContent
        btn.textContent = 'Kopiert!'
        btn.disabled = true
        setTimeout(() => { btn.textContent = orig; btn.disabled = false }, 1500)
      })
    }
    if (btn.dataset.download) {
      downloadText(ta.value, btn.dataset.download)
    }
  })
}

function buildSubjectAttrs(container, prefix = 'certgen') {
  const attrs = []
  const add = (name, id) => {
    const val = container.querySelector(`#${prefix}-${id}`)?.value.trim()
    if (val) attrs.push({ name, value: val })
  }
  add('commonName',            'cn')
  add('organizationName',      'o')
  add('organizationalUnitName','ou')
  add('localityName',          'l')
  add('stateOrProvinceName',   'st')
  add('countryName',           'c')
  add('emailAddress',          'email')
  return attrs
}

function serialNumber() {
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

function renderCertInfo(el, cert, bits, hash) {
  const fmt = d => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const subject = cert.subject.attributes.map(a => `${a.shortName}=${a.value}`).join(', ')
  const rows = [
    ['Subject',   subject],
    ['Serial',    cert.serialNumber],
    ['Gültig ab', fmt(cert.validity.notBefore)],
    ['Gültig bis',fmt(cert.validity.notAfter)],
    ['Schlüssel', `RSA ${bits} Bit`],
    ['Signatur',  `${hash}withRSA`],
  ]
  el.innerHTML = rows.map(([l, v]) => `
    <div class="ipinfo-row">
      <span class="ipinfo-label">${l}</span>
      <span class="ipinfo-value mono">${escapeHtml(String(v))}</span>
    </div>
  `).join('')
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
