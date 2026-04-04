import de from './de.js'
import en from './en.js'
import fr from './fr.js'
import ru from './ru.js'

const TRANSLATIONS = { de, en, fr, ru }
let _locale = localStorage.getItem('admintoolbox-locale') || 'de'

export function t(key) {
  const dict = TRANSLATIONS[_locale] || TRANSLATIONS.de
  return dict[key] ?? TRANSLATIONS.de[key] ?? key
}

export function getLocale() { return _locale }

export function setLocale(lang) {
  if (!TRANSLATIONS[lang]) return
  _locale = lang
  localStorage.setItem('admintoolbox-locale', lang)
  window.dispatchEvent(new CustomEvent('at:locale-change', { detail: { lang } }))
}
