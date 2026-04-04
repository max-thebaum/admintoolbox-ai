// LCS-based line diff (no external library)
function diffLines(a, b) {
  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const m = linesA.length
  const n = linesB.length

  // Build LCS table
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = linesA[i-1] === linesB[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1])

  // Backtrack
  const result = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i-1] === linesB[j-1]) {
      result.push({ type: 'same', value: linesA[i-1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.push({ type: 'add', value: linesB[j-1] })
      j--
    } else {
      result.push({ type: 'remove', value: linesA[i-1] })
      i--
    }
  }
  return result.reverse()
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

export function html() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h1 class="tool-title">Text Diff</h1>
        <p class="tool-subtitle">Zwei Texte zeilenweise vergleichen und Unterschiede anzeigen</p>
      </div>
      <div class="tool-body">

        <div class="form-grid">
          <div class="form-row">
            <label for="td-left">Original</label>
            <textarea id="td-left" class="input td-area" spellcheck="false" placeholder="Originaltext…"></textarea>
          </div>
          <div class="form-row">
            <label for="td-right">Geändert</label>
            <textarea id="td-right" class="input td-area" spellcheck="false" placeholder="Geänderter Text…"></textarea>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="td-compare-btn">Vergleichen</button>
          <button class="btn btn-ghost" id="td-clear-btn">Leeren</button>
        </div>

        <div id="td-result" hidden>
          <div class="td-summary" id="td-summary"></div>
          <div class="td-diff" id="td-diff"></div>
        </div>

      </div>
    </div>`
}

export function init(container) {
  const leftEl   = container.querySelector('#td-left')
  const rightEl  = container.querySelector('#td-right')
  const resultEl = container.querySelector('#td-result')
  const summaryEl = container.querySelector('#td-summary')
  const diffEl   = container.querySelector('#td-diff')

  container.querySelector('#td-compare-btn').addEventListener('click', () => {
    const a = leftEl.value
    const b = rightEl.value

    const diff   = diffLines(a, b)
    const added  = diff.filter(d => d.type === 'add').length
    const removed = diff.filter(d => d.type === 'remove').length

    summaryEl.innerHTML =
      `<span class="td-stat td-add">+${added} hinzugefügt</span>` +
      `<span class="td-stat td-remove">−${removed} entfernt</span>` +
      `<span class="td-stat td-same">${diff.filter(d => d.type === 'same').length} unverändert</span>`

    diffEl.innerHTML = diff.map((line, i) => {
      const cls = line.type === 'add' ? 'td-line-add' : line.type === 'remove' ? 'td-line-remove' : 'td-line-same'
      const sym = line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '
      return `<div class="td-line ${cls}"><span class="td-sym">${sym}</span><span class="td-text">${esc(line.value)}</span></div>`
    }).join('')

    resultEl.hidden = false
  })

  container.querySelector('#td-clear-btn').addEventListener('click', () => {
    leftEl.value  = ''
    rightEl.value = ''
    resultEl.hidden = true
  })
}
