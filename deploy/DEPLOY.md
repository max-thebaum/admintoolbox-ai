# Deployment auf Hetzner VPS

## Voraussetzungen

- Hetzner VPS (Ubuntu 22.04 oder 24.04 empfohlen)
- Domain mit A-Record → Server-IP
- Ports **80** und **443** in der Hetzner Firewall freigegeben

---

## 1. Server vorbereiten

```bash
# System aktualisieren
apt update && apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com | sh

# Docker ohne sudo nutzbar machen (optional, danach neu einloggen)
usermod -aG docker $USER
```

---

## 2. Repository klonen

```bash
git clone https://github.com/max-thebaum/admintoolbox-ai.git
cd admintoolbox-ai/deploy
```

---

## 3. Umgebungsvariablen setzen

```bash
cp .env.example .env
nano .env
```

Die drei Werte ausfüllen:

| Variable | Beschreibung |
|----------|-------------|
| `DOMAIN` | Deine Domain, z. B. `tools.example.com` |
| `DB_PASSWORD` | Sicheres Datenbankpasswort |
| `JWT_SECRET` | Zufälliger String, min. 32 Zeichen |

JWT_SECRET generieren:
```bash
openssl rand -hex 32
```

---

## 4. Starten

```bash
docker compose up -d --build
```

Caddy holt sich das Let's Encrypt-Zertifikat automatisch beim ersten Start.
Die App ist danach unter `https://DOMAIN` erreichbar.

---

## 5. Admin-Account anlegen (einmalig)

```bash
docker compose exec -it app node server/setup.js
```

---

## Updates einspielen

```bash
git pull
docker compose up -d --build
```

Datenbank und Zertifikate bleiben dabei erhalten (Docker Volumes).

---

## Nützliche Befehle

```bash
# Status aller Container
docker compose ps

# Logs ansehen
docker compose logs -f app
docker compose logs -f caddy

# Container neustarten
docker compose restart app

# Alles stoppen
docker compose down

# Alles stoppen + Daten löschen (Vorsicht!)
docker compose down -v
```

---

## Architektur

```
Internet
  │
  ├── :80  ──► Caddy (HTTP → HTTPS Redirect, automatisch)
  └── :443 ──► Caddy (SSL-Terminierung, Let's Encrypt)
                  │
              app:3001 (intern, nicht öffentlich)
                  │
              db:5432  (intern, nicht öffentlich)
```

Weder die App noch die Datenbank sind direkt vom Internet erreichbar — nur Caddy auf 80/443.
