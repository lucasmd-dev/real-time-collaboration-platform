import http from 'http'
import { Server as SocketServer } from 'socket.io'
import { createApp } from './app'
import { env } from './config/env'
import { db } from './config/database'
import { redis, redisSub } from './config/redis'
import { logger } from './shared/logger'
import { setupCollaborationGateway } from './modules/collaboration/collaboration.gateway'

async function bootstrap() {
  await db.query('SELECT 1')
  await redis.connect()
  await redisSub.connect()

  const app = createApp()
  const server = http.createServer(app)

  const io = new SocketServer(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    transports: ['websocket', 'polling'],
  })

  setupCollaborationGateway(io)

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`)
  })

  const shutdown = async () => {
    logger.info('Shutting down...')
    server.close()
    await db.end()
    await redis.quit()
    await redisSub.quit()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server')
  process.exit(1)
})
