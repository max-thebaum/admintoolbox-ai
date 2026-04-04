// ============================================================
// Speed Calculator — Pure Logic + DOM Wiring
// ============================================================

// ---- Pure calculation functions ----

function toBytes(value, unit) {
  const v = parseFloat(value)
  if (isNaN(v) || v < 0) return null
  const map = {
    'KB':  1e3,   'MB':  1e6,   'GB':  1e9,   'TB':  1e12,
    'KiB': 1024,  'MiB': 1048576, 'GiB': 1073741824, 'TiB': 1099511627776
  }
  return v * (map[unit] || 1)
}

function toSeconds(value, unit) {
  const v = parseFloat(value)
  if (isNaN(v) || v < 0) return null
  const map = { 's': 1, 'min': 60, 'h': 3600 }
  return v * (map[unit] || 1)
}

function toBitsPerSec(value, unit) {
  const v = parseFloat(value)
  if (isNaN(v) || v < 0) return null
  const map = {
    'Kbps': 1e3,    'Mbps': 1e6,    'Gbps': 1e9,
    'KBps': 8e3,    'MBps': 8e6,    'GBps': 8e9
  }
  return v * (map[unit] || 1)
}

function formatBytes(bytes) {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`
  if (bytes >= 1e9)  return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes >= 1e6)  return `${(bytes / 1e6).toFixed(2)} MB`
  if (bytes >= 1e3)  return `${(bytes / 1e3).toFixed(2)} KB`
  return `${bytes.toFixed(0)} B`
}

function formatSeconds(sec) {
  if (sec < 60) return `${sec.toFixed(2)} s`
  if (sec < 3600) return `${(sec / 60).toFixed(2)} min`
  return `${(sec / 3600).toFixed(3)} h`
}

function toHHMMSS(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export function calcSpeed(bytes, seconds) {
  if (bytes === null || seconds === null || seconds <= 0) return null
  const bps = (bytes * 8) / seconds
  return {
    Mbps:  (bps / 1e6).toFixed(4),
    Gbps:  (bps / 1e9).toFixed(6),
    MBps:  (bytes / seconds / 1e6).toFixed(4),
    GBps:  (bytes / seconds / 1e9).toFixed(6),
    bps
  }
}

export function calcTime(bytes, bps) {
  if (bytes === null || bps === null || bps <= 0) return null
  const sec = (bytes * 8) / bps
  return {
    seconds:  sec.toFixed(2),
    minutes:  (sec / 60).toFixed(4),
    hhmmss:   toHHMMSS(sec),
    human:    formatSeconds(sec),
    sec
  }
}

// ---- Reference data ----
const FILE_REFS = [
  { name: '1 Song (MP3)',      size: '~5 MB'  },
  { name: '1 Foto (JPEG)',     size: '~3 MB'  },
  { name: 'HD-Film (720p)',    size: '~2 GB'  },
  { name: '4K-Film',           size: '~15 GB' },
  { name: 'DVD-Image',         size: '~4,7 GB'},
  { name: 'Blu-ray-Image',     size: '~25 GB' },
  { name: 'Windows ISO',       size: '~6 GB'  },
  { name: '1 Stunde Zoom',     size: '~1 GB'  }
]

const SPEED_REFS = [
  { name: 'USB 2.0',         speed: '480 Mbps' },
  { name: 'USB 3.0',         speed: '5 Gbps'   },
  { name: 'LAN (1 GbE)',     speed: '1 Gbps'   },
  { name: '10 GbE',          speed: '10 Gbps'  },
  { name: 'WLAN 802.11ac',   speed: '~866 Mbps'},
  { name: 'LTE (avg.)',      speed: '~50 Mbps' },
  { name: '5G (avg.)',       speed: '~300 Mbps'},
  { name: 'DSL 50',          speed: '50 Mbps'  }
]

// ---- HTML Template ----

export function html() {
  return `
<div class="tool-panel">
  <div class="tool-header">
    <h2>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
      Speed-Rechner
    </h2>
    <p>Übertragungszeit oder -geschwindigkeit aus Dateigröße berechnen</p>
  </div>

  <div class="tool-body">
    <!-- Mode selector -->
    <div class="segmented" role="group" aria-label="Berechnungsmodus">
      <button class="segmented-btn active" data-calcmode="speed" aria-pressed="true">
        Größe + Zeit → Geschwindigkeit
      </button>
      <button class="segmented-btn" data-calcmode="time" aria-pressed="false">
        Größe + Geschwindigkeit → Zeit
      </button>
    </div>

    <div style="margin-top: 20px;">
      <!-- File size row (shared) -->
      <div class="form-row" style="margin-bottom:14px">
        <label for="sc-filesize">Dateigröße</label>
        <div class="input-group">
          <input id="sc-filesize" class="input mono" type="number" min="0"
                 placeholder="4.7" autocomplete="off" aria-describedby="sc-size-err" />
          <select id="sc-size-unit" class="select">
            <option value="MB" selected>MB</option>
            <option value="KB">KB</option>
            <option value="GB">GB</option>
            <option value="TB">TB</option>
            <option value="MiB">MiB</option>
            <option value="GiB">GiB</option>
          </select>
        </div>
        <span class="input-error-msg" id="sc-size-err" role="alert"></span>
      </div>

      <!-- Mode A: Time input -->
      <div id="sc-time-row" class="form-row" style="margin-bottom:14px">
        <label for="sc-time">Übertragungszeit</label>
        <div class="input-group">
          <input id="sc-time" class="input mono" type="number" min="0"
                 placeholder="30" autocomplete="off" aria-describedby="sc-time-err" />
          <select id="sc-time-unit" class="select">
            <option value="s" selected>Sekunden</option>
            <option value="min">Minuten</option>
            <option value="h">Stunden</option>
          </select>
        </div>
        <span class="input-error-msg" id="sc-time-err" role="alert"></span>
      </div>

      <!-- Mode B: Speed input -->
      <div id="sc-speed-row" class="form-row" style="display:none; margin-bottom:14px">
        <label for="sc-speed">Übertragungsgeschwindigkeit</label>
        <div class="input-group">
          <input id="sc-speed" class="input mono" type="number" min="0"
                 placeholder="100" autocomplete="off" aria-describedby="sc-speed-err" />
          <select id="sc-speed-unit" class="select">
            <option value="Mbps" selected>Mbps</option>
            <option value="Kbps">Kbps</option>
            <option value="Gbps">Gbps</option>
            <option value="MBps">MB/s</option>
            <option value="GBps">GB/s</option>
          </select>
        </div>
        <span class="input-error-msg" id="sc-speed-err" role="alert"></span>
      </div>
    </div>

    <!-- Results -->
    <div id="sc-results" style="display:none">
      <div class="divider"></div>
      <div class="result-section">
        <div class="result-section-title" id="sc-result-title">Übertragungsgeschwindigkeit</div>
        <div class="result-grid" id="sc-result-grid"></div>
      </div>
    </div>

    <!-- Reference tables -->
    <div class="divider" style="margin-top:24px"></div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div class="ref-table-wrap">
        <div class="ref-table-title">Typische Dateigrößen</div>
        <table class="ref-table" aria-label="Typische Dateigrößen">
          <thead><tr><th>Datei</th><th>Größe</th></tr></thead>
          <tbody>
            ${FILE_REFS.map(r => `<tr><td>${r.name}</td><td>${r.size}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="ref-table-wrap">
        <div class="ref-table-title">Typische Übertragungsraten</div>
        <table class="ref-table" aria-label="Typische Übertragungsraten">
          <thead><tr><th>Technologie</th><th>Speed</th></tr></thead>
          <tbody>
            ${SPEED_REFS.map(r => `<tr><td>${r.name}</td><td>${r.speed}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
  `
}

// ---- DOM init ----
export function init(container) {
  let calcMode = 'speed'
  let debounceTimer = null

  const filesizeInput = container.querySelector('#sc-filesize')
  const sizeUnitSel   = container.querySelector('#sc-size-unit')
  const timeInput     = container.querySelector('#sc-time')
  const timeUnitSel   = container.querySelector('#sc-time-unit')
  const speedInput    = container.querySelector('#sc-speed')
  const speedUnitSel  = container.querySelector('#sc-speed-unit')
  const timeRow       = container.querySelector('#sc-time-row')
  const speedRow      = container.querySelector('#sc-speed-row')
  const results       = container.querySelector('#sc-results')
  const resultGrid    = container.querySelector('#sc-result-grid')
  const resultTitle   = container.querySelector('#sc-result-title')
  const sizeErr       = container.querySelector('#sc-size-err')
  const timeErr       = container.querySelector('#sc-time-err')
  const speedErr      = container.querySelector('#sc-speed-err')

  // Mode switch
  container.querySelectorAll('.segmented-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      calcMode = btn.dataset.calcmode
      container.querySelectorAll('.segmented-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.calcmode === calcMode)
        b.setAttribute('aria-pressed', String(b.dataset.calcmode === calcMode))
      })
      if (calcMode === 'speed') {
        timeRow.style.display  = ''
        speedRow.style.display = 'none'
        resultTitle.textContent = 'Übertragungsgeschwindigkeit'
      } else {
        timeRow.style.display  = 'none'
        speedRow.style.display = ''
        resultTitle.textContent = 'Übertragungszeit'
      }
      results.style.display = 'none'
      clearErrors()
      scheduleCalc()
    })
  })

  function clearErrors() {
    sizeErr.textContent  = ''
    timeErr.textContent  = ''
    speedErr.textContent = ''
  }

  function scheduleCalc() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(calculate, 150)
  }

  function calculate() {
    clearErrors()

    const sizeVal  = filesizeInput.value
    const sizeUnit = sizeUnitSel.value

    if (!sizeVal) { results.style.display = 'none'; return }

    const bytes = toBytes(sizeVal, sizeUnit)
    if (bytes === null || bytes < 0) {
      sizeErr.textContent = 'Ungültige Dateigröße'
      results.style.display = 'none'
      return
    }

    if (calcMode === 'speed') {
      const timeVal  = timeInput.value
      const timeUnit = timeUnitSel.value
      if (!timeVal) { results.style.display = 'none'; return }

      const seconds = toSeconds(timeVal, timeUnit)
      if (seconds === null || seconds <= 0) {
        timeErr.textContent = 'Ungültige Zeit'
        results.style.display = 'none'
        return
      }

      const r = calcSpeed(bytes, seconds)
      if (!r) { results.style.display = 'none'; return }

      const best = getBestSpeedUnit(r.bps)
      resultGrid.innerHTML = [
        { label: 'Megabit/s (Mbps)',  value: `${r.Mbps} Mbps`,  highlight: best === 'Mbps' },
        { label: 'Gigabit/s (Gbps)',  value: `${r.Gbps} Gbps`,  highlight: best === 'Gbps' },
        { label: 'Megabyte/s (MB/s)', value: `${r.MBps} MB/s`,  highlight: best === 'MBps' },
        { label: 'Gigabyte/s (GB/s)', value: `${r.GBps} GB/s`,  highlight: best === 'GBps' }
      ].map(row => `
        <div class="result-row${row.highlight ? ' result-row--highlight' : ''}">
          <span class="result-label">${row.label}</span>
          <span class="result-value${row.highlight ? ' accent' : ''}">${row.value}</span>
        </div>
      `).join('')
      results.style.display = 'block'

    } else {
      const speedVal  = speedInput.value
      const speedUnit = speedUnitSel.value
      if (!speedVal) { results.style.display = 'none'; return }

      const bps = toBitsPerSec(speedVal, speedUnit)
      if (bps === null || bps <= 0) {
        speedErr.textContent = 'Ungültige Geschwindigkeit'
        results.style.display = 'none'
        return
      }

      const r = calcTime(bytes, bps)
      if (!r) { results.style.display = 'none'; return }

      const humanSec = parseFloat(r.seconds)
      resultGrid.innerHTML = [
        { label: 'Sekunden',  value: `${r.seconds} s`,    highlight: humanSec < 60 },
        { label: 'Minuten',   value: `${r.minutes} min`,  highlight: humanSec >= 60 && humanSec < 3600 },
        { label: 'HH:MM:SS',  value: r.hhmmss,            highlight: humanSec >= 3600 },
        { label: 'Lesbar',    value: r.human,             highlight: false }
      ].map(row => `
        <div class="result-row${row.highlight ? ' result-row--highlight' : ''}">
          <span class="result-label">${row.label}</span>
          <span class="result-value${row.highlight ? ' accent' : ''}">${row.value}</span>
        </div>
      `).join('')
      results.style.display = 'block'
    }
  }

  function getBestSpeedUnit(bps) {
    if (bps >= 1e9)      return 'Gbps'
    if (bps >= 1e8)      return 'MBps'  // ~100 MB/s range — show MB/s as primary
    if (bps >= 1e6)      return 'Mbps'
    return 'Mbps'
  }

  // Live calculation
  const inputs = [filesizeInput, timeInput, speedInput]
  const selects = [sizeUnitSel, timeUnitSel, speedUnitSel]

  inputs.forEach(inp => inp.addEventListener('input', scheduleCalc))
  selects.forEach(sel => sel.addEventListener('change', scheduleCalc))

  filesizeInput.focus()
}
