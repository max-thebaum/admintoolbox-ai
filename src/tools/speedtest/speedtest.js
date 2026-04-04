const CHUNKS = 5

export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10"/>
            <path d="M12 12 19.07 4.93"/>
            <path d="M15 2.46A10 10 0 0 1 21.54 9"/>
          </svg>
          Speedtest
        </h1>
        <p class="tool-subtitle">Download, Upload und Latenz zum Server messen</p>
      </div>
      <div class="tool-body">

        <div class="st-config">
          <div class="form-row" style="margin-bottom:0;flex:1;min-width:160px">
            <label for="st-size">Testgröße</label>
            <select id="st-size" class="input">
              <option value="10">10 MB</option>
              <option value="25" selected>25 MB</option>
              <option value="50">50 MB</option>
              <option value="100">100 MB</option>
            </select>
          </div>
          <button id="st-start" class="btn btn-primary" style="align-self:flex-end">Test starten</button>
        </div>

        <div id="st-err" class="input-error-msg" role="alert"></div>

        <div id="st-results" hidden>

          <!-- Phase progress -->
          <div class="st-phases">
            <div class="st-phase-item" id="st-ph-ping" data-state="idle">
              <span class="st-phase-dot"></span>
              <span class="st-phase-name">Ping</span>
              <div class="st-phase-bar"><div class="st-phase-fill" id="st-ph-ping-fill"></div></div>
            </div>
            <div class="st-phase-item" id="st-ph-dl" data-state="idle">
              <span class="st-phase-dot"></span>
              <span class="st-phase-name">Download</span>
              <div class="st-phase-bar"><div class="st-phase-fill" id="st-ph-dl-fill"></div></div>
            </div>
            <div class="st-phase-item" id="st-ph-ul" data-state="idle">
              <span class="st-phase-dot"></span>
              <span class="st-phase-name">Upload</span>
              <div class="st-phase-bar"><div class="st-phase-fill" id="st-ph-ul-fill"></div></div>
            </div>
          </div>

          <!-- Main gauges -->
          <div class="st-gauges">
            <div class="st-gauge st-gauge--dl">
              <div class="st-gauge-icon">↓</div>
              <div class="st-gauge-number" id="st-dl-val">—</div>
              <div class="st-gauge-unit">Mbps</div>
              <div class="st-gauge-label">Download</div>
            </div>
            <div class="st-gauge st-gauge--ul">
              <div class="st-gauge-icon">↑</div>
              <div class="st-gauge-number" id="st-ul-val">—</div>
              <div class="st-gauge-unit">Mbps</div>
              <div class="st-gauge-label">Upload</div>
            </div>
            <div class="st-gauge st-gauge--sm">
              <div class="st-gauge-number" id="st-ping-val">—</div>
              <div class="st-gauge-unit">ms</div>
              <div class="st-gauge-label">Ping</div>
            </div>
            <div class="st-gauge st-gauge--sm">
              <div class="st-gauge-number" id="st-jitter-val">—</div>
              <div class="st-gauge-unit">ms</div>
              <div class="st-gauge-label">Jitter</div>
            </div>
          </div>

          <!-- Live chart -->
          <div class="st-chart-wrap">
            <svg id="st-chart" viewBox="0 0 460 160" preserveAspectRatio="xMidYMid meet"></svg>
          </div>

          <!-- Detail grid — 12 metrics -->
          <div class="st-detail-grid">
            <div class="st-metric"><div class="st-metric-label">Ping Min</div><div class="st-metric-val" id="st-d-ping-min">—</div></div>
            <div class="st-metric"><div class="st-metric-label">Ping Ø</div><div class="st-metric-val" id="st-d-ping-avg">—</div></div>
            <div class="st-metric"><div class="st-metric-label">Ping Max</div><div class="st-metric-val" id="st-d-ping-max">—</div></div>
            <div class="st-metric"><div class="st-metric-label">Jitter</div><div class="st-metric-val" id="st-d-jitter">—</div></div>

            <div class="st-metric"><div class="st-metric-label">DL Min</div><div class="st-metric-val" id="st-d-dl-min">—</div></div>
            <div class="st-metric"><div class="st-metric-label">DL Ø</div><div class="st-metric-val st-metric-val--accent" id="st-d-dl-avg">—</div></div>
            <div class="st-metric"><div class="st-metric-label">DL Max</div><div class="st-metric-val" id="st-d-dl-max">—</div></div>
            <div class="st-metric"><div class="st-metric-label">TTFB</div><div class="st-metric-val" id="st-d-ttfb">—</div></div>

            <div class="st-metric"><div class="st-metric-label">UL Min</div><div class="st-metric-val" id="st-d-ul-min">—</div></div>
            <div class="st-metric"><div class="st-metric-label">UL Ø</div><div class="st-metric-val st-metric-val--success" id="st-d-ul-avg">—</div></div>
            <div class="st-metric"><div class="st-metric-label">UL Max</div><div class="st-metric-val" id="st-d-ul-max">—</div></div>
            <div class="st-metric"><div class="st-metric-label">Protokoll</div><div class="st-metric-val" id="st-d-proto">—</div></div>
          </div>

        </div>
      </div>
    </div>`
}

// ── Chart renderer ──────────────────────────────────────────────────────────
function renderChart(container, dlData, ulData) {
  const svg = container.querySelector('#st-chart')
  if (!svg) return

  const W = 460, H = 160
  const ML = 50, MR = 12, MT = 16, MB = 26
  const CW = W - ML - MR
  const CH = H - MT - MB

  const allVals = [...dlData, ...ulData]
  const maxVal  = allVals.length > 0 ? Math.max(...allVals) : 0
  const yMax    = Math.ceil((maxVal * 1.25 + 1) / 10) * 10 || 100

  const xPos = i => ML + (i / (CHUNKS - 1)) * CW
  const yPos = v => MT + CH - (v / yMax) * CH

  let s = ''

  // Horizontal grid lines + Y labels
  for (let g = 0; g <= 4; g++) {
    const y     = MT + (g / 4) * CH
    const label = Math.round(yMax * (1 - g / 4))
    s += `<line x1="${ML}" y1="${y.toFixed(1)}" x2="${W - MR}" y2="${y.toFixed(1)}" stroke="var(--border-subtle)" stroke-width="1"/>`
    s += `<text x="${(ML - 5).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="var(--text-muted)" font-size="10" font-family="monospace">${label}</text>`
  }

  // X axis tick labels
  for (let i = 0; i < CHUNKS; i++) {
    s += `<text x="${xPos(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-family="monospace">${i + 1}</text>`
  }

  // Axes
  s += `<line x1="${ML}" y1="${MT}" x2="${ML}" y2="${MT + CH}" stroke="var(--border)" stroke-width="1"/>`
  s += `<line x1="${ML}" y1="${MT + CH}" x2="${W - MR}" y2="${MT + CH}" stroke="var(--border)" stroke-width="1"/>`

  // Download line
  if (dlData.length >= 2) {
    const pts = dlData.map((v, i) => `${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(' ')
    s += `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`
  }
  dlData.forEach((v, i) => {
    s += `<circle cx="${xPos(i).toFixed(1)}" cy="${yPos(v).toFixed(1)}" r="4" fill="var(--accent)"/>`
  })

  // Upload line
  if (ulData.length >= 2) {
    const pts = ulData.map((v, i) => `${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(' ')
    s += `<polyline points="${pts}" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`
  }
  ulData.forEach((v, i) => {
    s += `<circle cx="${xPos(i).toFixed(1)}" cy="${yPos(v).toFixed(1)}" r="4" fill="var(--success)"/>`
  })

  // Mbps unit on Y axis (rotated)
  s += `<text x="${ML - 28}" y="${MT + CH / 2}" text-anchor="middle" fill="var(--text-muted)" font-size="9" font-family="monospace" transform="rotate(-90 ${ML - 28} ${MT + CH / 2})">Mbps</text>`

  // Legend
  s += `<rect x="${ML + 4}" y="${MT - 3}" width="16" height="4" rx="2" fill="var(--accent)"/>`
  s += `<text x="${ML + 24}" y="${MT + 3}" fill="var(--text-secondary)" font-size="10">Download</text>`
  s += `<rect x="${ML + 96}" y="${MT - 3}" width="16" height="4" rx="2" fill="var(--success)"/>`
  s += `<text x="${ML + 116}" y="${MT + 3}" fill="var(--text-secondary)" font-size="10">Upload</text>`

  svg.innerHTML = s
}

// ── UI helpers ───────────────────────────────────────────────────────────────
function setPhaseState(container, phase, state) {
  const el = container.querySelector(`#st-ph-${phase}`)
  if (el) el.dataset.state = state
}

function setPhaseProgress(container, phase, fraction) {
  const fill = container.querySelector(`#st-ph-${phase}-fill`)
  if (fill) fill.style.width = `${Math.round(fraction * 100)}%`
}

function resetDisplay(container) {
  ;['ping', 'dl', 'ul'].forEach(p => {
    setPhaseState(container, p, 'idle')
    setPhaseProgress(container, p, 0)
  })
  ;['#st-dl-val', '#st-ul-val', '#st-ping-val', '#st-jitter-val'].forEach(sel => {
    const el = container.querySelector(sel)
    if (el) el.textContent = '—'
  })
  container.querySelector('#st-chart').innerHTML = ''
  container.querySelectorAll('.st-metric-val').forEach(el => { el.textContent = '—' })
}

function fillDetail(container, d) {
  const set = (id, text) => {
    const el = container.querySelector(id)
    if (el) el.textContent = text
  }
  set('#st-d-ping-min', `${d.pingMin} ms`)
  set('#st-d-ping-avg', `${d.pingAvg} ms`)
  set('#st-d-ping-max', `${d.pingMax} ms`)
  set('#st-d-jitter',   `${d.jitter.toFixed(1)} ms`)
  set('#st-d-dl-min',   `${d.dlMin.toFixed(1)} Mbps`)
  set('#st-d-dl-avg',   `${d.dlAvg.toFixed(1)} Mbps`)
  set('#st-d-dl-max',   `${d.dlMax.toFixed(1)} Mbps`)
  set('#st-d-ttfb',     d.ttfb != null ? `${d.ttfb} ms` : '—')
  set('#st-d-ul-min',   `${d.ulMin.toFixed(1)} Mbps`)
  set('#st-d-ul-avg',   `${d.ulAvg.toFixed(1)} Mbps`)
  set('#st-d-ul-max',   `${d.ulMax.toFixed(1)} Mbps`)
  set('#st-d-proto',    d.proto.toUpperCase())
}

// ── Math helpers ─────────────────────────────────────────────────────────────
function arrAvg(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function stdDev(arr) {
  const m = arrAvg(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function genRandomBuffer(bytes) {
  const buf   = new Uint8Array(bytes)
  const CHUNK = 65536
  for (let off = 0; off < bytes; off += CHUNK) {
    crypto.getRandomValues(buf.subarray(off, Math.min(off + CHUNK, bytes)))
  }
  return buf.buffer
}

// ── Init ─────────────────────────────────────────────────────────────────────
export function init(container) {
  const startBtn  = container.querySelector('#st-start')
  const sizeEl    = container.querySelector('#st-size')
  const resultsEl = container.querySelector('#st-results')
  const errEl     = container.querySelector('#st-err')

  let running  = false
  let dlSeries = []
  let ulSeries = []

  startBtn.addEventListener('click', () => {
    if (!running) runTest()
  })

  async function runTest() {
    running = true
    errEl.textContent      = ''
    startBtn.disabled      = true
    startBtn.textContent   = 'Test läuft…'
    resultsEl.hidden       = false
    dlSeries               = []
    ulSeries               = []

    resetDisplay(container)

    const totalMB = parseInt(sizeEl.value)
    const chunkMB = totalMB / CHUNKS

    try {
      // ── Phase 1: Ping ───────────────────────────────────────────────────
      setPhaseState(container, 'ping', 'active')
      const pingRtts = []
      for (let i = 0; i < 10; i++) {
        const ms = await measurePing()
        pingRtts.push(ms)
        setPhaseProgress(container, 'ping', (i + 1) / 10)
        if (i < 9) await sleep(100)
      }

      const sorted    = [...pingRtts].sort((a, b) => a - b)
      const pingMin   = sorted[0]
      const pingMax   = sorted[sorted.length - 1]
      const pingAvg   = Math.round(arrAvg(pingRtts))
      const pingMed   = sorted[Math.floor(sorted.length / 2)]
      const jitter    = Math.round(stdDev(pingRtts) * 10) / 10

      container.querySelector('#st-ping-val').textContent   = pingMed
      container.querySelector('#st-jitter-val').textContent = jitter.toFixed(1)
      setPhaseState(container, 'ping', 'done')

      // ── Phase 2: Download ───────────────────────────────────────────────
      setPhaseState(container, 'dl', 'active')
      let ttfb = null
      for (let i = 0; i < CHUNKS; i++) {
        const { mbps, ttfb: t } = await measureDownload(chunkMB, i === 0)
        if (i === 0) ttfb = t
        dlSeries.push(mbps)
        container.querySelector('#st-dl-val').textContent = mbps.toFixed(1)
        setPhaseProgress(container, 'dl', (i + 1) / CHUNKS)
        renderChart(container, dlSeries, ulSeries)
      }
      const dlAvg = round1(arrAvg(dlSeries))
      container.querySelector('#st-dl-val').textContent = dlAvg.toFixed(1)
      setPhaseState(container, 'dl', 'done')

      // ── Phase 3: Upload ─────────────────────────────────────────────────
      setPhaseState(container, 'ul', 'active')
      const ulBuf = genRandomBuffer(chunkMB * 1024 * 1024)
      for (let i = 0; i < CHUNKS; i++) {
        const mbps = await measureUpload(ulBuf)
        ulSeries.push(mbps)
        container.querySelector('#st-ul-val').textContent = mbps.toFixed(1)
        setPhaseProgress(container, 'ul', (i + 1) / CHUNKS)
        renderChart(container, dlSeries, ulSeries)
      }
      const ulAvg = round1(arrAvg(ulSeries))
      container.querySelector('#st-ul-val').textContent = ulAvg.toFixed(1)
      setPhaseState(container, 'ul', 'done')

      // ── Detail grid ─────────────────────────────────────────────────────
      fillDetail(container, {
        pingMin, pingAvg, pingMax, jitter,
        dlMin: round1(Math.min(...dlSeries)),
        dlAvg,
        dlMax: round1(Math.max(...dlSeries)),
        ttfb,
        ulMin: round1(Math.min(...ulSeries)),
        ulAvg,
        ulMax: round1(Math.max(...ulSeries)),
        proto: location.protocol.replace(':', '')
      })

    } catch (err) {
      errEl.textContent = err.message || 'Test fehlgeschlagen.'
    } finally {
      running               = false
      startBtn.disabled     = false
      startBtn.textContent  = 'Erneut testen'
    }
  }

  async function measurePing() {
    const t0  = performance.now()
    const res = await fetch('/api/speedtest/ping', { cache: 'no-store' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || `HTTP ${res.status}`)
    }
    await res.json()
    return Math.round(performance.now() - t0)
  }

  async function measureDownload(sizeMB, doTtfb = false) {
    const t0  = performance.now()
    const res = await fetch(`/api/speedtest/download?size=${sizeMB}`, { cache: 'no-store' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || `HTTP ${res.status}`)
    }
    const ttfb = doTtfb ? Math.round(performance.now() - t0) : null
    await res.arrayBuffer()
    const elapsed = (performance.now() - t0) / 1000
    const mbps    = round1((sizeMB * 1024 * 1024 * 8) / elapsed / 1_000_000)
    return { mbps, ttfb }
  }

  async function measureUpload(buf) {
    const t0  = performance.now()
    const res = await fetch('/api/speedtest/upload', {
      method:  'POST',
      body:    buf,
      headers: { 'Content-Type': 'application/octet-stream' }
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || `HTTP ${res.status}`)
    }
    await res.json()
    const elapsed = (performance.now() - t0) / 1000
    return round1((buf.byteLength * 8) / elapsed / 1_000_000)
  }
}
