// ============================================================
// Subnet Calculator — Pure Logic + DOM Wiring
// ============================================================

// ---- Pure calculation functions ----

function ipToInt(ip) {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    const v = parseInt(p, 10)
    if (isNaN(v) || v < 0 || v > 255) return null
    n = (n * 256) + v
  }
  return n >>> 0
}

function intToIp(n) {
  return [
    (n >>> 24) & 0xFF,
    (n >>> 16) & 0xFF,
    (n >>>  8) & 0xFF,
    n & 0xFF
  ].join('.')
}

function cidrToMask(prefix) {
  const p = parseInt(prefix, 10)
  if (isNaN(p) || p < 0 || p > 32) return null
  if (p === 0) return 0
  return (0xFFFFFFFF << (32 - p)) >>> 0
}

function maskToCidr(mask) {
  let n = mask >>> 0
  let count = 0
  while (n & 0x80000000) { count++; n = (n << 1) >>> 0 }
  // Verify contiguous (no holes)
  const rebuilt = cidrToMask(count)
  if (rebuilt !== mask) return null
  return count
}

function dotMaskToInt(mask) {
  return ipToInt(mask)
}

function toBinary32(n) {
  return (n >>> 0).toString(2).padStart(32, '0')
}

function getIpClass(ipInt) {
  const first = (ipInt >>> 24) & 0xFF
  if (first < 128) return 'A'
  if (first < 192) return 'B'
  if (first < 224) return 'C'
  if (first < 240) return 'D'
  return 'E'
}

export function calculateSubnet(ip, cidrOrMask, mode) {
  const ipInt = ipToInt(ip)
  if (ipInt === null) return { error: 'ip', msg: 'Ungültige IP-Adresse' }

  let prefix, maskInt

  if (mode === 'cidr') {
    const p = parseInt(cidrOrMask.replace('/', ''), 10)
    if (isNaN(p) || p < 0 || p > 32) return { error: 'mask', msg: 'CIDR muss zwischen /0 und /32 liegen' }
    prefix = p
    maskInt = cidrToMask(p)
  } else {
    maskInt = dotMaskToInt(cidrOrMask)
    if (maskInt === null) return { error: 'mask', msg: 'Ungültige Subnetzmaske' }
    prefix = maskToCidr(maskInt)
    if (prefix === null) return { error: 'mask', msg: 'Subnetzmaske nicht zusammenhängend' }
  }

  const networkInt    = (ipInt & maskInt) >>> 0
  const broadcastInt  = (networkInt | (~maskInt >>> 0)) >>> 0
  const wildcardInt   = (~maskInt) >>> 0
  const totalHosts    = prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.pow(2, 32 - prefix) - 2
  const firstHostInt  = prefix >= 31 ? networkInt  : (networkInt + 1) >>> 0
  const lastHostInt   = prefix >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0

  return {
    ip:           ip.trim(),
    prefix,
    network:      intToIp(networkInt),
    broadcast:    intToIp(broadcastInt),
    firstHost:    intToIp(firstHostInt),
    lastHost:     intToIp(lastHostInt),
    mask:         intToIp(maskInt),
    wildcard:     intToIp(wildcardInt),
    totalHosts:   totalHosts.toLocaleString('de-DE'),
    ipClass:      getIpClass(ipInt),
    ipBin:        toBinary32(ipInt),
    maskBin:      toBinary32(maskInt),
    networkBin:   toBinary32(networkInt),
    prefix32:     prefix,
    maskInt,
    ipInt
  }
}

// ---- HTML Template ----

