const routes = {}

export function register(hash, { html, init }) {
  routes[hash] = { html, init }
}

export function initRouter() {
  window.addEventListener('hashchange', navigate)
  navigate()
}

export function navigateTo(hash) {
  // Force re-render of current route
  const container = document.getElementById('tool-container')
  if (!container) return
  const route = routes[hash]
  if (!route) return
  container.innerHTML = typeof route.html === 'function' ? route.html() : route.html
  route.init(container)
  window.dispatchEvent(new CustomEvent('at:navigate', { detail: { hash } }))
}

function navigate() {
  const raw  = location.hash.replace('#', '')
  const hash = raw || 'home'
  const container = document.getElementById('tool-container')
  if (!container) return

  const route = routes[hash]

  if (!route) {
    container.innerHTML = `
      <div class="welcome-state">
        <p style="color:var(--text-muted)">Seite nicht gefunden: <code>#${hash}</code></p>
      </div>`
    window.dispatchEvent(new CustomEvent('at:navigate', { detail: { hash } }))
    return
  }

  container.innerHTML = typeof route.html === 'function' ? route.html() : route.html
  route.init(container)

  // Notify nav to update sidebar + active states
  window.dispatchEvent(new CustomEvent('at:navigate', { detail: { hash } }))

  if (window.innerWidth < 768) container.scrollIntoView({ behavior: 'smooth' })
}
