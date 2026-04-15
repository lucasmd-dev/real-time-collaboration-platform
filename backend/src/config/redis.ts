import Redis from 'ioredis'
import { env } from './env'
import { logger } from '../shared/logger'

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

export const redisSub = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

redis.on('error', (err) => logger.error({ err }, 'Redis error'))
redisSub.on('error', (err) => logger.error({ err }, 'Redis subscriber error'))
