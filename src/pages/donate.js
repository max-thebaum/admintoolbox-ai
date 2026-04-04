// ============================================================
// Spendenseite — lädt Links dynamisch aus den Admin-Einstellungen
// ============================================================
import { t } from '../i18n/index.js'

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const ICONS = {
  paypal: `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="color:var(--accent)">
    <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>`,
  bitcoin: `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="color:var(--accent)">
    <path d="M17.06 11.57c.59-.69.94-1.59.94-2.57 0-2.21-1.79-4-4-4V3h-2v2H10V3H8v2H5v2h2v10H5v2h3v2h2v-2h2v2h2v-2c2.21 0 4-1.79 4-4 0-1.11-.45-2.12-1.17-2.83zM9 7h5c1.1 0 2 .9 2 2s-.9 2-2 2H9V7zm6 10H9v-4h6c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
  </svg>`,
  bmac: `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="color:var(--accent)">
    <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
  </svg>`
}

function card(id, icon, title, desc) {
  return `
    <div class="donate-card" id="donate-card-${id}">
      <div class="donate-card-icon">${icon}</div>
      <div class="donate-card-body">
        <h3>${title}</h3>
        <p class="donate-card-desc">${desc}</p>
        <div class="donate-card-action" id="donate-action-${id}">
          <span class="donate-badge">${t('donate.badge')}</span>
        </div>
      </div>
    </div>`
}

function buildHtml() {
  return `
    <div class="tool-panel">
      <div class="tool-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent)" aria-hidden="true">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
          </svg>
          ${t('donate.title')}
        </h2>
        <p>${t('donate.subtitle')}</p>
      </div>
      <div class="tool-body">
        <div class="donate-intro">
          <p>${t('donate.intro1')}</p>
          <p>${t('donate.intro2')}</p>
        </div>

        <div class="donate-sidepro">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="flex-shrink:0;margin-top:1px;color:var(--accent)">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p>${t('donate.sidepro')}</p>
        </div>

        <div class="donate-options">
          ${card('paypal',  ICONS.paypal,  t('donate.paypal.title'),  t('donate.paypal.desc'))}
          ${card('bitcoin', ICONS.bitcoin, t('donate.bitcoin.title'), t('donate.bitcoin.desc'))}
          ${card('bmac',    ICONS.bmac,    t('donate.bmac.title'),    t('donate.bmac.desc'))}
        </div>

        <div class="donate-thanks">
          <p>${t('donate.thanks')}</p>
        </div>
      </div>
    </div>`
}

function renderLinks(container, links) {
  if (links.paypal) {
    container.querySelector('#donate-action-paypal').innerHTML =
      `<a href="${esc(links.paypal)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary donate-btn">PayPal öffnen</a>`
  }

  if (links.bitcoin) {
    const addr = esc(links.bitcoin)
    container.querySelector('#donate-action-bitcoin').innerHTML =
      `<div class="donate-btc-wrap">
        <code class="donate-btc-addr">${addr}</code>
        <button class="btn btn-sm donate-copy-btn" data-copy="${addr}">Kopieren</button>
      </div>`
    container.querySelector('.donate-copy-btn').addEventListener('click', e => {
      navigator.clipboard.writeText(e.currentTarget.dataset.copy).then(() => {
        e.currentTarget.textContent = '✓ Kopiert'
        setTimeout(() => { e.currentTarget.textContent = 'Kopieren' }, 2000)
      })
    })
  }

  if (links.bmac) {
    container.querySelector('#donate-action-bmac').innerHTML =
      `<a href="${esc(links.bmac)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary donate-btn">Buy Me a Coffee ☕</a>`
  }
}

export function html() {
  return buildHtml()
}

export function init(container) {
  fetch('/api/settings/donate')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(links => renderLinks(container, links))
    .catch(() => {})
}
