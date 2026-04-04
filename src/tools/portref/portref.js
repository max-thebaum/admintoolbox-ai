// ============================================================
// Port-Referenz — Well-known TCP/UDP Ports
// ============================================================

const PORTS = [
  // Dateitransfer & Remote
  { port: 20,    proto: 'TCP', service: 'FTP-Data',     desc: 'FTP Datentransfer' },
  { port: 21,    proto: 'TCP', service: 'FTP',          desc: 'FTP Steuerkanal' },
  { port: 22,    proto: 'TCP', service: 'SSH',          desc: 'Secure Shell, SFTP, SCP' },
  { port: 23,    proto: 'TCP', service: 'Telnet',       desc: 'Telnet (unverschlüsselt, veraltet)' },
  { port: 69,    proto: 'UDP', service: 'TFTP',         desc: 'Trivial File Transfer Protocol' },
  { port: 3389,  proto: 'TCP', service: 'RDP',          desc: 'Remote Desktop Protocol (Windows)' },
  { port: 5900,  proto: 'TCP', service: 'VNC',          desc: 'Virtual Network Computing' },
  // E-Mail
  { port: 25,    proto: 'TCP', service: 'SMTP',         desc: 'E-Mail Eingang (Server zu Server)' },
  { port: 110,   proto: 'TCP', service: 'POP3',         desc: 'Post Office Protocol v3' },
  { port: 143,   proto: 'TCP', service: 'IMAP',         desc: 'Internet Message Access Protocol' },
  { port: 465,   proto: 'TCP', service: 'SMTPS',        desc: 'SMTP über SSL/TLS (veraltet)' },
  { port: 587,   proto: 'TCP', service: 'SMTP-Sub',     desc: 'SMTP Submission (Clients)' },
  { port: 993,   proto: 'TCP', service: 'IMAPS',        desc: 'IMAP über SSL/TLS' },
  { port: 995,   proto: 'TCP', service: 'POP3S',        desc: 'POP3 über SSL/TLS' },
  // Web
  { port: 80,    proto: 'TCP', service: 'HTTP',         desc: 'Hypertext Transfer Protocol' },
  { port: 443,   proto: 'TCP', service: 'HTTPS',        desc: 'HTTP über TLS/SSL' },
  { port: 8080,  proto: 'TCP', service: 'HTTP-Alt',     desc: 'HTTP alternativ (Dev/Proxy)' },
  { port: 8443,  proto: 'TCP', service: 'HTTPS-Alt',    desc: 'HTTPS alternativ' },
  { port: 8888,  proto: 'TCP', service: 'HTTP-Dev',     desc: 'Jupyter Notebook / Dev-Server' },
  // DNS & DHCP
  { port: 53,    proto: 'TCP/UDP', service: 'DNS',      desc: 'Domain Name System' },
  { port: 67,    proto: 'UDP', service: 'DHCP-Server',  desc: 'DHCP Server' },
  { port: 68,    proto: 'UDP', service: 'DHCP-Client',  desc: 'DHCP Client' },
  { port: 853,   proto: 'TCP', service: 'DoT',          desc: 'DNS over TLS (RFC 7858)' },
  // Verzeichnis & Authentifizierung
  { port: 389,   proto: 'TCP', service: 'LDAP',         desc: 'Lightweight Directory Access Protocol' },
  { port: 636,   proto: 'TCP', service: 'LDAPS',        desc: 'LDAP über SSL/TLS' },
  { port: 88,    proto: 'TCP/UDP', service: 'Kerberos', desc: 'Kerberos Authentifizierung' },
  { port: 464,   proto: 'TCP', service: 'Kpasswd',      desc: 'Kerberos Passwort ändern' },
  // Windows / Active Directory
  { port: 135,   proto: 'TCP', service: 'MSRPC',        desc: 'Microsoft RPC Endpoint Mapper' },
  { port: 137,   proto: 'UDP', service: 'NetBIOS-NS',   desc: 'NetBIOS Name Service' },
  { port: 138,   proto: 'UDP', service: 'NetBIOS-DGM',  desc: 'NetBIOS Datagram Service' },
  { port: 139,   proto: 'TCP', service: 'NetBIOS-SSN',  desc: 'NetBIOS Session Service' },
  { port: 445,   proto: 'TCP', service: 'SMB',          desc: 'Server Message Block (Filesharing)' },
  { port: 3268,  proto: 'TCP', service: 'GC-LDAP',      desc: 'Global Catalog LDAP' },
  { port: 3269,  proto: 'TCP', service: 'GC-LDAPS',     desc: 'Global Catalog LDAPS' },
  // Monitoring & Logging
  { port: 161,   proto: 'UDP', service: 'SNMP',         desc: 'Simple Network Management Protocol' },
  { port: 162,   proto: 'UDP', service: 'SNMP-Trap',    desc: 'SNMP Trap (Empfänger)' },
  { port: 514,   proto: 'UDP', service: 'Syslog',       desc: 'Syslog (RFC 3164)' },
  { port: 6514,  proto: 'TCP', service: 'Syslog-TLS',   desc: 'Syslog über TLS (RFC 5425)' },
  { port: 2055,  proto: 'UDP', service: 'NetFlow',      desc: 'Cisco NetFlow / IPFIX' },
  // Datenbanken
  { port: 1433,  proto: 'TCP', service: 'MSSQL',        desc: 'Microsoft SQL Server' },
  { port: 1521,  proto: 'TCP', service: 'Oracle',       desc: 'Oracle Database' },
  { port: 3306,  proto: 'TCP', service: 'MySQL',        desc: 'MySQL / MariaDB' },
  { port: 5432,  proto: 'TCP', service: 'PostgreSQL',   desc: 'PostgreSQL Datenbank' },
  { port: 6379,  proto: 'TCP', service: 'Redis',        desc: 'Redis In-Memory Store' },
  { port: 27017, proto: 'TCP', service: 'MongoDB',      desc: 'MongoDB Datenbank' },
  { port: 9200,  proto: 'TCP', service: 'Elasticsearch',desc: 'Elasticsearch REST API' },
  { port: 5984,  proto: 'TCP', service: 'CouchDB',      desc: 'Apache CouchDB' },
  // Netzwerk & VPN
  { port: 500,   proto: 'UDP', service: 'IKE',          desc: 'IPSec IKE (VPN)' },
  { port: 1194,  proto: 'UDP', service: 'OpenVPN',      desc: 'OpenVPN' },
  { port: 1701,  proto: 'UDP', service: 'L2TP',         desc: 'Layer 2 Tunneling Protocol' },
  { port: 1723,  proto: 'TCP', service: 'PPTP',         desc: 'Point-to-Point Tunneling Protocol' },
  { port: 4500,  proto: 'UDP', service: 'IPSec-NAT',    desc: 'IPSec NAT Traversal' },
  { port: 51820, proto: 'UDP', service: 'WireGuard',    desc: 'WireGuard VPN (Standard-Port)' },
  // CI/CD & DevOps
  { port: 2376,  proto: 'TCP', service: 'Docker-TLS',   desc: 'Docker API über TLS' },
  { port: 2377,  proto: 'TCP', service: 'Docker-Swarm', desc: 'Docker Swarm Management' },
  { port: 6443,  proto: 'TCP', service: 'K8s-API',      desc: 'Kubernetes API Server' },
  { port: 8500,  proto: 'TCP', service: 'Consul',       desc: 'HashiCorp Consul HTTP API' },
  { port: 8200,  proto: 'TCP', service: 'Vault',        desc: 'HashiCorp Vault HTTP API' },
  // Sonstiges
  { port: 123,   proto: 'UDP', service: 'NTP',          desc: 'Network Time Protocol' },
  { port: 179,   proto: 'TCP', service: 'BGP',          desc: 'Border Gateway Protocol' },
  { port: 520,   proto: 'UDP', service: 'RIP',          desc: 'Routing Information Protocol' },
  { port: 546,   proto: 'UDP', service: 'DHCPv6-Client',desc: 'DHCPv6 Client' },
  { port: 547,   proto: 'UDP', service: 'DHCPv6-Server',desc: 'DHCPv6 Server' },
  { port: 5060,  proto: 'TCP/UDP', service: 'SIP',      desc: 'Session Initiation Protocol (VoIP)' },
  { port: 5061,  proto: 'TCP', service: 'SIPS',         desc: 'SIP über TLS' },
]

