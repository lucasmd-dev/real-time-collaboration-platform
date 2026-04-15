import { redis } from '../../config/redis'

const TTL_SECONDS = 300

export interface PresenceUser {
  userId: string
  name: string
  color: string
  socketId: string
}

const key = (docId: string) => `presence:${docId}`

async function getSessions(documentId: string): Promise<PresenceUser[]> {
  const raw = await redis.hgetall(key(documentId))
  return Object.values(raw).map((value) => JSON.parse(value) as PresenceUser)
}

function uniqueUsers(users: PresenceUser[]) {
  const unique = new Map<string, PresenceUser>()

  for (const user of users) {
    if (!unique.has(user.userId)) {
      unique.set(user.userId, user)
    }
  }

  return [...unique.values()]
}

export async function join(documentId: string, user: PresenceUser) {
  const sessions = await getSessions(documentId)
  const userAlreadyPresent = sessions.some(session => session.userId === user.userId)

  await redis.hset(key(documentId), user.socketId, JSON.stringify(user))
  await redis.expire(key(documentId), TTL_SECONDS)

  return { userAlreadyPresent }
}

export async function leave(documentId: string, socketId: string) {
  const rawUser = await redis.hget(key(documentId), socketId)
  if (!rawUser) {
    return { user: null, userStillPresent: false }
  }

  const user = JSON.parse(rawUser) as PresenceUser

  await redis.hdel(key(documentId), socketId)
  await redis.expire(key(documentId), TTL_SECONDS)

  const sessions = await getSessions(documentId)
  const userStillPresent = sessions.some(session => session.userId === user.userId)

  return { user, userStillPresent }
}

export async function heartbeat(documentId: string) {
  await redis.expire(key(documentId), TTL_SECONDS)
}

export async function getAll(documentId: string): Promise<PresenceUser[]> {
  return uniqueUsers(await getSessions(documentId))
}

export async function getCounts(documentIds: string[]) {
  const counts = new Map<string, number>()

  if (documentIds.length === 0) {
    return counts
  }

  const pipeline = redis.pipeline()
  documentIds.forEach(documentId => {
    pipeline.hgetall(key(documentId))
  })

  const results = await pipeline.exec()

  documentIds.forEach((documentId, index) => {
    const raw = (results?.[index]?.[1] ?? {}) as Record<string, string>
    const sessions = Object.values(raw).map((value) => JSON.parse(value) as PresenceUser)
    counts.set(documentId, uniqueUsers(sessions).length)
  })

  return counts
}

const COLORS = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#38BDF8']

export function assignColor(userId: string): string {
  const idx = userId.charCodeAt(0) % COLORS.length
  return COLORS[idx]
}
