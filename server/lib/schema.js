/**
 * Idempotente Schema-Migration — wird beim Serverstart ausgeführt
 */
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
