const pad = n => String(n).padStart(2, '0')

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDateUTC(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
}

export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">Timestamp Converter</h1>
        <p class="tool-subtitle">Unix-Timestamps in lesbare Datumswerte umrechnen und umgekehrt</p>
      </div>
      <div class="tool-body">

        <!-- Unix → Datum -->
        <div class="ts-section">
          <h3 class="ts-section-title">Unix-Timestamp → Datum</h3>
          <div class="ts-row">
            <input id="ts-unix" class="input ts-input" type="text" placeholder="z.B. 1700000000" inputmode="numeric">
            <button class="btn btn-primary" id="ts-now-btn">Jetzt</button>
            <button class="btn btn-secondary" id="ts-convert-btn">Umrechnen</button>
          </div>
          <div class="input-error-msg" id="ts-err"></div>
          <div id="ts-result" class="ts-result" hidden>
            <div class="result-row">
              <span class="result-label">Lokal</span>
              <span class="result-value ts-mono" id="ts-local"></span>
            </div>
            <div class="result-row">
              <span class="result-label">UTC</span>
              <span class="result-value ts-mono" id="ts-utc"></span>
            </div>
            <div class="result-row">
              <span class="result-label">ISO 8601</span>
              <span class="result-value ts-mono" id="ts-iso"></span>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Datum → Unix -->
        <div class="ts-section">
          <h3 class="ts-section-title">Datum → Unix-Timestamp</h3>
          <div class="ts-row">
            <input id="ts-date" class="input" type="datetime-local">
            <button class="btn btn-primary" id="ts-tounix-btn">Umrechnen</button>
          </div>
          <div id="ts-unix-result" class="ts-result" hidden>
            <div class="result-row">
              <span class="result-label">Sekunden</span>
              <span class="result-value ts-mono" id="ts-unix-sec"></span>
            </div>
            <div class="result-row">
              <span class="result-label">Millisekunden</span>
              <span class="result-value ts-mono" id="ts-unix-ms"></span>
            </div>
          </div>
        </div>

      </div>
    </div>`
}

export function init(container) {
  const unixEl   = container.querySelector('#ts-unix')
  const errEl    = container.querySelector('#ts-err')
  const resultEl = container.querySelector('#ts-result')

  function convert(rawVal) {
    errEl.textContent = ''
    const raw = rawVal.trim()
    if (!raw) { errEl.textContent = 'Bitte Timestamp eingeben.'; resultEl.hidden = true; return }

    let num = Number(raw)
    if (isNaN(num)) { errEl.textContent = 'Ungültiger Timestamp.'; resultEl.hidden = true; return }

    // Auto-detect seconds vs milliseconds
    if (num < 1e10) num = num * 1000

    const d = new Date(num)
    if (isNaN(d.getTime())) { errEl.textContent = 'Ungültiger Timestamp.'; resultEl.hidden = true; return }

    container.querySelector('#ts-local').textContent = formatDate(d)
    container.querySelector('#ts-utc').textContent   = formatDateUTC(d)
    container.querySelector('#ts-iso').textContent   = d.toISOString()
    resultEl.hidden = false
  }

  container.querySelector('#ts-now-btn').addEventListener('click', () => {
    unixEl.value = Math.floor(Date.now() / 1000)
    convert(unixEl.value)
  })

  container.querySelector('#ts-convert-btn').addEventListener('click', () => convert(unixEl.value))
  unixEl.addEventListener('input', () => convert(unixEl.value))

  container.querySelector('#ts-tounix-btn').addEventListener('click', () => {
    const dateEl    = container.querySelector('#ts-date')
    const unixResEl = container.querySelector('#ts-unix-result')
    if (!dateEl.value) { unixResEl.hidden = true; return }
    const ms = new Date(dateEl.value).getTime()
    container.querySelector('#ts-unix-sec').textContent = Math.floor(ms / 1000)
    container.querySelector('#ts-unix-ms').textContent  = ms
    unixResEl.hidden = false
  })
}
