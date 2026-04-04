// ============================================================
// CSR Generator — Private Key + Certificate Signing Request
// ============================================================
import forge from 'node-forge'

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">CSR Generator</h1>
        <p class="tool-subtitle">Private Key und Certificate Signing Request (PKCS#10) für eine Certificate Authority erstellen</p>
      </div>

      <div class="pki-form">
        <!-- Subject -->
        <fieldset class="pki-fieldset">
          <legend class="pki-legend">Subject Distinguished Name</legend>
          <div class="pki-grid">
            <div class="pki-field pki-field-wide">
              <label for="csr-cn">Common Name (CN) <span class="required">*</span></label>
              <input id="csr-cn" class="input" type="text" placeholder="z. B. server.example.com oder *.example.com" autocomplete="off">
            </div>
            <div class="pki-field">
              <label for="csr-o">Organization (O)</label>
              <input id="csr-o" class="input" type="text" placeholder="Meine GmbH">
            </div>
            <div class="pki-field">
              <label for="csr-ou">Organizational Unit (OU)</label>
              <input id="csr-ou" class="input" type="text" placeholder="IT-Abteilung">
            </div>
            <div class="pki-field">
              <label for="csr-l">Locality (L)</label>
              <input id="csr-l" class="input" type="text" placeholder="Berlin">
            </div>
            <div class="pki-field">
              <label for="csr-st">State / Province (ST)</label>
              <input id="csr-st" class="input" type="text" placeholder="Bayern">
            </div>
            <div class="pki-field">
              <label for="csr-c">Country (C)</label>
              <input id="csr-c" class="input" type="text" maxlength="2" placeholder="DE" style="text-transform:uppercase">
            </div>
            <div class="pki-field pki-field-wide">
              <label for="csr-email">E-Mail</label>
              <input id="csr-email" class="input" type="email" placeholder="admin@example.com">
            </div>
          </div>
        </fieldset>

        <!-- Key -->
        <fieldset class="pki-fieldset">
          <legend class="pki-legend">Schlüssel</legend>
          <div class="pki-keyrow">
            <div class="pki-field">
              <label>Algorithmus</label>
              <div class="pki-segmented">
                <button class="pki-seg active" data-algo="RSA">RSA</button>
              </div>
            </div>
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
          </div>
        </fieldset>

        <!-- SANs -->
        <fieldset class="pki-fieldset">
          <legend class="pki-legend">Subject Alternative Names (SAN)</legend>
          <div class="pki-san-section">
            <div class="pki-san-col">
              <label class="pki-san-label">DNS-Namen</label>
              <div class="pki-san-input-row">
                <input id="csr-dns-input" class="input" type="text" placeholder="z. B. www.example.com">
                <button id="csr-dns-add" class="btn btn-secondary pki-san-add">+ Hinzufügen</button>
              </div>
              <ul id="csr-dns-list" class="pki-san-list"></ul>
            </div>
            <div class="pki-san-col">
              <label class="pki-san-label">IP-Adressen</label>
              <div class="pki-san-input-row">
                <input id="csr-ip-input" class="input" type="text" placeholder="z. B. 192.168.1.1">
                <button id="csr-ip-add" class="btn btn-secondary pki-san-add">+ Hinzufügen</button>
              </div>
              <ul id="csr-ip-list" class="pki-san-list"></ul>
            </div>
          </div>
        </fieldset>
      </div>

      <div id="csr-error" class="pki-error" hidden></div>

      <button id="csr-generate-btn" class="btn btn-primary pki-generate-btn">CSR + Private Key generieren</button>

      <div id="csr-spinner" class="pki-spinner-row" hidden>
        <div class="spinner"></div>
        <span>Schlüssel wird generiert…</span>
      </div>

      <div id="csr-output" hidden>
        <div class="pki-output-block">
          <div class="pki-output-header">
            <span class="pki-output-label">Private Key (PEM)</span>
            <div class="pki-output-actions">
              <button class="btn btn-sm btn-secondary" data-copy="csr-key-out">Kopieren</button>
              <button class="btn btn-sm btn-secondary" data-download="private.key" data-source="csr-key-out">Download .key</button>
            </div>
          </div>
          <textarea id="csr-key-out" class="pki-textarea" readonly rows="8"></textarea>
        </div>
        <div class="pki-output-block">
          <div class="pki-output-header">
            <span class="pki-output-label">Certificate Signing Request (PEM)</span>
            <div class="pki-output-actions">
              <button class="btn btn-sm btn-secondary" data-copy="csr-csr-out">Kopieren</button>
              <button class="btn btn-sm btn-secondary" data-download="request.csr" data-source="csr-csr-out">Download .csr</button>
            </div>
          </div>
          <textarea id="csr-csr-out" class="pki-textarea" readonly rows="10"></textarea>
        </div>
      </div>
    </div>
  `
}

export function init(container) {
  let selectedBits = 3072
  let selectedHash = 'SHA-256'
  const dnsList = []
  const ipList  = []

  // Segmented controls
  container.querySelectorAll('.pki-segmented').forEach(group => {
    group.querySelectorAll('.pki-seg').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.pki-seg').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        if (btn.dataset.bits) selectedBits = parseInt(btn.dataset.bits)
        if (btn.dataset.hash) selectedHash = btn.dataset.hash
      })
    })
  })

  // SAN helpers
  function addSan(list, arr, inputEl, listEl) {
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

  const dnsInput = container.querySelector('#csr-dns-input')
  const ipInput  = container.querySelector('#csr-ip-input')
  const dnsList2 = container.querySelector('#csr-dns-list')
  const ipList2  = container.querySelector('#csr-ip-list')

  container.querySelector('#csr-dns-add').addEventListener('click', () => addSan(dnsList, dnsList, dnsInput, dnsList2))
  container.querySelector('#csr-ip-add').addEventListener('click',  () => addSan(ipList,  ipList,  ipInput,  ipList2))
  dnsInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSan(dnsList, dnsList, dnsInput, dnsList2) } })
  ipInput.addEventListener('keydown',  e => { if (e.key === 'Enter') { e.preventDefault(); addSan(ipList, ipList, ipInput, ipList2) } })

  // Generate
  const generateBtn = container.querySelector('#csr-generate-btn')
  const spinner     = container.querySelector('#csr-spinner')
  const errorEl     = container.querySelector('#csr-error')
  const output      = container.querySelector('#csr-output')

  generateBtn.addEventListener('click', async () => {
    errorEl.hidden = true
    output.hidden  = true

    const cn = container.querySelector('#csr-cn').value.trim()
    if (!cn) { showError('Common Name (CN) ist erforderlich.'); return }

    const c = container.querySelector('#csr-c').value.trim().toUpperCase()
    if (c && !/^[A-Z]{2}$/.test(c)) { showError('Country (C) muss ein 2-stelliger ISO-Ländercode sein (z. B. DE).'); return }

    generateBtn.disabled = true
    spinner.hidden = false

    try {
      const keypair = await generateKeyPair(selectedBits)
      const md = hashMd(selectedHash)

      const attrs = buildAttrs(container)
      const csr   = forge.pki.createCertificationRequest()
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

      csr.sign(keypair.privateKey, md)

      container.querySelector('#csr-key-out').value = forge.pki.privateKeyToPem(keypair.privateKey)
      container.querySelector('#csr-csr-out').value = forge.pki.certificationRequestToPem(csr)
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

  // Copy + Download buttons
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

// ---- shared helpers (also used by certgen) ----

export function buildAttrs(container, prefix = 'csr') {
  const attrs = []
  const add = (name, id) => {
    const val = container.querySelector(`#${prefix}-${id}`)?.value.trim()
    if (val) attrs.push({ name, value: val })
  }
  add('commonName',           'cn')
  add('organizationName',     'o')
  add('organizationalUnitName','ou')
  add('localityName',         'l')
  add('stateOrProvinceName',  'st')
  add('countryName',          'c')
  add('emailAddress',         'email')
  return attrs
}

export function generateKeyPair(bits) {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits, workers: -1 }, (err, kp) => {
      err ? reject(err) : resolve(kp)
    })
  })
}

export function hashMd(name) {
  if (name === 'SHA-384') return forge.md.sha384.create()
  if (name === 'SHA-512') return forge.md.sha512.create()
  return forge.md.sha256.create()
}

export function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10000)
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
