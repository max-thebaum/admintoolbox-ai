// ============================================================
// Navigation — async, dynamic nav config from API
// Category buttons in header → left tool sidebar on click
// ============================================================
import { getToolByHash } from '../config/tools.js'
import { t, getLocale } from '../i18n/index.js'

function getDefaultNavConfig() {
  return [
    { id: 1, label: t('cat.netzwerk'),  tools: ['subnet', 'speedcalc', 'dns', 'ipinfo', 'portref', 'portcheck', 'dnsprop'] },
    { id: 2, label: t('cat.security'),  tools: ['passgen', 'hashgen'] },
    { id: 3, label: t('cat.pki'),       tools: ['csrgen', 'certgen', 'certchain', 'certdecoder'] },
    { id: 4, label: t('cat.mdm'),       tools: ['intune'] },
    { id: 5, label: t('cat.developer'), tools: ['jsonformat', 'base64', 'timestamp', 'uuidgen', 'regextest', 'textdiff', 'csvclean'] },
    { id: 6, label: t('cat.scripts'),   tools: ['bashgen'] },
  ]
}

let _config = getDefaultNavConfig()
let _activeCatId = null
let _configFromApi = false  // true = user saved custom config → don't auto-translate labels

async function fetchNavConfig() {
  try {
    const res = await fetch('/api/settings/nav')
    if (res.ok) {
      _configFromApi = true
      return await res.json()
    }
  } catch { /* use default */ }
  _configFromApi = false
  return getDefaultNavConfig()
}

export async function renderNav() {
  _config = await fetchNavConfig()

  const list = document.getElementById('nav-list')
  if (!list) return

  _renderNavButtons(list)
  initMobileNav()

  // Listen for navigation events from router
  window.addEventListener('at:navigate', e => updateNavForHash(e.detail.hash))

  // Re-render on locale change
  // Only update labels if using the built-in default config (no admin-saved config)
  window.addEventListener('at:locale-change', () => {
    if (!_configFromApi) {
      const defaults = getDefaultNavConfig()
      _config = _config.map(cat => {
        const def = defaults.find(d => d.id === cat.id)
        return def ? { ...cat, label: def.label } : cat
      })
    }
    _renderNavButtons(list)
    if (_activeCatId !== null) showCategorySidebar(_activeCatId)
    else {
      const hash = location.hash.replace('#', '') || 'home'
      updateNavForHash(hash)
    }
  })

  // Activate correct category for initial hash
  const hash = location.hash.replace('#', '') || 'home'
  updateNavForHash(hash)
}

function _renderNavButtons(list) {
  list.innerHTML = _config.map(cat => `
    <li class="nav-category">
      <button class="nav-category-btn" data-cat-id="${cat.id}">
        ${escHtml(cat.label)}
      </button>
    </li>
  `).join('')

  list.querySelectorAll('.nav-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = parseInt(btn.dataset.catId)
      if (_activeCatId === catId) {
        hideSidebar()
      } else {
        showCategorySidebar(catId)
      }
    })
  })

  // Restore active state
  if (_activeCatId !== null) {
    document.querySelectorAll('.nav-category-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.catId) === _activeCatId)
    })
  }
}

function showCategorySidebar(catId) {
  const cat = _config.find(c => c.id === catId)
  if (!cat) return

  _activeCatId = catId

  const sidebar    = document.getElementById('tool-sidebar')
  const layout     = document.getElementById('page-layout')
  const currentHash = location.hash.replace('#', '') || 'home'

  if (!sidebar) return

  sidebar.innerHTML = `
    <div class="tool-sidebar-header">${escHtml(cat.label)}</div>
    <nav class="tool-sidebar-nav" aria-label="${escHtml(cat.label)} Tools">
      ${cat.tools.map(hash => {
        const tool = getToolByHash(hash)
        if (!tool) return ''
        return `
          <a href="#${hash}" class="tool-sidebar-item ${hash === currentHash ? 'active' : ''}"
             data-hash="${hash}">
            <span class="tool-sidebar-name">${escHtml(tool.label)}</span>
            <span class="tool-sidebar-desc">${escHtml(tool.desc)}</span>
          </a>
        `
      }).join('')}
    </nav>
  `

  sidebar.hidden = false
  layout?.classList.add('has-sidebar')

  // Mark active category button
  document.querySelectorAll('.nav-category-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.catId) === catId)
  })

  // Auto-navigate to first tool if current page is not in this category
  if (!cat.tools.includes(currentHash) && cat.tools.length > 0) {
    window.location.hash = '#' + cat.tools[0]
  }
}

function hideSidebar() {
  _activeCatId = null
  const sidebar = document.getElementById('tool-sidebar')
  const layout  = document.getElementById('page-layout')
  sidebar && (sidebar.hidden = true)
  layout?.classList.remove('has-sidebar')
  document.querySelectorAll('.nav-category-btn').forEach(b => b.classList.remove('active'))
}

export function updateNavForHash(hash) {
  const cat = _config.find(c => c.tools.includes(hash))

  if (!cat) {
    hideSidebar()
    return
  }

  if (_activeCatId !== cat.id) {
    showCategorySidebar(cat.id)
  } else {
    updateSidebarActive(hash)
  }
}

function updateSidebarActive(hash) {
  document.querySelectorAll('.tool-sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.hash === hash)
  })
}

function initMobileNav() {
  const burger  = document.getElementById('nav-burger')
  const navList = document.getElementById('nav-list')
  if (!burger || !navList) return

  burger.addEventListener('click', () => {
    const open = navList.classList.toggle('open')
    burger.setAttribute('aria-expanded', String(open))
  })

  navList.addEventListener('click', e => {
    if (e.target.closest('.nav-category-btn')) {
      navList.classList.remove('open')
      burger.setAttribute('aria-expanded', 'false')
    }
  })
}

// Expose config for admin panel
export function getNavConfig() { return _config }
export async function reloadNavConfig() {
  _config = await fetchNavConfig()
  const list = document.getElementById('nav-list')
  if (!list) return
  _renderNavButtons(list)
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
