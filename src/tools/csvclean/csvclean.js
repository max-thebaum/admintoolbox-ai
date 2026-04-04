// Auto-detect delimiter
function detectDelimiter(text) {
  const sample = text.slice(0, 2000)
  const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 }
  for (const c of sample) if (c in counts) counts[c]++
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

// Simple CSV parser (handles quoted fields)
function parseCSV(text, delim) {
  const rows = []
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    if (!line.trim()) { rows.push([]); continue }
    const fields = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (c === delim && !inQ) {
        fields.push(cur); cur = ''
      } else {
        cur += c
      }
    }
    fields.push(cur)
    rows.push(fields)
  }
  return rows
}

function serializeCSV(rows, delim) {
  return rows.map(row =>
    row.map(f => {
      const s = String(f ?? '')
      if (s.includes(delim) || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }).join(delim)
  ).join('\n')
}

export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">CSV Cleaner</h1>
        <p class="tool-subtitle">CSV bereinigen, transformieren, validieren und herunterladen</p>
      </div>
      <div class="tool-body">

        <!-- Input -->
        <div class="csv-input-section">
          <div class="segmented" role="group" aria-label="Eingabemodus">
            <button class="segmented-btn active" data-mode="text">Text einfügen</button>
            <button class="segmented-btn" data-mode="file">Datei hochladen</button>
          </div>
          <div id="csv-text-mode" style="margin-top:10px">
            <textarea id="csv-input" class="input csv-area" spellcheck="false" placeholder="CSV-Inhalt hier einfügen…"></textarea>
          </div>
          <div id="csv-file-mode" hidden style="margin-top:10px">
            <label class="csv-file-label">
              <input type="file" id="csv-file" accept=".csv,.txt" class="csv-file-input">
              <span id="csv-file-name">Datei auswählen (.csv, .txt)</span>
            </label>
          </div>
        </div>

        <!-- Options -->
        <div class="csv-options">
          <div class="csv-options-col">
            <div class="csv-options-title">Bereinigung</div>
            <label class="csv-opt-label"><input type="checkbox" id="csv-trim" checked> Whitespace trimmen</label>
            <label class="csv-opt-label"><input type="checkbox" id="csv-empty"> Leere Zeilen entfernen</label>
            <label class="csv-opt-label"><input type="checkbox" id="csv-quotes"> Anführungszeichen entfernen</label>
            <label class="csv-opt-label"><input type="checkbox" id="csv-newlines"> Zeilenenden normalisieren (LF)</label>
          </div>
          <div class="csv-options-col">
            <div class="csv-options-title">Transformation</div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
              <label style="font-size:13px;white-space:nowrap">Ausgabe-Trennzeichen</label>
              <select id="csv-delim-out" class="select" style="width:130px">
                <option value="auto">Auto-detect</option>
                <option value=",">Komma (,)</option>
                <option value=";">Semikolon (;)</option>
                <option value="&#9;">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
              <input id="csv-find" class="input" type="text" placeholder="Suchen" style="width:120px">
              <span style="color:var(--text-muted)">→</span>
              <input id="csv-replace" class="input" type="text" placeholder="Ersetzen" style="width:120px">
            </div>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="csv-clean-btn">CSV bereinigen</button>
          <button class="btn btn-ghost" id="csv-reset-btn">Zurücksetzen</button>
        </div>

        <div class="input-error-msg" id="csv-err" role="alert"></div>

        <!-- Preview -->
        <div id="csv-preview-wrap" hidden>
          <div class="csv-section-head">
            Vorschau (erste 20 Zeilen)
            <span id="csv-col-info" class="csv-col-info"></span>
            <span id="csv-warn" class="csv-warn"></span>
          </div>
          <div class="csv-table-wrap">
            <table class="csv-preview-table" id="csv-preview-table"></table>
          </div>
        </div>

        <!-- Output -->
        <div id="csv-output-wrap" hidden>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;margin-top:16px">
            <label>Bereinigtes CSV</label>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost btn-sm" id="csv-copy-btn">Kopieren</button>
              <button class="btn btn-secondary btn-sm" id="csv-dl-btn">Download .csv</button>
            </div>
          </div>
          <textarea id="csv-output" class="input csv-area" readonly spellcheck="false"></textarea>
        </div>

      </div>
    </div>`
}

export function init(container) {
  const inputEl   = container.querySelector('#csv-input')
  const outputEl  = container.querySelector('#csv-output')
  const errEl     = container.querySelector('#csv-err')
  const fileInput = container.querySelector('#csv-file')
  let rawText = ''

  // Mode toggle
  container.querySelectorAll('.segmented-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const isFile = btn.dataset.mode === 'file'
      container.querySelector('#csv-text-mode').hidden = isFile
      container.querySelector('#csv-file-mode').hidden = !isFile
    })
  })

  // File upload
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0]
    if (!file) return
    container.querySelector('#csv-file-name').textContent = file.name
    const reader = new FileReader()
    reader.onload = e => { rawText = e.target.result }
    reader.readAsText(file, 'UTF-8')
  })

  container.querySelector('#csv-clean-btn').addEventListener('click', () => {
    errEl.textContent = ''
    container.querySelector('#csv-preview-wrap').hidden = true
    container.querySelector('#csv-output-wrap').hidden  = true

    const source = container.querySelector('#csv-text-mode').hidden ? rawText : inputEl.value
    if (!source.trim()) { errEl.textContent = 'Bitte CSV eingeben oder Datei hochladen.'; return }

    const trim     = container.querySelector('#csv-trim').checked
    const rmEmpty  = container.querySelector('#csv-empty').checked
    const rmQuotes = container.querySelector('#csv-quotes').checked
    const normNL   = container.querySelector('#csv-newlines').checked
    const delimOut = container.querySelector('#csv-delim-out').value
    const find     = container.querySelector('#csv-find').value
    const replace  = container.querySelector('#csv-replace').value

    let text = source
    if (normNL) text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    const inDelim = detectDelimiter(text)
    const outDelim = delimOut === 'auto' ? inDelim : (delimOut === '\t' ? '\t' : delimOut)

    let rows
    try {
      rows = parseCSV(text, inDelim)
    } catch (e) {
      errEl.textContent = 'CSV-Parse-Fehler: ' + e.message
      return
    }

    // Apply cleaning
    rows = rows.map(row => row.map(f => {
      let v = f
      if (trim)     v = v.trim()
      if (rmQuotes) v = v.replace(/"/g, '')
      if (find)     v = v.split(find).join(replace)
      return v
    }))

    if (rmEmpty) rows = rows.filter(r => r.some(f => f.trim()))

    // Validation: column count consistency
    const colCounts = rows.map(r => r.length).filter(n => n > 0)
    const maxCols = Math.max(...colCounts)
    const inconsistent = rows.filter((r, i) => r.length > 0 && r.length !== maxCols)
    const warnEl = container.querySelector('#csv-warn')
    if (inconsistent.length) {
      warnEl.textContent = `⚠ ${inconsistent.length} Zeile(n) mit abweichender Spaltenanzahl`
    } else {
      warnEl.textContent = ''
    }

    // Preview
    container.querySelector('#csv-col-info').textContent =
      `${rows.length} Zeilen · ${maxCols} Spalten · Trennzeichen: "${inDelim === '\t' ? 'Tab' : inDelim}"`

    const previewRows = rows.slice(0, 20)
    const table = container.querySelector('#csv-preview-table')
    table.innerHTML = previewRows.map((r, ri) => {
      const isOdd = inconsistent.includes(r)
      return `<tr class="${isOdd ? 'csv-row-warn' : ''}">
        ${r.map(f => `<td>${esc(f)}</td>`).join('')}
      </tr>`
    }).join('')
    container.querySelector('#csv-preview-wrap').hidden = false

    // Output
    const out = serializeCSV(rows, outDelim)
    outputEl.value = out
    container.querySelector('#csv-output-wrap').hidden = false
  })

  container.querySelector('#csv-copy-btn').addEventListener('click', function() {
    navigator.clipboard.writeText(outputEl.value).then(() => {
      const orig = this.textContent
      this.textContent = 'Kopiert!'
      this.disabled = true
      setTimeout(() => { this.textContent = orig; this.disabled = false }, 1500)
    })
  })

  container.querySelector('#csv-dl-btn').addEventListener('click', () => {
    const blob = new Blob([outputEl.value], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'cleaned.csv'
    a.click()
    URL.revokeObjectURL(url)
  })

  container.querySelector('#csv-reset-btn').addEventListener('click', () => {
    inputEl.value = ''
    outputEl.value = ''
    rawText = ''
    errEl.textContent = ''
    container.querySelector('#csv-preview-wrap').hidden = true
    container.querySelector('#csv-output-wrap').hidden  = true
    fileInput.value = ''
    container.querySelector('#csv-file-name').textContent = 'Datei auswählen (.csv, .txt)'
  })

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }
}
