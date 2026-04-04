// ============================================================
// Datei-Konverter — Bilder (client-side Canvas API)
// ============================================================

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Datei-Konverter</h1>
        <p class="tool-subtitle">Bilder konvertieren, skalieren und komprimieren — direkt im Browser</p>
      </div>

      <label class="conv-drop" id="img-drop">
        <input type="file" id="img-file-input" accept="image/*" class="conv-file-hidden">
        <div class="conv-drop-inner">
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
            <button id="img-lock" class="conv-lock-btn conv-lock-active" title="Seitenverhältnis sperren">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
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

          <div class="conv-actions">
            <button id="img-convert-btn" class="btn btn-primary">Konvertieren &amp; Herunterladen</button>
            <button id="img-reset-btn"   class="btn btn-secondary">Neues Bild</button>
          </div>
        </div>
      </div>
    </div>
  `
}

export function init(container) {
  const dropEl    = container.querySelector('#img-drop')
  const fileInput = container.querySelector('#img-file-input')
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

  // ── Helpers ──────────────────────────────────────────────────────
  function getDpi() {
    if (!unitMm.checked) return 96
    const v = dpiSel.value
    if (v === 'custom') return Math.max(1, parseInt(dpiCustom.value) || 96)
    return parseInt(v)
  }

  function pxToMm(px) { return +(px * 25.4 / getDpi()).toFixed(2) }
  function mmToPx(mm) { return Math.round(mm * getDpi() / 25.4) }

  function getWpx() { return unitMm.checked ? mmToPx(parseFloat(wInput.value) || 0) : (parseInt(wInput.value) || 0) }
  function getHpx() { return unitMm.checked ? mmToPx(parseFloat(hInput.value) || 0) : (parseInt(hInput.value) || 0) }
  function setW(px) { wInput.value = unitMm.checked ? pxToMm(px) : px }
  function setH(px) { hInput.value = unitMm.checked ? pxToMm(px) : px }

  function updateLabels() {
    const u = unitMm.checked ? 'mm' : 'px'
    wLabel.textContent = `Breite (${u})`
    hLabel.textContent = `Höhe (${u})`
  }

  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false }
  function clearError()   { errorEl.hidden = true; errorEl.textContent = '' }

  // ── Lock button ──────────────────────────────────────────────────
  lockBtn.addEventListener('click', () => {
    locked = !locked
    lockBtn.classList.toggle('conv-lock-active', locked)
  })

  // ── Quality slider ───────────────────────────────────────────────
  qualityIn.addEventListener('input', () => { qualityVal.textContent = qualityIn.value + '%' })

  // ── Format → quality visibility ──────────────────────────────────
  function updateQualityVisibility() { qualityRow.hidden = formatSel.value === 'png' }
  formatSel.addEventListener('change', updateQualityVisibility)
  updateQualityVisibility()

  // ── Unit toggle ──────────────────────────────────────────────────
  function onUnitChange() {
    const curWpx = unitMm.checked ? mmToPx(parseFloat(wInput.value) || 0) : (parseInt(wInput.value) || 0)
    const curHpx = unitMm.checked ? mmToPx(parseFloat(hInput.value) || 0) : (parseInt(hInput.value) || 0)
    dpiSel.hidden = !unitMm.checked
    dpiCustom.hidden = !(unitMm.checked && dpiSel.value === 'custom')
    updateLabels()
    if (curWpx) setW(curWpx)
    if (curHpx) setH(curHpx)
  }

  unitPx.addEventListener('change', onUnitChange)
  unitMm.addEventListener('change', onUnitChange)
  dpiSel.addEventListener('change', () => { dpiCustom.hidden = dpiSel.value !== 'custom'; onUnitChange() })
  dpiCustom.addEventListener('input', onUnitChange)

  // ── Size sync with aspect ratio lock ─────────────────────────────
  wInput.addEventListener('input', () => {
    if (!locked || !imgNatW) return
    const wpx = getWpx()
    if (wpx > 0) setH(Math.round(wpx / aspectRatio))
  })
  hInput.addEventListener('input', () => {
    if (!locked || !imgNatH) return
    const hpx = getHpx()
    if (hpx > 0) setW(Math.round(hpx * aspectRatio))
  })

  // ── Drag & Drop ──────────────────────────────────────────────────
  dropEl.addEventListener('dragover', e => { e.preventDefault(); dropEl.classList.add('conv-drop-hover') })
  dropEl.addEventListener('dragleave', () => dropEl.classList.remove('conv-drop-hover'))
  dropEl.addEventListener('drop', e => {
    e.preventDefault(); dropEl.classList.remove('conv-drop-hover')
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]) })

  function loadFile(file) {
    if (file.size > 50 * 1024 * 1024) { showError('Datei zu groß (max. 50 MB).'); return }
    currentFile = file
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        imgNatW = img.naturalWidth
        imgNatH = img.naturalHeight
        aspectRatio = imgNatW / imgNatH
        preview.src = e.target.result
        infoEl.textContent = `${file.name}  ·  ${imgNatW} × ${imgNatH} px  ·  ${fmtBytes(file.size)}`
        setW(imgNatW); setH(imgNatH); updateLabels()
        dropEl.hidden = true; options.hidden = false; clearError()
      }
      img.onerror = () => showError('Bild konnte nicht geladen werden.')
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  // ── Convert ──────────────────────────────────────────────────────
  convertBtn.addEventListener('click', async () => {
    if (!currentFile) return
    clearError()
    const wpx = getWpx(), hpx = getHpx()
    if (!wpx || !hpx)              { showError('Breite und Höhe müssen größer als 0 sein.'); return }
    if (wpx > 32000 || hpx > 32000){ showError('Maximale Auflösung: 32.000 px.'); return }

    const format  = formatSel.value
    const quality = parseInt(qualityIn.value) / 100

    convertBtn.disabled = true
    convertBtn.textContent = 'Konvertiert…'
    try {
      const blob    = await convertCanvas(currentFile, format, wpx, hpx, quality)
      const outName = currentFile.name.replace(/\.[^.]+$/, '') + '.' + (format === 'jpg' ? 'jpg' : format)
      triggerDownload(blob, outName)
    } catch (e) {
      showError('Konvertierung fehlgeschlagen: ' + e.message)
    } finally {
      convertBtn.disabled = false
      convertBtn.textContent = 'Konvertieren & Herunterladen'
    }
  })

  resetBtn.addEventListener('click', () => {
    currentFile = null; fileInput.value = ''
    preview.src = ''; options.hidden = true; dropEl.hidden = false; clearError()
  })
}

// ── Canvas conversion ───────────────────────────────────────────────
function convertCanvas(file, format, width, height, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (format === 'jpg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height) }
        ctx.drawImage(img, 0, 0, width, height)
        const mime = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[format]
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob fehlgeschlagen')),
          mime,
          format === 'png' ? undefined : quality
        )
      }
      img.onerror = () => reject(new Error('Bild konnte nicht dekodiert werden'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

function fmtBytes(b) {
  if (b < 1024)        return b + ' B'
  if (b < 1048576)     return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}
