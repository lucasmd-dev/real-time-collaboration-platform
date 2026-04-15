process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.DATABASE_URL = 'postgresql://rtcp:rtcp_dev@localhost:5432/rtcp'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters'
process.env.JWT_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.CORS_ORIGIN = 'http://localhost:5173'

import request from 'supertest'
import { createApp } from './app'
import { db } from './config/database'
import { redis } from './config/redis'

jest.mock('./config/database', () => ({
  db: {
    query: jest.fn(),
  },
}))

jest.mock('./config/redis', () => ({
  redis: {
    ping: jest.fn(),
  },
}))

describe('createApp', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns healthy when postgres and redis are available', async () => {
    const queryMock = db.query as jest.Mock
    const pingMock = redis.ping as jest.Mock

    queryMock.mockResolvedValueOnce({ rows: [] })
    pingMock.mockResolvedValueOnce('PONG')

    const response = await request(createApp()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'healthy',
      checks: {
        postgres: 'up',
        redis: 'up',
      },
    })
  })

  it('returns degraded when a dependency is unavailable', async () => {
    const queryMock = db.query as jest.Mock
    queryMock.mockRejectedValueOnce(new Error('db down'))

    const response = await request(createApp()).get('/health')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({ status: 'degraded' })
  })
})