export function html() {
  return `
<div class="tool-panel">
  <div class="tool-header">
    <h2>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="2" y="3" width="7" height="5" rx="1"/><rect x="15" y="3" width="7" height="5" rx="1"/>
        <rect x="8.5" y="10" width="7" height="5" rx="1"/><rect x="2" y="17" width="7" height="5" rx="1"/>
        <rect x="15" y="17" width="7" height="5" rx="1"/>
        <line x1="5.5" y1="8" x2="5.5" y2="17"/><line x1="18.5" y1="8" x2="18.5" y2="17"/>
        <line x1="5.5" y1="12.5" x2="8.5" y2="12.5"/><line x1="15.5" y1="12.5" x2="18.5" y2="12.5"/>
      </svg>
      Subnet-Rechner
    </h2>
    <p>IP-Adresse und Subnetz analysieren — Netz, Broadcast, Hosts und Binärdarstellung</p>
  </div>

  <div class="tool-body">
    <div class="form-grid">
      <div class="form-row full">
        <label for="subnet-ip">IP-Adresse</label>
        <input id="subnet-ip" class="input mono" type="text"
               placeholder="192.168.1.0" autocomplete="off"
               inputmode="decimal" aria-describedby="subnet-ip-err" />
        <span class="input-error-msg" id="subnet-ip-err" role="alert"></span>
      </div>

      <div class="form-row full">
        <label>Eingabeformat</label>
        <div class="toggle-group" role="group" aria-label="CIDR oder Subnetzmaske">
          <button class="toggle-btn active" data-mode="cidr" aria-pressed="true">/CIDR</button>
          <button class="toggle-btn" data-mode="mask" aria-pressed="false">Subnetzmaske</button>
        </div>
      </div>

      <div class="form-row full">
        <label for="subnet-mask" id="subnet-mask-label">CIDR-Präfix</label>
        <input id="subnet-mask" class="input mono" type="text"
               placeholder="/24" autocomplete="off"
               aria-describedby="subnet-mask-err" />
        <span class="input-error-msg" id="subnet-mask-err" role="alert"></span>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-primary" id="subnet-calc-btn">Berechnen</button>
      <button class="btn btn-secondary" id="subnet-clear-btn">Zurücksetzen</button>
    </div>

    <div id="subnet-results" style="display:none">
      <div class="divider"></div>

      <div class="result-section">
        <div class="result-section-title">Netzwerkinformation</div>
        <div class="result-grid" id="subnet-result-grid"></div>
        <div class="copy-all-row">
          <button class="btn btn-ghost" id="subnet-copy-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Alles kopieren
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <div class="result-section">
        <div class="result-section-title">Binärdarstellung</div>
        <div id="subnet-binary-viz" class="binary-viz"></div>
      </div>
    </div>
  </div>
</div>
  `
}

// ---- Copy icon SVG ----
const COPY_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
const CHECK_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = CHECK_ICON
    btn.classList.add('copied')
    setTimeout(() => {
      btn.innerHTML = COPY_ICON
      btn.classList.remove('copied')
    }, 1500)
  })
}

// ---- Result rows config ----
function buildResultRows(r) {
  return [
    { label: 'Netzadresse',     value: r.network,    accent: false },
    { label: 'Broadcast',       value: r.broadcast,  accent: false },
    { label: 'Erste Host-IP',   value: r.firstHost,  accent: false },
    { label: 'Letzte Host-IP',  value: r.lastHost,   accent: false },
    { label: 'Anzahl Hosts',    value: r.totalHosts, accent: true  },
    { label: 'Subnetzmaske',    value: r.mask,       accent: false },
    { label: 'CIDR',            value: `/${r.prefix}`, accent: false },
    { label: 'Wildcard Maske',  value: r.wildcard,   accent: false },
    { label: 'IP-Klasse',       value: r.ipClass,    badge: true   }
  ]
}

// ---- Binary visualization ----
function renderBinaryViz(r) {
  const prefix = r.prefix32
  const ipBin  = r.ipBin
  const mkBin  = r.maskBin

  function renderOctets(binStr, highlightFn, label) {
    const octets = [0,1,2,3].map(i => binStr.slice(i*8, i*8+8))
    const decimalParts = r.ip.split('.')
    const maskDecParts = r.mask.split('.')

    return `
      <div class="bin-row">
        <div class="bin-row-label">${label}</div>
        <div class="bin-octets">
          ${octets.map((oct, oi) => {
            const decimal = label === 'IP' ? decimalParts[oi] : maskDecParts[oi]
            const bits = oct.split('').map((bit, bi) => {
              const absPos = oi * 8 + bi
              const isNet = absPos < prefix
              return `<span class="bin-bit ${isNet ? 'net' : 'host'}">${bit}</span>`
            }).join('')
            return `
              <div class="bin-octet">
                <div class="bin-dec">${decimal}</div>
                <div class="bin-bits">${bits}</div>
              </div>
            `
          }).join('<div class="bin-dot">.</div>')}
        </div>
      </div>
    `
  }

  return `
    <div class="bin-container">
      ${renderOctets(ipBin,  null, 'IP')}
      <div class="bin-spacer"></div>
      ${renderOctets(mkBin, null, 'Maske')}
      <div class="bin-legend">
        <span class="bin-legend-item net">Netzanteil (${prefix} Bit)</span>
        <span class="bin-legend-item host">Hostanteil (${32 - prefix} Bit)</span>
      </div>
    </div>
  `
}

