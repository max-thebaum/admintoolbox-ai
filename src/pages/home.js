// ============================================================
// Home — Project overview, no API calls, static + i18n
// ============================================================
import { t } from '../i18n/index.js'

const CATEGORY_ICONS = {
  netzwerk: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="5" y2="17"/><line x1="12" y1="12" x2="19" y2="17"/></svg>`,
  security: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  pki:      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  mdm:      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18" stroke-linecap="round" stroke-width="2.5"/></svg>`,
  developer:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  scripts:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
}

const CATEGORIES = ['netzwerk', 'security', 'pki', 'mdm', 'developer', 'scripts']

function buildHtml() {
  const cats = CATEGORIES.map(key => `
    <div class="home-cat-card">
      <div class="home-cat-icon">${CATEGORY_ICONS[key]}</div>
      <div>
        <div class="home-cat-name">${t(`cat.${key}`)}</div>
        <div class="home-cat-desc">${t(`home.cat.${key}`)}</div>
      </div>
    </div>
  `).join('')

  return `
    <div class="tool-panel home-panel">
      <div class="tool-body home-body">

        <div class="home-hero">
          <h1 class="home-title">${t('home.title')}</h1>
          <p class="home-subtitle">${t('home.subtitle')}</p>
        </div>

        <div class="home-section">
          <h2 class="home-section-title">${t('home.about.title')}</h2>
          <p class="home-text">${t('home.about.text')}</p>
        </div>

        <div class="home-section home-ai-box">
          <h2 class="home-section-title">${t('home.ai.title')}</h2>
          <p class="home-text">${t('home.ai.text')}</p>
        </div>

        <div class="home-section">
          <h2 class="home-section-title">${t('home.cats.title')}</h2>
          <div class="home-cat-grid">${cats}</div>
          <p class="home-updates-note">${t('home.updates')}</p>
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
