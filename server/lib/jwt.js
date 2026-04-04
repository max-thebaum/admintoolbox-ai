import { randomBytes } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(64).toString('hex')

if (!process.env.JWT_SECRET) {
  console.warn('[warn] JWT_SECRET not set in .env — using random secret (sessions reset on every restart).')
}

export function getJwtSecret() { return JWT_SECRET }
