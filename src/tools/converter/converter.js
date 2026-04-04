// ============================================================
// Datei-Konverter — Bilder (client-side Canvas) + Audio (server-side ffmpeg)
// ============================================================

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Datei-Konverter</h1>
        <p class="tool-subtitle">Bilder konvertieren &amp; skalieren — Audio-Formate umwandeln</p>
      </div>

      <div class="conv-tabs">
        <button class="conv-tab active" data-tab="image">Bilder</button>
        <button class="conv-tab"        data-tab="audio">Audio</button>
      </div>

      <!-- ── IMAGE TAB ───────────────────────────────────────────── -->
      <div id="conv-tab-image" class="conv-tab-panel">

        <label class="conv-drop" id="img-drop">
          <input type="file" id="img-file-input" accept="image/*" class="conv-file-hidden">
          <div class="conv-drop-inner" id="img-drop-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span class="conv-drop-text">Bild hier ablegen oder klicken</span>
            <span class="conv-drop-hint">JPEG · PNG · WebP · BMP · GIF · SVG · max. 50 MB</span>
          </div>
        </label>

        <div id="img-options" class="conv-options" hidden>
          <div class="conv-preview-wrap">
            <img id="img-preview" class="conv-preview" alt="Vorschau">
            <div class="conv-file-info" id="img-info"></div>
          </div>

          <div class="conv-form">

            <div class="conv-field-row">
              <label class="conv-label">Ausgabeformat</label>
              <select id="img-format" class="conv-select">
                <option value="png">PNG</option>
                <option value="jpg" selected>JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div class="conv-field-row" id="img-quality-row">
              <label class="conv-label">Qualität</label>
              <div class="conv-slider-wrap">
                <input type="range" id="img-quality" class="conv-slider" min="1" max="100" value="85">
                <span class="conv-slider-val" id="img-quality-val">85%</span>
              </div>
            </div>

            <div class="conv-field-row">
              <label class="conv-label">Einheit</label>
              <div class="conv-unit-row">
                <label class="conv-radio"><input type="radio" name="img-unit" value="px" checked> px</label>
                <label class="conv-radio"><input type="radio" name="img-unit" value="mm"> mm</label>
                <select id="img-dpi" class="conv-select conv-dpi-sel" hidden>
                  <option value="72">72 dpi</option>
                  <option value="96" selected>96 dpi</option>
                  <option value="150">150 dpi</option>
                  <option value="300">300 dpi</option>
                  <option value="custom">Eigener…</option>
                </select>
                <input type="number" id="img-dpi-custom" class="conv-select conv-dpi-custom" min="1" max="2400" value="96" hidden placeholder="dpi">
              </div>
            </div>

            <div class="conv-size-row">
              <div class="conv-size-field">
                <label class="conv-label" id="img-w-label">Breite (px)</label>
                <input type="number" id="img-w" class="input conv-size-input" min="1" max="32000">
              </div>
              <button id="img-lock" class="conv-lock-btn" title="Seitenverhältnis sperren">
                <svg id="img-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <rect x="5" y="11" width="14" height="10" rx="2"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                </svg>
              </button>
              <div class="conv-size-field">
                <label class="conv-label" id="img-h-label">Höhe (px)</label>
                <input type="number" id="img-h" class="input conv-size-input" min="1" max="32000">
              </div>
            </div>

            <div id="img-error" class="conv-error" hidden></div>

            <button id="img-convert-btn" class="btn btn-primary conv-submit-btn">
              Konvertieren &amp; Herunterladen
            </button>
            <button id="img-reset-btn" class="btn btn-secondary">Neues Bild</button>
          </div>
        </div>
      </div>

      <!-- ── AUDIO TAB ───────────────────────────────────────────── -->
      <div id="conv-tab-audio" class="conv-tab-panel" hidden>

        <label class="conv-drop" id="aud-drop">
          <input type="file" id="aud-file-input" accept=".mp3,.wav,.ogg,.flac,.m4a,.aac,audio/*" class="conv-file-hidden">
          <div class="conv-drop-inner" id="aud-drop-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <span class="conv-drop-text">Audio-Datei hier ablegen oder klicken</span>
            <span class="conv-drop-hint">MP3 · WAV · OGG · FLAC · M4A · AAC · max. 50 MB</span>
          </div>
        </label>

        <div id="aud-options" class="conv-options" hidden>
          <div class="conv-file-info" id="aud-info"></div>

          <div class="conv-form">

            <div class="conv-field-row">
              <label class="conv-label">Ausgabeformat</label>
              <select id="aud-format" class="conv-select">
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="ogg">OGG Vorbis</option>
                <option value="flac">FLAC</option>
              </select>
            </div>

            <div class="conv-field-row" id="aud-bitrate-row">
              <label class="conv-label">Bitrate</label>
              <select id="aud-bitrate" class="conv-select">
                <option value="64">64 kbps</option>
                <option value="128" selected>128 kbps</option>
                <option value="192">192 kbps</option>
                <option value="256">256 kbps</option>
                <option value="320">320 kbps</option>
              </select>
            </div>

            <div class="conv-field-row">
              <label class="conv-label">Sample Rate</label>
              <select id="aud-samplerate" class="conv-select">
                <option value="22050">22.050 Hz</option>
                <option value="44100" selected>44.100 Hz (CD)</option>
                <option value="48000">48.000 Hz (Pro)</option>
              </select>
            </div>

            <div id="aud-error" class="conv-error" hidden></div>
            <div id="aud-progress" class="conv-progress-wrap" hidden>
              <div class="spinner"></div>
              <span id="aud-progress-label">Wird konvertiert…</span>
            </div>

            <button id="aud-convert-btn" class="btn btn-primary conv-submit-btn">
              Konvertieren &amp; Herunterladen
            </button>
            <button id="aud-reset-btn" class="btn btn-secondary">Neue Datei</button>
          </div>
        </div>
      </div>

    </div>
  `
}

export function init(container) {
  // ── Tab switching ───────────────────────────────────────────────
  container.querySelectorAll('.conv-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.conv-tab').forEach(b => b.classList.remove('active'))
      container.querySelectorAll('.conv-tab-panel').forEach(p => { p.hidden = true })
      btn.classList.add('active')
      container.querySelector(`#conv-tab-${btn.dataset.tab}`).hidden = false
    })
  })

  initImageTab(container)
  initAudioTab(container)
}

