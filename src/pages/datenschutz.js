export function html() {
  return `
<div class="tool-panel">
  <div class="tool-header">
    <h2>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      Datenschutzerklärung
    </h2>
    <p>Informationen zur Verarbeitung deiner personenbezogenen Daten</p>
  </div>
  <div class="tool-body static-page">

    <div class="static-section">
      <h3>1. Datenschutz auf einen Blick</h3>
      <h4>Allgemeine Hinweise</h4>
      <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit deinen personenbezogenen Daten passiert, wenn du diese Website besuchst. Personenbezogene Daten sind alle Daten, mit denen du persönlich identifiziert werden kannst.</p>

      <h4>Datenerfassung auf dieser Website</h4>
      <p><strong>Wer ist verantwortlich für die Datenerfassung?</strong><br>
      Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten kannst du dem <a href="#impressum">Impressum</a> entnehmen.</p>

      <p><strong>Wie erfassen wir deine Daten?</strong><br>
      Deine Daten werden zum einen dadurch erhoben, dass du uns diese mitteilst. Andere Daten werden automatisch oder nach deiner Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</p>
    </div>

    <div class="static-section">
      <h3>2. Hosting</h3>
      <p>Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.</p>
    </div>

    <div class="static-section">
      <h3>3. Allgemeine Hinweise und Pflichtinformationen</h3>
      <h4>Datenschutz</h4>
      <p>Der Betreiber dieser Seiten nimmt den Schutz deiner persönlichen Daten sehr ernst. Wir behandeln deine personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>

      <h4>Hinweis zur verantwortlichen Stelle</h4>
      <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br><br>
      [Vorname Nachname]<br>
      [Straße Hausnummer]<br>
      [PLZ Ort]<br>
      E-Mail: info@example.com</p>

      <h4>Speicherdauer</h4>
      <p>Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben deine personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt.</p>

      <h4>Deine Rechte</h4>
      <p>Du hast jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck deiner gespeicherten personenbezogenen Daten zu erhalten. Du hast außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn du eine Einwilligung zur Datenverarbeitung erteilt hast, kannst du diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem hast du das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung deiner personenbezogenen Daten zu verlangen.</p>
    </div>

    <div class="static-section">
      <h3>4. Datenerfassung auf dieser Website</h3>
      <h4>Cookies</h4>
      <p>Diese Website verwendet ausschließlich technisch notwendige Cookies (z. B. zur Speicherung der Theme-Einstellung). Es werden keine Tracking-Cookies oder Cookies von Drittanbietern gesetzt.</p>

      <h4>DNS-Abfragen</h4>
      <p>Die von dir eingegebenen Domainnamen im DNS-Lookup-Tool werden zur Auflösung an den Cloudflare DNS-Dienst (1.1.1.1) weitergeleitet. Es werden keine Abfragen gespeichert oder protokolliert.</p>

      <h4>Werbung</h4>
      <p>Diese Website kann Werbeanzeigen von Drittanbietern (z. B. Google AdSense) einbinden. Diese Anbieter können eigene Cookies setzen. Bitte beachte die Datenschutzrichtlinien der jeweiligen Anbieter.</p>
    </div>

    <p class="static-note">Bitte ersetze die Platzhalter in eckigen Klammern mit deinen echten Angaben. Diese Vorlage ist kein Rechtsrat — lass sie im Zweifelsfall von einem Anwalt prüfen.</p>
  </div>
</div>
  `
}

export function init() {}
