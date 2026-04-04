#!/usr/bin/env node
/**
 * AdminToolbox — Admin account setup
 * Run once: npm run setup
 */
import 'dotenv/config'
import { createInterface } from 'readline'
import bcrypt from 'bcryptjs'
import { query, pool } from './lib/db.js'

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(q) {
  return new Promise(resolve => rl.question(q, resolve))
}

async function askPassword(prompt) {
  return new Promise(resolve => {
    process.stdout.write(prompt)
    let password = ''

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.setEncoding('utf8')

      const handler = (ch) => {
        if (ch === '\n' || ch === '\r' || ch === '\u0003') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.removeListener('data', handler)
          process.stdout.write('\n')
          resolve(password)
        } else if (ch === '\u007f') {
          password = password.slice(0, -1)
        } else {
          password += ch
          process.stdout.write('*')
        }
      }
      process.stdin.on('data', handler)
    } else {
      // Non-TTY fallback (piped input)
      rl.question('', (answer) => {
        process.stdout.write('\n')
        resolve(answer)
      })
    }
  })
}

console.log('\n═══════════════════════════════════════')
console.log('  AdminToolbox — Admin Account Setup')
console.log('═══════════════════════════════════════\n')

async function main() {
  // Ensure schema exists
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'admin',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const username = (await ask('Admin-Benutzername: ')).trim()
  if (!username || username.length < 3) {
    console.error('Fehler: Benutzername muss mindestens 3 Zeichen lang sein.')
    process.exit(1)
  }

  const password = await askPassword('Admin-Passwort (mind. 8 Zeichen): ')
  if (!password || password.length < 8) {
    console.error('Fehler: Passwort muss mindestens 8 Zeichen lang sein.')
    process.exit(1)
  }

  const confirm = await askPassword('Passwort bestätigen: ')
  if (password !== confirm) {
    console.error('Fehler: Passwörter stimmen nicht überein.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Upsert — create or update password
  const { rows } = await query(
    'SELECT id FROM users WHERE username = $1',
    [username]
  )

  if (rows.length > 0) {
    const answer = (await ask(`Benutzer "${username}" existiert. Passwort aktualisieren? (j/n): `)).trim().toLowerCase()
    if (answer !== 'j') {
      console.log('Abgebrochen.')
      await pool.end()
      rl.close()
      process.exit(0)
    }
    await query('UPDATE users SET password_hash = $1 WHERE username = $2', [passwordHash, username])
    console.log('\n✓ Passwort erfolgreich aktualisiert!')
  } else {
    await query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      [username, passwordHash, 'admin']
    )
    console.log('\n✓ Admin-Account erfolgreich angelegt!')
  }

  console.log(`  Benutzername: ${username}`)
  console.log('  Passwort:     [als bcrypt-Hash gespeichert]')
  console.log('\nStarte jetzt den Server mit: npm run start\n')

  await pool.end()
  rl.close()
  process.exit(0)
}

main().catch(err => {
  console.error('Fehler:', err.message)
  process.exit(1)
})