// ══════════════════════════════════════════════════════════════════
// IMAGE TAB
// ══════════════════════════════════════════════════════════════════
function initImageTab(container) {
  const dropEl    = container.querySelector('#img-drop')
  const fileInput = container.querySelector('#img-file-input')
  const dropInner = container.querySelector('#img-drop-inner')
  const options   = container.querySelector('#img-options')
  const preview   = container.querySelector('#img-preview')
  const infoEl    = container.querySelector('#img-info')
  const formatSel = container.querySelector('#img-format')
  const qualityRow= container.querySelector('#img-quality-row')
  const qualityIn = container.querySelector('#img-quality')
  const qualityVal= container.querySelector('#img-quality-val')
  const unitPx    = container.querySelector('input[name="img-unit"][value="px"]')
  const unitMm    = container.querySelector('input[name="img-unit"][value="mm"]')
  const dpiSel    = container.querySelector('#img-dpi')
  const dpiCustom = container.querySelector('#img-dpi-custom')
  const wInput    = container.querySelector('#img-w')
  const hInput    = container.querySelector('#img-h')
  const wLabel    = container.querySelector('#img-w-label')
  const hLabel    = container.querySelector('#img-h-label')
  const lockBtn   = container.querySelector('#img-lock')
  const convertBtn= container.querySelector('#img-convert-btn')
  const resetBtn  = container.querySelector('#img-reset-btn')
  const errorEl   = container.querySelector('#img-error')

  let imgNatW = 0, imgNatH = 0, aspectRatio = 1
  let locked = true
  let currentFile = null
  let editingW = false  // prevent feedback loops

  function getDpi() {
    if (!unitMm.checked) return 96
    const v = dpiSel.value
    if (v === 'custom') return Math.max(1, parseInt(dpiCustom.value) || 96)
    return parseInt(v)
  }

  function pxToMm(px) { return +(px * 25.4 / getDpi()).toFixed(2) }
  function mmToPx(mm) { return Math.round(mm * getDpi() / 25.4) }

  function getW() { return unitMm.checked ? mmToPx(parseFloat(wInput.value) || 0) : (parseInt(wInput.value) || 0) }
  function getH() { return unitMm.checked ? mmToPx(parseFloat(hInput.value) || 0) : (parseInt(hInput.value) || 0) }

  function setW(px) { wInput.value = unitMm.checked ? pxToMm(px) : px }
  function setH(px) { hInput.value = unitMm.checked ? pxToMm(px) : px }

  function updateLabels() {
    const u = unitMm.checked ? 'mm' : 'px'
    wLabel.textContent = `Breite (${u})`
    hLabel.textContent = `Höhe (${u})`
  }

  function syncFromW() {
    if (!locked || !imgNatW) return
    const wpx = getW()
    if (wpx > 0) setH(Math.round(wpx / aspectRatio))
  }

  function syncFromH() {
    if (!locked || !imgNatH) return
    const hpx = getH()
    if (hpx > 0) setW(Math.round(hpx * aspectRatio))
  }

  // Lock button
  lockBtn.classList.toggle('conv-lock-active', locked)
  lockBtn.addEventListener('click', () => {
    locked = !locked
    lockBtn.classList.toggle('conv-lock-active', locked)
  })

  // Quality slider
  qualityIn.addEventListener('input', () => { qualityVal.textContent = qualityIn.value + '%' })

  // Format → show/hide quality
  function updateQualityVisibility() {
    qualityRow.hidden = formatSel.value === 'png'
  }
  formatSel.addEventListener('change', updateQualityVisibility)
  updateQualityVisibility()

  // Unit toggle
  function onUnitChange() {
    const wasPx = !unitMm.checked
    // Convert current px values to new unit display
    const curWpx = wasPx ? (parseInt(wInput.value) || 0) : mmToPx(parseFloat(wInput.value) || 0)
    const curHpx = wasPx ? (parseInt(hInput.value) || 0) : mmToPx(parseFloat(hInput.value) || 0)
    dpiSel.hidden = !unitMm.checked
    if (dpiSel.value === 'custom') dpiCustom.hidden = !unitMm.checked
    updateLabels()
    // Re-display with new unit
    if (curWpx) setW(curWpx)
    if (curHpx) setH(curHpx)
  }

  unitPx.addEventListener('change', onUnitChange)
  unitMm.addEventListener('change', onUnitChange)

  dpiSel.addEventListener('change', () => {
    dpiCustom.hidden = dpiSel.value !== 'custom'
    // re-convert current values
    onUnitChange()
  })

  dpiCustom.addEventListener('input', onUnitChange)

  wInput.addEventListener('input', syncFromW)
  hInput.addEventListener('input', syncFromH)

  // Drag & Drop
  dropEl.addEventListener('dragover', e => { e.preventDefault(); dropEl.classList.add('conv-drop-hover') })
  dropEl.addEventListener('dragleave', () => dropEl.classList.remove('conv-drop-hover'))
  dropEl.addEventListener('drop', e => {
    e.preventDefault()
    dropEl.classList.remove('conv-drop-hover')
    const f = e.dataTransfer.files[0]
    if (f) loadImageFile(f)
  })

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadImageFile(fileInput.files[0])
  })

  function loadImageFile(file) {
    if (file.size > 50 * 1024 * 1024) { showImgError('Datei zu groß (max. 50 MB).'); return }
    currentFile = file

    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        imgNatW = img.naturalWidth
        imgNatH = img.naturalHeight
        aspectRatio = imgNatW / imgNatH

        preview.src = e.target.result
        infoEl.textContent = `${file.name}  ·  ${imgNatW} × ${imgNatH} px  ·  ${formatBytes(file.size)}`

        setW(imgNatW)
        setH(imgNatH)
        updateLabels()

        dropEl.hidden = true
        options.hidden = false
        clearImgError()
      }
      img.onerror = () => showImgError('Bild konnte nicht geladen werden.')
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  // Convert
  convertBtn.addEventListener('click', async () => {
    if (!currentFile) return
    clearImgError()

    const wpx = getW()
    const hpx = getH()
    if (!wpx || !hpx) { showImgError('Breite und Höhe müssen größer als 0 sein.'); return }
    if (wpx > 32000 || hpx > 32000) { showImgError('Maximale Auflösung: 32.000 px.'); return }

    const format  = formatSel.value
    const quality = parseInt(qualityIn.value) / 100

    convertBtn.disabled = true
    convertBtn.textContent = 'Konvertiert…'

    try {
      const blob = await convertImageCanvas(currentFile, format, wpx, hpx, quality)
      const extMap = { jpg: 'jpg', png: 'png', webp: 'webp' }
      const outName = currentFile.name.replace(/\.[^.]+$/, '') + '.' + extMap[format]
      triggerDownload(blob, outName)
    } catch (e) {
      showImgError('Konvertierung fehlgeschlagen: ' + e.message)
    } finally {
      convertBtn.disabled = false
      convertBtn.textContent = 'Konvertieren & Herunterladen'
    }
  })

  resetBtn.addEventListener('click', () => {
    currentFile = null
    fileInput.value = ''
    preview.src = ''
    options.hidden = true
    dropEl.hidden = false
    clearImgError()
  })

  function showImgError(msg) { errorEl.textContent = msg; errorEl.hidden = false }
  function clearImgError()   { errorEl.hidden = true; errorEl.textContent = '' }
}

