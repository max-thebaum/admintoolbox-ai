import pg from 'pg'

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  console.error('[error] DATABASE_URL ist nicht gesetzt. Bitte .env anlegen (siehe .env.example).')
  process.exit(1)
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message)
})

// Shorthand for single queries
export const query = (text, params) => pool.query(text, params)
