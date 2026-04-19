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
    <p>Informationen zur Verarbeitung personenbezogener Daten</p>
  </div>
  <div class="tool-body static-page">

    <div class="static-section">
      <h3>1. Verantwortlicher</h3>
      <p>
        Max Baumgärtner<br>
        Herbert-Hellmann-Allee 28<br>
        79189 Bad Krozingen<br>
        E-Mail: <a href="mailto:admintoolbox.app@gmail.com">admintoolbox.app@gmail.com</a>
      </p>
    </div>

    <div class="static-section">
      <h3>2. Grundsatz: Datensparsamkeit</h3>
      <p>AdminToolbox ist bewusst so gestaltet, dass so wenig personenbezogene Daten wie möglich anfallen:</p>
      <p><strong>Kein Tracking, keine Analyse, keine Werbung.</strong> Es werden weder Cookies für Tracking gesetzt noch Analysedienste (z. B. Google Analytics) eingebunden. Es existiert kein Werbenetzwerk.</p>
      <p><strong>Kein Login erforderlich.</strong> Alle Tools sind ohne Registrierung oder Anmeldung nutzbar.</p>
      <p><strong>Keine serverseitige Protokollierung.</strong> Seitenaufrufe und Tool-Nutzungen werden nicht aufgezeichnet. Es werden keine IP-Adressen in der Datenbank gespeichert.</p>
      <p><strong>Client-seitige Verarbeitung.</strong> Der Großteil der Tools verarbeitet alle Eingaben ausschließlich im Browser. Folgende Daten verlassen den Browser nie: Private Schlüssel, Passwörter, JWT-Tokens, E-Mail-Header, hochgeladene Bilder, Hashing-Eingaben, JSON- und CSV-Inhalte.</p>
    </div>

    <div class="static-section">
      <h3>3. Hosting bei Hetzner</h3>
      <p>Diese Website wird auf Servern der <strong>Hetzner Online GmbH</strong> (Industriestr. 25, 91710 Gunzenhausen, Deutschland) betrieben. Beim Aufruf der Website wird die IP-Adresse des anfragenden Geräts technisch bedingt an den Hetzner-Server übermittelt. Diese Daten werden durch Hetzner gemäß deren Datenschutzrichtlinie verarbeitet und nicht durch uns gespeichert oder ausgewertet.</p>
      <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am Betrieb der Website).<br>
      Weitere Informationen: <a href="https://www.hetzner.com/de/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung Hetzner</a></p>
    </div>

    <div class="static-section">
      <h3>4. Lokale Speicherung im Browser</h3>
      <p>AdminToolbox speichert ausschließlich folgende Daten im <code>localStorage</code> des Browsers — kein serverseitiger Bezug, keine Weitergabe an Dritte:</p>
      <p>
        <strong>admintoolbox-theme</strong> — gewähltes Farbschema (hell / dunkel)<br>
        <strong>admintoolbox-locale</strong> — gewählte Sprache (DE / EN)
      </p>
      <p>Diese Einstellungen können jederzeit über die Browser-Einstellungen gelöscht werden. Es handelt sich um reine UI-Präferenzen ohne Personenbezug.</p>
    </div>

    <div class="static-section">
      <h3>5. Externe Dienste</h3>
      <p>Einige Tools kontaktieren für ihre Funktion externe Dienste. Die Anfragen gehen dabei stets vom <strong>Server</strong> aus — nicht direkt vom Browser. Dabei werden nur die für die jeweilige Funktion technisch notwendigen Daten übermittelt (z. B. Domain- oder IP-Adresse). Es werden keine weiteren Nutzerdaten (Name, E-Mail, Standort o. ä.) weitergegeben.</p>

      <h4>Cloudflare DNS-over-HTTPS</h4>
      <p>Genutzt von: DNS Lookup<br>
      Übermittelte Daten: Der eingegebene Domainname und der gewünschte Record-Typ.<br>
      Zweck: Auflösung von DNS-Einträgen ohne Nutzung des lokalen DNS-Resolvers.<br>
      Anbieter: Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA.<br>
      Datenschutz: <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">cloudflare.com/privacypolicy</a></p>

      <h4>ip-api.com</h4>
      <p>Genutzt von: IP Info<br>
      Übermittelte Daten: Die abzufragende IP-Adresse (eigene oder eingegebene).<br>
      Zweck: Geolokation, ISP, ASN und Abuse-Kontakte für eine IP-Adresse.<br>
      Anbieter: ip-api.com (Pro Web Media Ltd).<br>
      Datenschutz: <a href="https://ip-api.com/docs/legal" target="_blank" rel="noopener noreferrer">ip-api.com/docs/legal</a></p>

      <h4>RDAP (Regional Internet Registries)</h4>
      <p>Genutzt von: IP Info (WHOIS-Akkordeon)<br>
      Übermittelte Daten: Die abzufragende IP-Adresse oder Domain.<br>
      Zweck: WHOIS-Informationen über das Registration Data Access Protocol (RDAP).<br>
      Anbieter: Je nach IP-Bereich ARIN (USA), RIPE NCC (Europa), APNIC (Asien-Pazifik), LACNIC (Lateinamerika) oder AFRINIC (Afrika).</p>

      <h4>Apple iTunes Search API</h4>
      <p>Genutzt von: App Store Export (Intune)<br>
      Übermittelte Daten: Der eingegebene Suchbegriff und das gewählte Länder-Kürzel.<br>
      Zweck: Suche nach iOS-Apps im Apple App Store.<br>
      Anbieter: Apple Inc., One Apple Park Way, Cupertino, CA 95014, USA.<br>
      Datenschutz: <a href="https://www.apple.com/legal/privacy/de-ww/" target="_blank" rel="noopener noreferrer">apple.com/legal/privacy</a></p>

      <h4>Google Fonts</h4>
      <p>Genutzt von: Allen Seiten (Schriftarten IBM Plex Sans, JetBrains Mono)<br>
      Übermittelte Daten: Die IP-Adresse des Browsers wird beim Laden der Schriftarten an Google übermittelt.<br>
      Anbieter: Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.<br>
      Datenschutz: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></p>
    </div>

    <div class="static-section">
      <h3>6. Deine Rechte (DSGVO)</h3>
      <p>Da auf dieser Website praktisch keine personenbezogenen Daten erhoben oder gespeichert werden, gibt es in der Regel nichts, worüber Auskunft erteilt oder was gelöscht werden müsste. Dennoch stehen dir folgende Rechte zu:</p>
      <p>
        <strong>Auskunft (Art. 15 DSGVO)</strong> — Recht auf Information über gespeicherte Daten.<br>
        <strong>Berichtigung (Art. 16 DSGVO)</strong> — Recht auf Korrektur unrichtiger Daten.<br>
        <strong>Löschung (Art. 17 DSGVO)</strong> — Recht auf Löschung gespeicherter Daten.<br>
        <strong>Einschränkung (Art. 18 DSGVO)</strong> — Recht auf Einschränkung der Verarbeitung.<br>
        <strong>Widerspruch (Art. 21 DSGVO)</strong> — Recht auf Widerspruch gegen die Verarbeitung.<br>
        <strong>Beschwerde</strong> — Recht auf Beschwerde bei einer Aufsichtsbehörde, z. B. dem Landesbeauftragten für Datenschutz Baden-Württemberg.
      </p>
      <p>Für Anfragen: <a href="mailto:admintoolbox.app@gmail.com">admintoolbox.app@gmail.com</a></p>
    </div>

  </div>
</div>
  `
}

export function init() {}
