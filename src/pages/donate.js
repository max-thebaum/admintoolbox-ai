// ============================================================
// Spendenseite — i18n-aware
// ============================================================
import { t } from '../i18n/index.js'

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
          <div class="donate-card donate-placeholder">
            <div class="donate-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
            <div>
              <h3>${t('donate.paypal.title')}</h3>
              <p>${t('donate.paypal.desc')}</p>
              <span class="donate-badge">${t('donate.badge')}</span>
            </div>
          </div>

          <div class="donate-card donate-placeholder">
            <div class="donate-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
              </svg>
            </div>
            <div>
              <h3>${t('donate.iban.title')}</h3>
              <p>${t('donate.iban.desc')}</p>
              <span class="donate-badge">${t('donate.badge')}</span>
            </div>
          </div>

          <div class="donate-card donate-placeholder">
            <div class="donate-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h3>${t('donate.github.title')}</h3>
              <p>${t('donate.github.desc')}</p>
              <span class="donate-badge">${t('donate.badge')}</span>
            </div>
          </div>
        </div>

        <div class="donate-thanks">
          <p>${t('donate.thanks')}</p>
        </div>
      </div>
    </div>
  `
}

export function html() {
  return buildHtml()
}

export function init() {
  // Re-render handled globally by main.js navigateTo on at:locale-change
}
