import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt, { SignOptions } from 'jsonwebtoken'
import { db } from '../../config/database'
import { env } from '../../config/env'
import { Errors } from '../../shared/errors'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserPayload {
  id: string
  email: string
  name: string
}

function signAccess(payload: UserPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] }
  return jwt.sign(payload, env.JWT_SECRET, options)
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function durationToMs(duration: string) {
  const match = duration.match(/^(\d+)([mhd])$/)
  if (!match) {
    throw new Error(`Duração inválida: ${duration}`)
  }

  const value = Number(match[1])
  const unit = match[2] as keyof typeof multipliers
  const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000 }

  return value * multipliers[unit]
}

export async function register(email: string, name: string, password: string) {
  const normalizedEmail = email.toLowerCase()
  const normalizedName = name.trim()

  const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail])
  if (existing.rows.length > 0) {
    throw Errors.Conflict('Este e-mail já está em uso')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const { rows } = await db.query(
    'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
    [normalizedEmail, normalizedName, passwordHash],
  )

  const user = rows[0] as UserPayload
  const tokens = await generateTokens(user)
  return { user, ...tokens }
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.toLowerCase()

  const { rows } = await db.query(
    'SELECT id, email, name, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
    [normalizedEmail],
  )

  const user = rows[0]
  if (!user) throw Errors.Unauthorized()

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw Errors.Unauthorized()

  const payload: UserPayload = { id: user.id, email: user.email, name: user.name }
  const tokens = await generateTokens(payload)
  return { user: payload, ...tokens }
}

export async function refreshTokens(token: string): Promise<AuthTokens> {
  const tokenHash = hashToken(token)
  const { rows } = await db.query(
    `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
            u.email, u.name
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
    [tokenHash],
  )

  const row = rows[0]
  if (!row || row.revoked || new Date(row.expires_at) < new Date()) {
    throw Errors.Unauthorized()
  }

  await db.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [row.id])
  const payload: UserPayload = { id: row.user_id, email: row.email, name: row.name }
  return generateTokens(payload)
}

export async function logout(token: string) {
  const tokenHash = hashToken(token)
  await db.query(
    'UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1',
    [tokenHash],
  )
}

async function generateTokens(user: UserPayload): Promise<AuthTokens> {
  const accessToken = signAccess(user)
  const rawRefresh = crypto.randomBytes(40).toString('hex')
  const tokenHash = hashToken(rawRefresh)

  const expiresAt = new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN))

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, expiresAt],
  )

  return { accessToken, refreshToken: rawRefresh }
}
