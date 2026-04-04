export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">Regex Tester</h1>
        <p class="tool-subtitle">Reguläre Ausdrücke testen und Treffer in Echtzeit anzeigen</p>
      </div>
      <div class="tool-body">

        <div class="form-grid">
          <div class="form-row full">
            <label for="rx-pattern">Regulärer Ausdruck</label>
            <div class="rx-pattern-wrap">
              <span class="rx-delimiter">/</span>
              <input id="rx-pattern" class="input rx-pattern-input" type="text" placeholder="z.B. \\d{1,3}\\.\\d{1,3}" spellcheck="false">
              <span class="rx-delimiter">/</span>
              <div class="rx-flags">
                <label title="global"><input type="checkbox" id="rx-g" checked> g</label>
                <label title="case insensitive"><input type="checkbox" id="rx-i"> i</label>
                <label title="multiline"><input type="checkbox" id="rx-m"> m</label>
                <label title="dotAll"><input type="checkbox" id="rx-s"> s</label>
              </div>
            </div>
            <div class="input-error-msg" id="rx-pattern-err"></div>
          </div>
          <div class="form-row full">
            <label for="rx-test">Teststring</label>
            <textarea id="rx-test" class="input rx-test-area" spellcheck="false" placeholder="Text zum Testen…"></textarea>
          </div>
        </div>

        <div id="rx-result" hidden>
          <div class="rx-stats" id="rx-stats"></div>
          <div class="form-row" style="margin-top:8px">
            <label>Treffer (hervorgehoben)</label>
            <div id="rx-highlight" class="rx-highlight-box"></div>
          </div>
          <div id="rx-groups-wrap" hidden>
            <div class="result-section-title" style="margin-top:16px">Gruppen</div>
            <div id="rx-groups" class="rx-groups"></div>
          </div>
        </div>

      </div>
    </div>`
}

export function init(container) {
  const patternEl   = container.querySelector('#rx-pattern')
  const testEl      = container.querySelector('#rx-test')
  const patErrEl    = container.querySelector('#rx-pattern-err')
  const resultEl    = container.querySelector('#rx-result')
  const statsEl     = container.querySelector('#rx-stats')
  const highlightEl = container.querySelector('#rx-highlight')
  const groupsWrap  = container.querySelector('#rx-groups-wrap')
  const groupsEl    = container.querySelector('#rx-groups')

  function getFlags() {
    let f = ''
    if (container.querySelector('#rx-g').checked) f += 'g'
    if (container.querySelector('#rx-i').checked) f += 'i'
    if (container.querySelector('#rx-m').checked) f += 'm'
    if (container.querySelector('#rx-s').checked) f += 's'
    return f
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }

  function update() {
    patErrEl.textContent = ''
    const pattern = patternEl.value
    const text    = testEl.value

    if (!pattern) { resultEl.hidden = true; return }

    let regex
    try {
      regex = new RegExp(pattern, getFlags())
    } catch (e) {
      patErrEl.textContent = 'Ungültiger Ausdruck: ' + e.message
      resultEl.hidden = true
      return
    }

    // Collect all matches
    const matches = []
    if (regex.global || regex.sticky) {
      let m
      regex.lastIndex = 0
      while ((m = regex.exec(text)) !== null) {
        matches.push(m)
        if (m[0].length === 0) regex.lastIndex++ // avoid infinite loop on zero-length match
      }
    } else {
      const m = regex.exec(text)
      if (m) matches.push(m)
    }

    statsEl.textContent = matches.length === 0
      ? 'Keine Treffer'
      : `${matches.length} Treffer`

    // Build highlighted HTML
    if (matches.length === 0) {
      highlightEl.textContent = text || ''
    } else {
      let html  = ''
      let last  = 0
      for (const m of matches) {
        html += esc(text.slice(last, m.index))
        html += `<mark class="rx-match">${esc(m[0] || '')}</mark>`
        last  = m.index + m[0].length
      }
      html += esc(text.slice(last))
      highlightEl.innerHTML = html
    }

    // Groups
    const allGroups = matches.flatMap(m => m.slice(1).map((g, gi) => ({ match: m[0], group: gi + 1, value: g })))
      .filter(g => g.value !== undefined)

    if (allGroups.length) {
      groupsEl.innerHTML = allGroups.map(g =>
        `<div class="rx-group-row">
          <span class="rx-group-label">Gruppe ${g.group}</span>
          <span class="rx-group-value">${esc(g.value)}</span>
        </div>`
      ).join('')
      groupsWrap.hidden = false
    } else {
      groupsWrap.hidden = true
    }

    resultEl.hidden = false
  }

  patternEl.addEventListener('input', update)
  testEl.addEventListener('input', update)
  container.querySelectorAll('.rx-flags input').forEach(cb => cb.addEventListener('change', update))
}
