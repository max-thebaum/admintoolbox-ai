# AdminToolbox

Eine Sammlung professioneller Netzwerk- und Admin-Tools für Systemadministratoren und Netzwerkingenieure. Alle Tools laufen direkt im Browser — ohne Login, ohne Installation, ohne Tracking.

> **Entstehung:** Idee und Anforderungen kommen vom Menschen, die gesamte Implementierung wurde von Claude (Anthropic) generiert. Das Projekt ist ein Experiment: wie weit kommt man mit KI-generiertem Code?

---

## Inhaltsverzeichnis

- [Architektur](#architektur)
- [Technologie-Stack](#technologie-stack)
- [Installation & Betrieb](#installation--betrieb)
- [Tools im Detail](#tools-im-detail)
  - [Netzwerk](#netzwerk)
  - [Sicherheit](#sicherheit)
  - [PKI](#pki)
  - [MDM](#mdm)
  - [Developer](#developer)
  - [Scripts](#scripts)
- [Server-seitige API-Endpunkte](#server-seitige-api-endpunkte)
- [Admin-Bereich](#admin-bereich)
- [Datenschutz & Sicherheit](#datenschutz--sicherheit)
- [Projektstruktur](#projektstruktur)

---

## Architektur

AdminToolbox ist eine **Vite + Vanilla JavaScript Single-Page-Application (SPA)** mit einem schlanken **Express.js**-Backend. Das Frontend kommuniziert über eine REST-API mit dem Server; der Großteil der Tools arbeitet jedoch vollständig **client-seitig** und sendet keine Nutzerdaten an den Server.

```
Browser (SPA)
│
├── Client-seitige Tools (kein Server-Kontakt)
│   Subnet, Speedcalc, Passgen, Hashgen, CSR/Cert-Gen, Chain Builder,
│   Cert Decoder, JSON Formatter, Base64, Timestamp, UUID, Regex,
│   Text Diff, CSV Cleaner, JWT Decoder, Mail Header Analyzer,
│   Bild-Konverter, Port Reference
│
└── Server-seitige Tools (API-Calls)
    DNS Lookup, IP Info, Port Checker, DNS Propagation,
    SSL/TLS Checker, WHOIS, App Store Export, Bootstrap Generator
        │
        ▼
    Express.js API (Node.js)
        │
        ├── PostgreSQL (Einstellungen, Admin-Accounts)
        └── Externe APIs (Cloudflare DoH, ip-api.com, RDAP, App Store)
```

Das Hash-basierte Routing (`#tool-name`) ermöglicht direkte Verlinkung auf einzelne Tools, ohne dass der Server eine separate Route kennen muss.

---

## Technologie-Stack

| Schicht | Technologie |
|---------|-------------|
| Frontend | Vite 5, Vanilla JavaScript (ESM), CSS Custom Properties |
| Backend | Node.js 20, Express.js 5 |
| Datenbank | PostgreSQL 17 |
| Authentifizierung | JWT (HS256, 8h Gültigkeit), bcrypt (Cost 12) |
| Containerisierung | Docker (Multi-Stage Build), Docker Compose |
| Kryptografie (client-seitig) | Web Crypto API, node-forge |
| Schriften | IBM Plex Sans, JetBrains Mono (Google Fonts) |
| Sprachen | Deutsch (Standard), Englisch |

---

## Installation & Betrieb

### Voraussetzungen

- Node.js 20+
- Docker & Docker Compose (für PostgreSQL)

### Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. PostgreSQL starten
npm run db:up

# 3. Admin-Account anlegen (einmalig)
npm run setup

# 4. Dev-Server starten (Vite + Express gleichzeitig)
npm start
```

Das Frontend läuft auf `http://localhost:5173`, der API-Server auf `http://localhost:3001`.

### Produktion (Docker)

```bash
# Image bauen
docker build -t admintoolbox:latest .

# Container starten
docker run -d \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/admintoolbox" \
  -e JWT_SECRET="langer-zufälliger-string" \
  --name admintoolbox \
  admintoolbox:latest
```

Der Multi-Stage Dockerfile erstellt zunächst das Vite-Bundle (Stage 1) und kopiert nur das kompilierte `dist/`-Verzeichnis zusammen mit dem Server-Code in das finale, schlanke Alpine-Image (Stage 2). Dev-Dependencies landen nicht im Produktions-Image.

### Umgebungsvariablen

| Variable | Beschreibung | Pflicht |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL-Verbindungsstring | Ja |
| `JWT_SECRET` | Geheimschlüssel für JWT-Signierung (min. 32 Zeichen) | Ja |
| `PORT` | HTTP-Port (Standard: 3001) | Nein |
| `APP_URL` | Öffentliche URL der App (für CORS-Whitelist) | Empfohlen |

---

## Tools im Detail

### Netzwerk

#### Subnet Calculator
**Typ:** Client-seitig | **Pfad:** `#subnet`

Berechnet alle relevanten Netzwerkparameter aus einer IP-Adresse mit CIDR-Präfix (z. B. `192.168.1.0/24`):
- Netzwerk- und Broadcast-Adresse
- Subnetzmaske und Wildcard-Maske
- Ersten und letzten nutzbaren Host
- Anzahl nutzbarer Hosts
- IP-Klasse und Typ (privat/öffentlich/loopback/link-local)

Unterstützt IPv4. Alle Berechnungen erfolgen bitweise im Browser, es werden keine Daten übertragen.

---

#### DNS Lookup
**Typ:** Server-seitig | **API:** `GET /api/dns/lookup?domain=&types=` | **Pfad:** `#dns`

Fragt DNS-Einträge für eine Domain ab. Unterstützte Record-Typen: `A`, `AAAA`, `MX`, `NS`, `TXT`, `CNAME`, `SOA`, `CAA`, `SRV`, `PTR`.

Der Server leitet die Anfrage an **Cloudflare DNS-over-HTTPS** (`cloudflare-dns.com/dns-query`) weiter. Dadurch werden keine DNS-Pakete auf Port 53 aus dem Browser gesendet, und der lokale DNS-Resolver des Nutzers bleibt unberührt. Timeout: 5 Sekunden pro Abfrage. Rate Limit: 30 Anfragen/Minute.

---

#### IP Info
**Typ:** Server-seitig | **API:** `GET /api/ipinfo?ip=` | **Pfad:** `#ipinfo`

Gibt Geolokation, ISP, ASN und Abuse-Kontakte für eine IP-Adresse zurück. Ohne Eingabe wird die eigene öffentliche IP ausgewertet. Nutzt die öffentliche API von `ip-api.com` als Backend.

Erweitert durch ein **WHOIS-Akkordeon**: Beim ersten Aufklappen wird per RDAP-Protokoll (Registration Data Access Protocol, JSON REST API) beim zuständigen Regional Internet Registry (ARIN → RIPE → APNIC → LACNIC → AFRINIC) abgefragt. Dadurch ist kein separates WHOIS-Tool nötig.

---

#### Port Checker
**Typ:** Server-seitig | **API:** `GET /api/portcheck?host=&port=` | **Pfad:** `#portcheck`

Prüft, ob ein TCP-Port auf einem Zielsystem aus dem Netz des Servers erreichbar ist. Das Ergebnis (`open` / `closed` / `timeout`) zeigt die Erreichbarkeit vom Server, nicht vom eigenen Browser aus.

Sicherheitsmaßnahmen (siehe [Datenschutz & Sicherheit](#datenschutz--sicherheit)):
- SSRF-Schutz: Private und reservierte IP-Bereiche werden geblockt
- DNS-Rebinding-Schutz: Hostname wird aufgelöst und die resultierende IP geprüft
- Port-Blocklist: Missbrauchsanfällige Ports sind gesperrt
- Concurrency-Limit: Maximal 3 gleichzeitige Verbindungsversuche global
- Rate Limit: 5 Anfragen/Minute pro IP

---

#### Speed Calculator
**Typ:** Client-seitig | **Pfad:** `#speedcalc`

Berechnet Übertragungszeiten und Dateigrößen für verschiedene Bandbreiten. Unterstützt Einheitenumrechnung (bit/s, kbit/s, Mbit/s, Gbit/s, B, KB, MB, GB, TB). Keine Netzwerkanfragen.

---

#### DNS Propagation
**Typ:** Server-seitig | **API:** `GET /api/dnsprop?domain=&type=` | **Pfad:** `#dnsprop`

Prüft, ob eine DNS-Änderung auf 8 globalen Resolvern angekommen ist. Abgefragte Resolver parallel:

| Resolver | IP | Region |
|----------|----|--------|
| Google | 8.8.8.8 / 8.8.4.4 | USA |
| Cloudflare | 1.1.1.1 / 1.0.0.1 | Global |
| Quad9 | 9.9.9.9 | Global |
| OpenDNS | 208.67.222.222 | USA |
| Verisign | 64.6.64.6 | USA |
| CleanBrowsing | 185.228.168.9 | EU |

Unterstützte Typen: `A`, `AAAA`, `MX`, `TXT`, `NS`. Rate Limit: 10 Anfragen/Minute.

---

#### Port Reference
**Typ:** Client-seitig | **Pfad:** `#portref`

Durchsuchbare und filterbare Referenztabelle bekannter TCP/UDP-Ports mit zugehörigen Diensten und Protokollangaben. Vollständig im Browser, keine Netzwerkanfragen.

---

### Sicherheit

#### Password Generator
**Typ:** Client-seitig | **Pfad:** `#passgen`

Generiert kryptografisch sichere Passwörter mit der **Web Crypto API** (`crypto.getRandomValues()`). Konfigurierbar:
- Länge (1–256 Zeichen)
- Zeichensätze: Großbuchstaben, Kleinbuchstaben, Ziffern, Sonderzeichen
- Ausschluss ähnlich aussehender Zeichen (`0`, `O`, `l`, `1`)
- Massengeneration mehrerer Passwörter gleichzeitig

Da `crypto.getRandomValues()` verwendet wird, ist die Zufälligkeit kryptografisch stark — kein `Math.random()`. Passwörter verlassen den Browser nie.

---

#### Hash Generator
**Typ:** Client-seitig | **Pfad:** `#hashgen`

Berechnet **SHA-256** und **SHA-512** Prüfsummen für:
- Eingegebenen Text (UTF-8)
- Hochgeladene Dateien (bis 50 MB, via `FileReader`)

Nutzt die **Web Crypto API** (`crypto.subtle.digest()`). Alle Berechnungen im Browser, keine Datenübertragung.

---

### PKI

#### CSR Generator
**Typ:** Client-seitig | **Pfad:** `#csrgen`

Erstellt einen privaten RSA-Schlüssel (2048 oder 4096 Bit) und einen **Certificate Signing Request (CSR)** vollständig im Browser. Unterstützt:
- Distinguished Name (CN, O, OU, L, ST, C)
- Subject Alternative Names (SANs) — Domains und IPs
- PEM-Ausgabe für Schlüssel und CSR

Verwendet **node-forge** (im Browser). Der private Schlüssel verlässt den Browser nicht, er wird nur lokal angezeigt und kann heruntergeladen werden.

---

#### Certificate Generator
**Typ:** Client-seitig | **Pfad:** `#certgen`

Erstellt selbstsignierte X.509-Zertifikate direkt im Browser — ohne Server, ohne Upload. Konfigurierbar:
- Gültigkeit (Tage)
- Schlüssellänge (2048 / 4096 Bit)
- SANs (Domains und IPs)
- Alle DN-Felder

Ausgabe: PEM-Zertifikat + PEM-Schlüssel als separate Download-Dateien.

---

#### Chain Builder
**Typ:** Client-seitig | **Pfad:** `#certchain`

Fügt einzelne PEM-Zertifikate (End-Entity, Intermediate, Root) in der richtigen Reihenfolge zu einer vollständigen Zertifikatskette zusammen. Validiert die Kettenreihenfolge anhand des Aussteller-/Subjekt-Feldes.

---

#### Certificate Decoder
**Typ:** Client-seitig | **Pfad:** `#certdecoder`

Analysiert ein PEM-Zertifikat und zeigt alle relevanten Felder:
- Aussteller und Subjekt (DN)
- Gültigkeitszeitraum mit Restlaufzeit-Badge (grün/orange/rot)
- Subject Alternative Names (SANs)
- SHA-256 Fingerabdruck
- Seriennummer, Signaturalgorithmus
- Key Usage und Extended Key Usage

Vollständig client-seitig mit node-forge.

---

#### SSL/TLS Checker
**Typ:** Server-seitig | **API:** `GET /api/ssltls?host=&port=` | **Pfad:** `#ssltls`

Verbindet sich via `tls.connect()` (Node.js) mit dem Zielserver und liest das TLS-Zertifikat aus. Zeigt:
- Zertifikatsdetails (Aussteller, Gültigkeit, SANs, Fingerabdruck)
- TLS-Version und Cipher Suite
- Zertifikatskette (alle Intermediate-Zertifikate)
- Verbleibende Gültigkeitsdauer mit Ampel-Badge

Rate Limit: 10 Anfragen/Minute. Timeout: 10 Sekunden.

---

### MDM

#### App Store Export (Intune)
**Typ:** Server-seitig | **API:** `GET /api/intune/search?term=&country=` | **Pfad:** `#intune`

Durchsucht den Apple App Store nach iOS-Apps und exportiert die Ergebnisse als **CSV für Microsoft Intune**. Nutzt die öffentliche iTunes Search API (`itunes.apple.com/search`). Die CSV-Datei enthält alle für Intune relevanten Felder (Bundle-ID, Name, Version, Entwickler).

---

### Developer

#### JSON Formatter
**Typ:** Client-seitig | **Pfad:** `#jsonformat`

Formatiert, minifiziert und validiert JSON. Zeigt Syntaxfehler mit Zeilen- und Spaltenangabe. Unterstützt:
- Pretty-Print mit konfigurierbarer Einrückung (2/4 Spaces, Tab)
- Minifizierung
- Syntax-Highlighting

---

#### Base64 En/Decode
**Typ:** Client-seitig | **Pfad:** `#base64`

Kodiert und dekodiert Text, URLs und Binärdaten (Datei-Upload) in Base64. Unterstützt Standard-Base64 und URL-sicheres Base64 (Base64url). Dateigrößenlimit: 10 MB.

---

#### Timestamp Converter
**Typ:** Client-seitig | **Pfad:** `#timestamp`

Konvertiert Unix-Zeitstempel (Sekunden und Millisekunden) in menschenlesbare Datum/Uhrzeit-Darstellungen und zeigt die aktuelle Zeit als Unix-Timestamp. Unterstützt UTC und lokale Zeitzone.

---

#### UUID Generator
**Typ:** Client-seitig | **Pfad:** `#uuidgen`

Generiert UUIDs der Version 4 (zufällig) mit der Web Crypto API (`crypto.randomUUID()`). Unterstützt Einzelgenerierung und Massengenerierung (bis zu 1000 UUIDs auf einmal). Export als TXT-Datei.

---

#### Regex Tester
**Typ:** Client-seitig | **Pfad:** `#regextest`

Testet reguläre Ausdrücke in Echtzeit gegen einen Teststring. Zeigt:
- Alle Treffer farbig hervorgehoben
- Capture Groups (nummeriert und benannt)
- Match-Anzahl und Positionen
- Unterstützte Flags: `g`, `i`, `m`, `s`

---

#### Text Diff
**Typ:** Client-seitig | **Pfad:** `#textdiff`

Vergleicht zwei Texte zeilenweise und hebt Unterschiede farbig hervor (grün = hinzugefügt, rot = entfernt). Zeigt Zusammenfassung: Anzahl hinzugefügter/entfernter Zeilen.

---

#### CSV Cleaner
**Typ:** Client-seitig | **Pfad:** `#csvclean`

Bereinigt und validiert CSV-Dateien:
- Erkennt Trennzeichen automatisch (Komma, Semikolon, Tab)
- Entfernt Leerzeilen und Whitespace
- Erkennt inkonsistente Spaltenanzahl pro Zeile
- Vorschau als Tabelle
- Export der bereinigten Datei

---

#### JWT Decoder
**Typ:** Client-seitig | **Pfad:** `#jwtdecoder`

Dekodiert JSON Web Tokens (JWT) ohne Signaturprüfung. Zeigt:
- Header (Algorithm, Type)
- Payload mit Syntax-Highlighting
- Claims `exp`, `iat`, `nbf` als menschenlesbare Zeitstempel
- Ablauf-Badge: grün (gültig), rot (abgelaufen)
- Auto-Decode beim Einfügen (erkennt das 3-Teil-Format automatisch)

Der Token verlässt den Browser nicht — kein Server-Kontakt.

---

#### Mail Header Analyzer
**Typ:** Client-seitig | **Pfad:** `#mailheader`

Analysiert rohe E-Mail-Header aus dem Clipboard oder Textfeld:
- **Routing-Pfad:** Visualisiert den Weg über alle `Received:`-Hops chronologisch, mit Zeitverzögerung pro Hop (Farbkodierung: grün < 5s, orange < 30s, rot ≥ 30s)
- **Authentifizierung:** SPF, DKIM, DMARC Status-Badges aus `Authentication-Results`
- **Spam-Score:** `X-Spam-Score`, `X-Spam-Flag`, `X-Spam-Status`
- **Zusammenfassung:** From, To, CC, Subject, Date, Message-ID
- **Alle Header:** Aufklappbare Tabelle mit sämtlichen geparsten Feldern

Unterstützt sowohl `\r\n` als auch `\n` Zeilenumbrüche und Folded Header Lines (RFC 2822).

---

#### Bild-Konverter
**Typ:** Client-seitig | **Pfad:** `#converter`

Konvertiert, skaliert und komprimiert Bilder vollständig im Browser via **Canvas API**:

| | Formate |
|---|---|
| **Einlesen** | JPEG, PNG, WebP, BMP, GIF (erstes Frame), SVG |
| **Ausgabe** | JPEG, PNG, WebP |

Optionen:
- Zielgröße in **px** oder **mm** (mit DPI-Auswahl: 72 / 96 / 150 / 300 dpi)
- Seitenverhältnis-Lock (Breite ↔ Höhe synchronisiert automatisch)
- Qualitätsregler 1–100 % (für JPEG und WebP)
- Drag & Drop oder Dateiauswahl
- Maximale Dateigröße: 50 MB

Technischer Ablauf: `FileReader.readAsDataURL()` → `new Image()` → `Canvas.drawImage()` → `canvas.toBlob()` → Download-Link. Bei JPEG-Ausgabe wird ein weißer Hintergrund eingefüllt (transparente PNG/WebP → kein schwarzes Hintergrundproblem).

---

### Scripts

#### Bootstrap Generator
**Typ:** Server-seitig (Generierung) + Client-seitig (Wizard) | **Pfad:** `#bashgen`

Erstellt angepasste Ubuntu-Server-Setup-Skripte über einen geführten Schritt-für-Schritt-Wizard. Konfigurierbare Module:
- Systemkonfiguration (Hostname, Zeitzone, Locale)
- Benutzer und SSH-Konfiguration
- Paketauswahl (Nginx, Apache, Docker, ufw, fail2ban, …)
- Automatische Sicherheitsupdates

Das generierte Skript wird als `.sh`-Datei heruntergeladen und kann direkt auf einem frischen Ubuntu-Server ausgeführt werden.

---

## Server-seitige API-Endpunkte

Alle API-Endpunkte beginnen mit `/api/`.

| Endpunkt | Methode | Auth | Rate Limit | Beschreibung |
|----------|---------|------|-----------|-------------|
| `/api/health` | GET | Nein | — | Health Check für Monitoring |
| `/api/auth/login` | POST | Nein | 5/15min | Admin-Login, gibt JWT zurück |
| `/api/dns/lookup` | GET | Nein | 30/min | DNS-Abfrage via Cloudflare DoH |
| `/api/portcheck` | GET | Nein | 5/min | TCP-Portprüfung |
| `/api/dnsprop` | GET | Nein | 10/min | DNS-Propagation auf 8 Resolvern |
| `/api/ssltls` | GET | Nein | 10/min | TLS-Zertifikatsinspektion |
| `/api/whois` | GET | Nein | 20/min | RDAP WHOIS-Abfrage |
| `/api/settings/nav` | GET | Nein | — | Aktuelle Navigations-Konfiguration |
| `/api/settings/nav` | PUT | Ja (JWT) | — | Navigations-Konfiguration speichern |
| `/api/admin/stats` | GET | Ja (JWT) | — | Admin-Statistiken |

---

## Admin-Bereich

Erreichbar unter `#admin`. Schützt die administrativen Funktionen hinter JWT-Authentifizierung.

### Login

- Rate Limit: **5 Versuche pro 15 Minuten** pro IP — danach temporäre Sperre
- **Timing-sichere Ablehnung:** Bei unbekanntem Benutzernamen wird dennoch ein bcrypt-Vergleich mit einem Dummy-Hash durchgeführt, um Username-Enumeration über Zeitunterschiede zu verhindern
- Passwörter werden mit **bcrypt (Cost Factor 12)** gehasht — keine Klartext-Speicherung
- JWT-Token: gültig **8 Stunden**, signiert mit HS256

### Navigation verwalten

Ermöglicht das Anpassen der Navigationsstruktur (Kategorien, Tool-Zuordnung, Reihenfolge) ohne Codeänderung. Wird in der PostgreSQL-Datenbank als JSON gespeichert.

---

## Datenschutz & Sicherheit

### Datensparsamkeit — keine Nutzerdaten werden gespeichert

AdminToolbox erfasst und speichert **keine personenbezogenen Daten**:

- **Kein Tracking:** Keine Analytics, kein Google Analytics, kein Matomo, keine Cookies für Tracking
- **Keine Seitenaufrufs-Protokollierung:** Besuche einzelner Tools werden nicht aufgezeichnet
- **Keine IP-Adressen in der Datenbank:** API-Anfragen werden serverseitig nicht geloggt
- **Kein Login erforderlich:** Alle Tools sind ohne Account nutzbar
- **Datenbank-Inhalt:** Nur Admin-Accounts (bcrypt-Hashes) und die Navigations-Konfiguration

Die einzige in Cookies / LocalStorage gespeicherte Information ist die Spracheinstellung (`admintoolbox-locale`) und das Theme (`admintoolbox-theme`) — beides reine UI-Präferenzen, kein personenbezogener Bezug.

### Client-seitige Verarbeitung — keine Datenübertragung

Der Großteil der Tools verarbeitet Eingaben ausschließlich im Browser. Folgende sensible Daten verlassen den Browser **nie**:

- Private Schlüssel (CSR Generator, Certificate Generator)
- Passwörter (Password Generator)
- JWT-Token-Inhalte (JWT Decoder)
- E-Mail-Header (Mail Header Analyzer)
- Hochgeladene Bilder (Bild-Konverter)
- Hashing-Eingaben (Hash Generator)
- JSON, CSV, Regex-Teststrings

### SSRF-Schutz (Port Checker)

Der Port Checker ist das einzige Tool, das auf Wunsch des Nutzers aktive TCP-Verbindungen öffnet. Mehrere Schutzebenen verhindern Missbrauch als SSRF-Vektor:

1. **IP-Bereichs-Filterung:** Anfragen an RFC-1918-Adressen (`10.x`, `192.168.x`, `172.16-31.x`), Loopback (`127.x`, `::1`), Link-Local (`169.254.x`) und `.local`/`.internal`-Hostnamen werden abgelehnt
2. **DNS-Rebinding-Schutz:** Hostnamen werden vor dem Verbindungsaufbau aufgelöst; die resultierende IP wird erneut auf private Bereiche geprüft
3. **Port-Blocklist:** Häufig missbrauchte Ports sind gesperrt (SMTP 25/465/587, IMAP/POP3, SMB 445, RDP 3389, Redis 6379, MongoDB 27017, Elasticsearch 9200, Docker 2375)
4. **Rate Limit:** 5 Anfragen/Minute pro IP
5. **Concurrency-Limit:** Global maximal 3 gleichzeitige Verbindungsversuche

### Authentifizierung

- **bcrypt (Cost 12):** Passwörter werden mit hohem Work-Factor gehasht; Brute-Force wird rechenintensiv
- **Constant-Time-Vergleich:** Bei unbekanntem Benutzernamen läuft dennoch ein vollständiger bcrypt-Vergleich, um Timing-Angriffe zur Benutzernamen-Ermittlung zu verhindern
- **JWT (HS256, 8h):** Token wird im `sessionStorage` gehalten (nicht im `localStorage` oder Cookie), verliert beim Schließen des Tabs die Gültigkeit
- **Login Rate Limit:** 5 Versuche in 15 Minuten pro IP

### HTTP-Sicherheitsheader

Jede Response enthält:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### CORS

Die CORS-Whitelist erlaubt nur bekannte Ursprünge:
- `localhost:5173` / `:5174` / `:4173` (Vite-Dev-Server)
- `localhost:<PORT>` (Produktion, gleiche Herkunft)
- `APP_URL` Umgebungsvariable (für Produktionsdomains)

### Rate Limiting

Alle öffentlichen API-Endpunkte sind mit `express-rate-limit` abgesichert. Der Server respektiert den `X-Forwarded-For`-Header (konfiguriert via `trust proxy 1`) für korrekte IP-Erkennung hinter Reverse Proxys (Traefik, Nginx, Coolify).

### Externe Abhängigkeiten (API-Calls)

Für einige Tools kontaktiert der **Server** externe Dienste — nicht der Browser direkt:

| Dienst | Genutzt von | Datenschutz |
|--------|------------|-------------|
| Cloudflare DNS-over-HTTPS | DNS Lookup | Domain-Name, kein Nutzerbezug |
| ip-api.com | IP Info | IP-Adresse der Anfrage |
| RDAP (ARIN/RIPE/APNIC/…) | WHOIS | IP oder Domain |
| iTunes Search API | App Store Export | Suchbegriff |

In keinem Fall werden Nutzerdaten wie Passwörter, Zertifikate oder persönliche Informationen an externe Dienste übermittelt.

---

## Projektstruktur

```
admintoolbox/
├── src/
│   ├── tools/                  # Ein Verzeichnis pro Tool
│   │   ├── subnet/
│   │   │   ├── subnet.js       # html(), init() Exports
│   │   │   └── subnet.css      # Tool-spezifische Styles
│   │   └── ...
│   ├── pages/                  # Sonderseiten (Home, Admin, Impressum, …)
│   ├── components/             # Wiederverwendbare Komponenten (Nav)
│   ├── config/
│   │   └── tools.js            # Tool-Registry (Hash → Label, Desc)
│   ├── i18n/
│   │   ├── index.js            # t(), setLocale(), getLocale()
│   │   ├── de.js               # Deutsche Übersetzungen
│   │   └── en.js               # Englische Übersetzungen
│   ├── styles/                 # Globale CSS-Dateien
│   │   ├── variables.css       # Design-System (CSS Custom Properties)
│   │   ├── base.css            # Reset, Typografie, Formulare
│   │   ├── layout.css          # Nav, Sidebar, Footer, Grid
│   │   └── pages.css           # Seiten-spezifische Styles
│   ├── main.js                 # App-Einstiegspunkt, Router, Lang-Switcher
│   ├── router.js               # Hash-basierter SPA-Router
│   └── theme.js                # Dark/Light Mode
├── server/
│   ├── routes/                 # Express-Router (ein File pro Thema)
│   ├── lib/
│   │   ├── db.js               # PostgreSQL-Pool
│   │   ├── schema.js           # Idempotente DB-Migrationen
│   │   └── jwt.js              # JWT-Hilfsfunktionen
│   ├── middleware/
│   │   └── auth.js             # requireAuth JWT-Middleware
│   ├── index.js                # Express-App, Middleware-Stack, Static Serving
│   └── setup.js                # Interaktives Admin-Account-Setup
├── Dockerfile                  # Multi-Stage Build
├── docker-compose.yml          # PostgreSQL für lokale Entwicklung
└── vite.config.js              # Vite-Konfiguration
```

---

## Lizenz

Dieses Projekt ist nicht open source lizenziert. Alle Rechte vorbehalten.
