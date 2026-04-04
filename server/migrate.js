/**
 * AdminToolbox — One-time data migration
 * Migrates: config.json → users table, posts.json → posts table
 * Run once: node server/migrate.js
 * Safe to run multiple times (ON CONFLICT DO NOTHING).
 */
import 'dotenv/config'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { query, pool } from './lib/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  console.log('[migrate] Connecting to PostgreSQL...')

  // Run schema migrations
  const sql = readFileSync(join(__dirname, 'migrations/001_initial.sql'), 'utf8')
  await query(sql)
  console.log('[migrate] Schema applied.')

  // Migrate users from config.json
  const configPath = join(__dirname, 'data/config.json')
  if (existsSync(configPath)) {
    const { username, passwordHash } = JSON.parse(readFileSync(configPath, 'utf8'))
    if (username && passwordHash) {
      const result = await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        [username, passwordHash, 'admin']
      )
      if (result.rowCount > 0) {
        console.log(`[migrate] User migrated: ${username}`)
      } else {
        console.log(`[migrate] User "${username}" already exists, skipped.`)
      }
    }
  } else {
    console.log('[migrate] No config.json found, skipping user migration.')
  }

  // Migrate posts from posts.json
  const postsPath = join(__dirname, 'data/posts.json')
  if (existsSync(postsPath)) {
    const posts = JSON.parse(readFileSync(postsPath, 'utf8'))
    if (posts.length === 0) {
      console.log('[migrate] posts.json is empty, nothing to migrate.')
    } else {
      let migrated = 0
      for (const p of posts) {
        const result = await query(
          `INSERT INTO posts (id, title, excerpt, content, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.title, p.excerpt || '', p.content, p.createdAt, p.updatedAt]
        )
        if (result.rowCount > 0) migrated++
      }
      console.log(`[migrate] Posts migrated: ${migrated} / ${posts.length}`)
    }
  } else {
    console.log('[migrate] No posts.json found, skipping posts migration.')
  }

  await pool.end()
  console.log('[migrate] Done.')
}

migrate().catch(err => {
  console.error('[migrate] Error:', err.message)
  process.exit(1)
})