// ---- DOM init ----
export function init(container) {
  let mode = 'cidr'
  let lastResult = null

  const ipInput    = container.querySelector('#subnet-ip')
  const maskInput  = container.querySelector('#subnet-mask')
  const maskLabel  = container.querySelector('#subnet-mask-label')
  const ipErr      = container.querySelector('#subnet-ip-err')
  const maskErr    = container.querySelector('#subnet-mask-err')
  const calcBtn    = container.querySelector('#subnet-calc-btn')
  const clearBtn   = container.querySelector('#subnet-clear-btn')
  const results    = container.querySelector('#subnet-results')
  const resultGrid = container.querySelector('#subnet-result-grid')
  const binaryViz  = container.querySelector('#subnet-binary-viz')
  const copyAllBtn = container.querySelector('#subnet-copy-all')

  // Toggle CIDR / Mask mode
  container.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode
      container.querySelectorAll('.toggle-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode)
        b.setAttribute('aria-pressed', String(b.dataset.mode === mode))
      })
      if (mode === 'cidr') {
        maskLabel.textContent = 'CIDR-Präfix'
        maskInput.placeholder = '/24'
      } else {
        maskLabel.textContent = 'Subnetzmaske'
        maskInput.placeholder = '255.255.255.0'
      }
      maskInput.value = ''
      clearErrors()
    })
  })

  function clearErrors() {
    ipErr.textContent = ''
    maskErr.textContent = ''
    ipInput.classList.remove('error', 'valid')
    maskInput.classList.remove('error', 'valid')
  }

  function calculate() {
    clearErrors()
    const ip   = ipInput.value.trim()
    const mask = maskInput.value.trim()

    if (!ip) { ipErr.textContent = 'Bitte IP-Adresse eingeben'; ipInput.classList.add('error'); return }
    if (!mask) { maskErr.textContent = 'Bitte Wert eingeben'; maskInput.classList.add('error'); return }

    const r = calculateSubnet(ip, mask, mode)

    if (r.error === 'ip') {
      ipErr.textContent = r.msg; ipInput.classList.add('error'); return
    }
    if (r.error === 'mask') {
      maskErr.textContent = r.msg; maskInput.classList.add('error'); return
    }

    ipInput.classList.add('valid')
    maskInput.classList.add('valid')
    lastResult = r
    renderResults(r)
  }

  function renderResults(r) {
    const rows = buildResultRows(r)
    resultGrid.innerHTML = rows.map(row => `
      <div class="result-row">
        <span class="result-label">${row.label}</span>
        ${row.badge
          ? `<span class="result-value"><span class="badge badge-accent">Klasse ${row.value}</span></span>`
          : `<span class="result-value${row.accent ? ' accent' : ''}">${row.value}</span>`
        }
        <button class="result-copy-btn" aria-label="${row.label} kopieren" data-copy="${row.value}">${COPY_ICON}</button>
      </div>
    `).join('')

    binaryViz.innerHTML = renderBinaryViz(r)
    results.style.display = 'block'

    // Wire copy buttons
    resultGrid.querySelectorAll('.result-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy, btn))
    })
  }

  calcBtn.addEventListener('click', calculate)

  // Enter key
  [ipInput, maskInput].forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') calculate() })
  })

  clearBtn.addEventListener('click', () => {
    ipInput.value = ''
    maskInput.value = ''
    results.style.display = 'none'
    clearErrors()
    lastResult = null
  })

  copyAllBtn.addEventListener('click', () => {
    if (!lastResult) return
    const r = lastResult
    const text = [
      `IP-Adresse:     ${r.ip}`,
      `Netzadresse:    ${r.network}`,
      `Broadcast:      ${r.broadcast}`,
      `Erste Host-IP:  ${r.firstHost}`,
      `Letzte Host-IP: ${r.lastHost}`,
      `Anzahl Hosts:   ${r.totalHosts}`,
      `Subnetzmaske:   ${r.mask}`,
      `CIDR:           /${r.prefix}`,
      `Wildcard Maske: ${r.wildcard}`,
      `IP-Klasse:      ${r.ipClass}`
    ].join('\n')
    copyToClipboard(text, copyAllBtn)
    const orig = copyAllBtn.innerHTML
    copyAllBtn.textContent = '✓ Kopiert'
    setTimeout(() => { copyAllBtn.innerHTML = orig }, 1500)
  })

  // Auto-focus IP field
  ipInput.focus()
}
