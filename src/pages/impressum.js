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
        <strong>[Vorname Nachname]</strong><br>
        [Straße Hausnummer]<br>
        [PLZ Ort]<br>
        Deutschland
      </p>
    </div>

    <div class="static-section">
      <h3>Kontakt</h3>
      <p>
        Telefon: [+49 xxx xxxxxxx]<br>
        E-Mail: <a href="mailto:info@example.com">info@example.com</a>
      </p>
    </div>

    <div class="static-section">
      <h3>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h3>
      <p>
        [Vorname Nachname]<br>
        [Adresse wie oben]
      </p>
    </div>

    <div class="static-section">
      <h3>Haftungsausschluss</h3>
      <h4>Haftung für Inhalte</h4>
      <p>Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.</p>

      <h4>Haftung für Links</h4>
      <p>Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>

      <h4>Urheberrecht</h4>
      <p>Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors.</p>
    </div>

    <p class="static-note">Bitte ersetze die Platzhalter in eckigen Klammern mit deinen echten Angaben.</p>
  </div>
</div>
  `
}

export function init() {}
