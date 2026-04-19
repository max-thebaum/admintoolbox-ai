import de from './de.js'
import en from './en.js'

const TRANSLATIONS = { de, en }
const VALID = new Set(['de', 'en'])
let _locale = VALID.has(localStorage.getItem('admintoolbox-locale')) ? localStorage.getItem('admintoolbox-locale') : 'de'

export function t(key) {
  const dict = TRANSLATIONS[_locale] || TRANSLATIONS.de
  return dict[key] ?? TRANSLATIONS.de[key] ?? key
}

export function getLocale() { return _locale }

export function setLocale(lang) {
  if (!VALID.has(lang)) return
  _locale = lang
  localStorage.setItem('admintoolbox-locale', lang)
  window.dispatchEvent(new CustomEvent('at:locale-change', { detail: { lang } }))
}