function convertImageCanvas(file, format, width, height, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        // White background for JPEG (canvas default is transparent)
        if (format === 'jpg') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
        }
        ctx.drawImage(img, 0, 0, width, height)
        const mime = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[format]
        const q    = format === 'png' ? undefined : quality
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Canvas toBlob fehlgeschlagen'))
          resolve(blob)
        }, mime, q)
      }
      img.onerror = () => reject(new Error('Bild konnte nicht dekodiert werden'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}

// ══════════════════════════════════════════════════════════════════
// AUDIO TAB
// ══════════════════════════════════════════════════════════════════
function initAudioTab(container) {
  const dropEl     = container.querySelector('#aud-drop')
  const fileInput  = container.querySelector('#aud-file-input')
  const options    = container.querySelector('#aud-options')
  const infoEl     = container.querySelector('#aud-info')
  const formatSel  = container.querySelector('#aud-format')
  const bitrateRow = container.querySelector('#aud-bitrate-row')
  const bitrateSel = container.querySelector('#aud-bitrate')
  const sampleSel  = container.querySelector('#aud-samplerate')
  const convertBtn = container.querySelector('#aud-convert-btn')
  const resetBtn   = container.querySelector('#aud-reset-btn')
  const errorEl    = container.querySelector('#aud-error')
  const progressEl = container.querySelector('#aud-progress')
  const progressLbl= container.querySelector('#aud-progress-label')

  let currentFile = null

  function updateBitrateVisibility() {
    bitrateRow.hidden = !['mp3', 'ogg'].includes(formatSel.value)
  }
  formatSel.addEventListener('change', updateBitrateVisibility)
  updateBitrateVisibility()

  // Drag & Drop
  dropEl.addEventListener('dragover', e => { e.preventDefault(); dropEl.classList.add('conv-drop-hover') })
  dropEl.addEventListener('dragleave', () => dropEl.classList.remove('conv-drop-hover'))
  dropEl.addEventListener('drop', e => {
    e.preventDefault()
    dropEl.classList.remove('conv-drop-hover')
    const f = e.dataTransfer.files[0]
    if (f) loadAudioFile(f)
  })

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadAudioFile(fileInput.files[0])
  })

  function loadAudioFile(file) {
    if (file.size > 50 * 1024 * 1024) { showAudError('Datei zu groß (max. 50 MB).'); return }
    currentFile = file
    infoEl.textContent = `${file.name}  ·  ${formatBytes(file.size)}`
    dropEl.hidden = true
    options.hidden = false
    clearAudError()
  }

  convertBtn.addEventListener('click', async () => {
    if (!currentFile) return
    clearAudError()

    const formData = new FormData()
    formData.append('file',       currentFile)
    formData.append('format',     formatSel.value)
    formData.append('bitrate',    bitrateSel.value)
    formData.append('samplerate', sampleSel.value)

    convertBtn.disabled = true
    progressEl.hidden = false
    progressLbl.textContent = 'Wird hochgeladen und konvertiert…'

    try {
      const res = await fetch('/api/converter/audio', { method: 'POST', body: formData })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Serverfehler ${res.status}`)
      }

      const blob = await res.blob()
      const ext  = formatSel.value
      const outName = currentFile.name.replace(/\.[^.]+$/, '') + '.' + ext
      triggerDownload(blob, outName)
    } catch (e) {
      showAudError('Konvertierung fehlgeschlagen: ' + e.message)
    } finally {
      convertBtn.disabled = false
      progressEl.hidden = true
    }
  })

  resetBtn.addEventListener('click', () => {
    currentFile = null
    fileInput.value = ''
    options.hidden = true
    dropEl.hidden = false
    clearAudError()
  })

  function showAudError(msg) { errorEl.textContent = msg; errorEl.hidden = false }
  function clearAudError()   { errorEl.hidden = true; errorEl.textContent = '' }
}

// ── Helpers ────────────────────────────────────────────────────────
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

function formatBytes(b) {
  if (b < 1024)          return b + ' B'
  if (b < 1024 * 1024)   return (b / 1024).toFixed(1) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}
