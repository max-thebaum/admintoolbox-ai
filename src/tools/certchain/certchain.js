// ============================================================
// Certificate Chain Builder
// ============================================================
import forge from 'node-forge'
import { downloadText } from '../csrgen/csrgen.js'

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Zertifikat-Chain Builder</h1>
        <p class="tool-subtitle">Einzelne PEM-Zertifikate zusammenführen — für TLS-Chains, Intermediate CAs und Bundle-Dateien</p>
      </div>

      <div id="chain-slots" class="chain-slots"></div>

      <div class="chain-actions-top">
        <button id="chain-add-btn" class="btn btn-secondary">+ Zertifikat hinzufügen</button>
        <button id="chain-parse-btn" class="btn btn-primary">Chain analysieren &amp; zusammenbauen</button>
      </div>

      <div id="chain-error" class="pki-error" hidden></div>

      <div id="chain-output" hidden>
        <div class="chain-summary" id="chain-summary"></div>
        <div class="pki-output-block">
          <div class="pki-output-header">
            <span class="pki-output-label">Certificate Chain (PEM)</span>
            <div class="pki-output-actions">
              <button class="btn btn-sm btn-secondary" data-copy="chain-pem-out">Kopieren</button>
              <button class="btn btn-sm btn-secondary" data-download="chain.pem" data-source="chain-pem-out">Download chain.pem</button>
            </div>
          </div>
          <textarea id="chain-pem-out" class="pki-textarea" readonly rows="12"></textarea>
        </div>
      </div>
    </div>
  `
}

export function init(container) {
  let slotCount = 0
  const slots   = container.querySelector('#chain-slots')
  const output  = container.querySelector('#chain-output')
  const errorEl = container.querySelector('#chain-error')
  const summary = container.querySelector('#chain-summary')

  function addSlot(pem = '') {
    const id = ++slotCount
    const slot = document.createElement('div')
    slot.className = 'chain-slot'
    slot.dataset.id = id
    slot.innerHTML = `
      <div class="chain-slot-header">
        <span class="chain-slot-num">Zertifikat ${id}</span>
        <div class="chain-slot-btns">
          <button class="btn btn-sm btn-secondary chain-up" title="Nach oben">↑</button>
          <button class="btn btn-sm btn-secondary chain-down" title="Nach unten">↓</button>
          <button class="btn btn-sm btn-danger chain-remove" title="Entfernen">×</button>
        </div>
      </div>
      <textarea class="pki-textarea chain-pem-input" rows="6" placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----" spellcheck="false">${escapeHtml(pem)}</textarea>
      <div class="chain-slot-info"></div>
    `
    slots.appendChild(slot)

    slot.querySelector('.chain-remove').addEventListener('click', () => {
      slot.remove()
      renumberSlots()
      output.hidden = true
    })

    slot.querySelector('.chain-up').addEventListener('click', () => {
      const prev = slot.previousElementSibling
      if (prev) { slots.insertBefore(slot, prev); renumberSlots() }
    })

    slot.querySelector('.chain-down').addEventListener('click', () => {
      const next = slot.nextElementSibling
      if (next) { slots.insertBefore(next, slot); renumberSlots() }
    })

    const ta = slot.querySelector('.chain-pem-input')
    ta.addEventListener('input', () => {
      const info = slot.querySelector('.chain-slot-info')
      parseCertInfo(ta.value.trim(), info)
      output.hidden = true
    })

    if (pem) {
      const info = slot.querySelector('.chain-slot-info')
      parseCertInfo(pem.trim(), info)
    }
  }

  function renumberSlots() {
    slots.querySelectorAll('.chain-slot').forEach((s, i) => {
      s.querySelector('.chain-slot-num').textContent = `Zertifikat ${i + 1}`
    })
  }

  function parseCertInfo(pem, infoEl) {
    if (!pem) { infoEl.innerHTML = ''; return }
    try {
      const cert = forge.pki.certificateFromPem(pem)
      const fmt  = d => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const attr  = name => cert.subject.getField(name)?.value || '—'
      const iattr = name => cert.issuer.getField(name)?.value || '—'
      const now   = new Date()
      const valid = now >= cert.validity.notBefore && now <= cert.validity.notAfter
      infoEl.innerHTML = `
        <div class="chain-cert-info ${valid ? 'info-valid' : 'info-expired'}">
          <span class="chain-cert-badge ${valid ? 'badge-ok' : 'badge-exp'}">${valid ? 'Gültig' : 'Abgelaufen'}</span>
          <span><strong>CN:</strong> ${escapeHtml(attr('CN'))}</span>
          <span><strong>Aussteller:</strong> ${escapeHtml(iattr('CN'))}</span>
          <span><strong>Gültig:</strong> ${fmt(cert.validity.notBefore)} – ${fmt(cert.validity.notAfter)}</span>
        </div>
      `
    } catch {
      infoEl.innerHTML = '<div class="chain-cert-info info-error">Ungültiges PEM-Format</div>'
    }
  }

  container.querySelector('#chain-add-btn').addEventListener('click', () => addSlot())

  container.querySelector('#chain-parse-btn').addEventListener('click', () => {
    errorEl.hidden = true
    output.hidden  = true

    const allSlots = [...slots.querySelectorAll('.chain-slot')]
    if (allSlots.length === 0) {
      errorEl.textContent = 'Bitte mindestens ein Zertifikat hinzufügen.'
      errorEl.hidden = false
      return
    }

    const certs   = []
    const errors  = []

    allSlots.forEach((s, i) => {
      const pem = s.querySelector('.chain-pem-input').value.trim()
      if (!pem) { errors.push(`Zertifikat ${i + 1} ist leer.`); return }
      try {
        const cert = forge.pki.certificateFromPem(pem)
        certs.push({ pem: normalizePem(pem), cert, index: i + 1 })
      } catch {
        errors.push(`Zertifikat ${i + 1}: Ungültiges PEM-Format.`)
      }
    })

    if (errors.length) {
      errorEl.innerHTML = errors.map(e => `<div>${escapeHtml(e)}</div>`).join('')
      errorEl.hidden = false
      return
    }

    // Build combined chain
    const chainPem = certs.map(c => c.pem).join('\n')
    container.querySelector('#chain-pem-out').value = chainPem

    // Summary table
    const fmt = d => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const now = new Date()
    summary.innerHTML = `
      <table class="chain-table">
        <thead><tr>
          <th>#</th><th>Subject CN</th><th>Aussteller CN</th><th>Gültig bis</th><th>Status</th>
        </tr></thead>
        <tbody>
          ${certs.map(({ cert, index }) => {
            const cn     = cert.subject.getField('CN')?.value || '—'
            const issuer = cert.issuer.getField('CN')?.value  || '—'
            const valid  = now >= cert.validity.notBefore && now <= cert.validity.notAfter
            return `<tr>
              <td>${index}</td>
              <td>${escapeHtml(cn)}</td>
              <td>${escapeHtml(issuer)}</td>
              <td>${fmt(cert.validity.notAfter)}</td>
              <td><span class="chain-cert-badge ${valid ? 'badge-ok' : 'badge-exp'}">${valid ? 'Gültig' : 'Abgelaufen'}</span></td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    `

    output.hidden = false
    output.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  // Copy + Download
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

  // Start with 2 empty slots
  addSlot()
  addSlot()
}

function normalizePem(pem) {
  // Ensure single newline between certs when joining
  return pem.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd()
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
