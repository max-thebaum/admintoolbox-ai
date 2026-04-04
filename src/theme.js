const STORAGE_KEY = 'admintoolbox-theme'

export function initTheme() {
  const btn = document.getElementById('theme-toggle')
  if (!btn) return

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark'
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem(STORAGE_KEY, next)
    btn.setAttribute('aria-label', next === 'dark' ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln')
  })
}