export function html() {
  return `
    <div class="tool-card">
      <div class="tool-header">
        <h1 class="tool-title">Port-Referenz</h1>
        <p class="tool-subtitle">Bekannte TCP/UDP-Ports für Netzwerkadministratoren — durchsuchbar und filterbar</p>
      </div>

      <div class="portref-controls">
        <input id="portref-search" class="input portref-search" type="text"
               placeholder="Port-Nummer oder Dienst suchen, z. B. 443 oder SSH…"
               autocomplete="off" spellcheck="false">
        <div class="portref-filter">
          <button class="portref-filter-btn active" data-proto="all">Alle</button>
          <button class="portref-filter-btn" data-proto="TCP">TCP</button>
          <button class="portref-filter-btn" data-proto="UDP">UDP</button>
        </div>
      </div>

      <div class="portref-count" id="portref-count"></div>

      <div class="portref-table-wrap">
        <table class="portref-table">
          <thead>
            <tr>
              <th>Port</th>
              <th>Protokoll</th>
              <th>Dienst</th>
              <th>Beschreibung</th>
            </tr>
          </thead>
          <tbody id="portref-body"></tbody>
        </table>
      </div>
    </div>
  `
}

export function init(container) {
  const searchEl  = container.querySelector('#portref-search')
  const bodyEl    = container.querySelector('#portref-body')
  const countEl   = container.querySelector('#portref-count')
  const filterBtns = container.querySelectorAll('.portref-filter-btn')

  let currentProto = 'all'
  let currentSearch = ''

  function render() {
    const term = currentSearch.toLowerCase()
    const filtered = PORTS.filter(p => {
      const matchProto = currentProto === 'all' || p.proto.includes(currentProto)
      const matchSearch = !term ||
        String(p.port).includes(term) ||
        p.service.toLowerCase().includes(term) ||
        p.desc.toLowerCase().includes(term)
      return matchProto && matchSearch
    })

    countEl.textContent = `${filtered.length} von ${PORTS.length} Ports`

    if (filtered.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="4" class="portref-empty">Kein Eintrag gefunden</td></tr>`
      return
    }

    bodyEl.innerHTML = filtered.map(p => `
      <tr>
        <td class="portref-port">${p.port}</td>
        <td><span class="portref-proto portref-proto-${p.proto.replace('/', '-')}">${p.proto}</span></td>
        <td class="portref-service">${escHtml(p.service)}</td>
        <td class="portref-desc">${escHtml(p.desc)}</td>
      </tr>
    `).join('')
  }

  searchEl.addEventListener('input', () => {
    currentSearch = searchEl.value
    render()
  })

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentProto = btn.dataset.proto
      render()
    })
  })

  render()
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
