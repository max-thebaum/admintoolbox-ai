/**
 * Idempotente Schema-Migration — wird beim Serverstart ausgeführt
 */
import bcrypt from 'bcryptjs'
import { query } from './db.js'

export async function ensureSchema() {
  // Users (bereits durch setup.js angelegt, aber sicherheitshalber)
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'admin',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  // Key-Value Settings (nav config etc.)
  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `)
}

/**
 * Legt den Admin-Account aus Umgebungsvariablen an, falls noch keiner existiert.
 * Wird nur ausgeführt wenn ADMIN_USERNAME + ADMIN_PASSWORD gesetzt sind.
 * Überschreibt keinen bestehenden Account — idempotent.
 */
export async function ensureAdminFromEnv() {
  const username = process.env.ADMIN_USERNAME?.trim()
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) return

  if (password.length < 8) {
    console.warn('[setup] ADMIN_PASSWORD ist kürzer als 8 Zeichen — übersprungen.')
    return
  }

  const { rows } = await query('SELECT id FROM users WHERE username = $1', [username])
  if (rows.length > 0) {
    console.log(`[setup] Admin-Account "${username}" existiert bereits — kein Update.`)
    return
  }

  const hash = await bcrypt.hash(password, 12)
  await query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
    [username, hash, 'admin']
  )
  console.log(`[setup] Admin-Account "${username}" automatisch angelegt.`)
}
