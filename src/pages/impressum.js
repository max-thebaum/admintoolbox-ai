export function html() {
  return `
<div class="tool-panel">
  <div class="tool-header">
    <h2>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Impressum
    </h2>
    <p>Angaben gemäß § 5 TMG</p>
  </div>
  <div class="tool-body static-page">

    <div class="static-section">
      <h3>Anbieter</h3>
      <p>
        <strong>Max Baumgärtner</strong><br>
        Herbert-Hellmann-Allee 28<br>
        79189 Bad Krozingen<br>
        Deutschland
      </p>
    </div>

    <div class="static-section">
      <h3>Kontakt</h3>
      <p>
        E-Mail: <a href="mailto:admintoolbox.app@gmail.com">admintoolbox.app@gmail.com</a>
      </p>
    </div>

    <div class="static-section">
      <h3>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h3>
      <p>
        Max Baumgärtner<br>
        Herbert-Hellmann-Allee 28<br>
        79189 Bad Krozingen
      </p>
    </div>

    <div class="static-section">
      <h3>Hosting</h3>
      <p>
        Diese Website wird auf Servern der <strong>Hetzner Online GmbH</strong> betrieben.<br>
        Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland.<br>
        Weitere Informationen: <a href="https://www.hetzner.com/de/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung Hetzner</a>
      </p>
    </div>

    <div class="static-section">
      <h3>Haftungsausschluss</h3>
      <h4>Haftung für Inhalte</h4>
      <p>Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden. Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.</p>

      <h4>Haftung für Links</h4>
      <p>Dieses Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte ich keinen Einfluss habe. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.</p>

      <h4>Urheberrecht</h4>
      <p>Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des Autors.</p>
    </div>

  </div>
</div>
  `
}

export function init() {}
