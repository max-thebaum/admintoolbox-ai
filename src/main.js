import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/pages.css'

import { initTheme }  from './theme.js'
import { initRouter, register, navigateTo } from './router.js'
import { renderNav }  from './components/nav.js'
import { t, getLocale, setLocale } from './i18n/index.js'
// Tools
import * as subnet    from './tools/subnet/subnet.js'
import './tools/subnet/subnet.css'

import * as speedcalc from './tools/speedcalc/speedcalc.js'
import './tools/speedcalc/speedcalc.css'

import * as dns       from './tools/dns/dns.js'
import './tools/dns/dns.css'

import * as intune    from './tools/intune/intune.js'
import './tools/intune/intune.css'

import * as passgen   from './tools/passgen/passgen.js'
import './tools/passgen/passgen.css'

import * as ipinfo    from './tools/ipinfo/ipinfo.js'
import './tools/ipinfo/ipinfo.css'

import * as portref   from './tools/portref/portref.js'
import './tools/portref/portref.css'

import * as hashgen   from './tools/hashgen/hashgen.js'
import './tools/hashgen/hashgen.css'

import * as csrgen    from './tools/csrgen/csrgen.js'
import './tools/csrgen/csrgen.css'

import * as certgen   from './tools/certgen/certgen.js'
import './tools/certgen/certgen.css'

import * as certchain from './tools/certchain/certchain.js'
import './tools/certchain/certchain.css'

// New tools
import * as jsonformat  from './tools/jsonformat/jsonformat.js'
import './tools/jsonformat/jsonformat.css'

import * as base64      from './tools/base64/base64.js'
import './tools/base64/base64.css'

import * as timestamp   from './tools/timestamp/timestamp.js'
import './tools/timestamp/timestamp.css'

import * as uuidgen     from './tools/uuidgen/uuidgen.js'
import './tools/uuidgen/uuidgen.css'

import * as portcheck   from './tools/portcheck/portcheck.js'
import './tools/portcheck/portcheck.css'

import * as dnsprop     from './tools/dnsprop/dnsprop.js'
import './tools/dnsprop/dnsprop.css'

import * as regextest   from './tools/regextest/regextest.js'
import './tools/regextest/regextest.css'

import * as certdecoder from './tools/certdecoder/certdecoder.js'
import './tools/certdecoder/certdecoder.css'

import * as textdiff    from './tools/textdiff/textdiff.js'
import './tools/textdiff/textdiff.css'

import * as csvclean    from './tools/csvclean/csvclean.js'
import './tools/csvclean/csvclean.css'

import * as bashgen     from './tools/bashgen/bashgen.js'
import './tools/bashgen/bashgen.css'

import * as speedtest   from './tools/speedtest/speedtest.js'
import './tools/speedtest/speedtest.css'

import * as ssltls      from './tools/ssltls/ssltls.js'
import './tools/ssltls/ssltls.css'

import * as jwtdecoder  from './tools/jwtdecoder/jwtdecoder.js'
import './tools/jwtdecoder/jwtdecoder.css'

// Pages
import * as donate      from './pages/donate.js'
import * as home        from './pages/home.js'
import * as admin       from './pages/admin.js'
import * as impressum   from './pages/impressum.js'
import * as datenschutz from './pages/datenschutz.js'

// Register routes
register('home',        { html: home.html,        init: home.init })
register('subnet',      { html: subnet.html,      init: subnet.init })
register('speedcalc',   { html: speedcalc.html,   init: speedcalc.init })
register('dns',         { html: dns.html,         init: dns.init })
register('intune',      { html: intune.html,      init: intune.init })
register('passgen',     { html: passgen.html,     init: passgen.init })
register('ipinfo',      { html: ipinfo.html,      init: ipinfo.init })
register('portref',     { html: portref.html,     init: portref.init })
register('hashgen',     { html: hashgen.html,     init: hashgen.init })
register('csrgen',      { html: csrgen.html,      init: csrgen.init })
register('certgen',     { html: certgen.html,     init: certgen.init })
register('certchain',   { html: certchain.html,   init: certchain.init })
register('jsonformat',  { html: jsonformat.html,  init: jsonformat.init })
register('base64',      { html: base64.html,      init: base64.init })
register('timestamp',   { html: timestamp.html,   init: timestamp.init })
register('uuidgen',     { html: uuidgen.html,     init: uuidgen.init })
register('portcheck',   { html: portcheck.html,   init: portcheck.init })
register('dnsprop',     { html: dnsprop.html,     init: dnsprop.init })
register('regextest',   { html: regextest.html,   init: regextest.init })
register('certdecoder', { html: certdecoder.html, init: certdecoder.init })
register('textdiff',    { html: textdiff.html,    init: textdiff.init })
register('csvclean',    { html: csvclean.html,    init: csvclean.init })
register('bashgen',     { html: bashgen.html,     init: bashgen.init })
register('speedtest',   { html: speedtest.html,   init: speedtest.init })
register('ssltls',      { html: ssltls.html,      init: ssltls.init })
register('jwtdecoder',  { html: jwtdecoder.html,  init: jwtdecoder.init })
register('donate',      { html: donate.html,      init: donate.init })
register('admin',       { html: admin.html,       init: admin.init })
register('impressum',   { html: impressum.html,   init: impressum.init })
register('datenschutz', { html: datenschutz.html, init: datenschutz.init })

// Boot
initTheme()
renderNav()
initLangSwitcher()
applyStaticI18n()

// Pageview beacon — fire-and-forget on every navigation
window.addEventListener('at:navigate', e => {
  fetch('/api/log/view', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ page: e.detail.hash })
  }).catch(() => {})
})

// Re-apply static i18n and re-navigate on locale change
window.addEventListener('at:locale-change', () => {
  applyStaticI18n()
  const hash = location.hash.replace('#', '') || 'home'
  navigateTo(hash)
})

// Footer year
const yearEl = document.getElementById('footer-year')
if (yearEl) yearEl.textContent = new Date().getFullYear()

// Init router last (triggers first navigation)
initRouter()

function initLangSwitcher() {
  const switcher = document.getElementById('lang-switcher')
  if (!switcher) return
  const current = getLocale()
  switcher.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === current)
    btn.addEventListener('click', () => {
      if (btn.dataset.lang === getLocale()) return
      switcher.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      setLocale(btn.dataset.lang)
    })
  })
  // Keep active class in sync on locale change
  window.addEventListener('at:locale-change', e => {
    switcher.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === e.detail.lang)
    })
  })
}

function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    el.textContent = t(key)
  })
}
