import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { ZodError } from 'zod'
import { env } from './config/env'
import { db } from './config/database'
import { redis } from './config/redis'
import { logger } from './shared/logger'
import { AppError } from './shared/errors'
import authRoutes from './modules/auth/auth.routes'
import documentRoutes from './modules/documents/document.routes'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', async (_req, res) => {
    try {
      await db.query('SELECT 1')
      await redis.ping()
      res.json({ status: 'healthy', checks: { postgres: 'up', redis: 'up' } })
    } catch {
      res.status(503).json({ status: 'degraded' })
    }
  })

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/documents', documentRoutes)

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message, statusCode: err.statusCode } })
      return
    }

    if (err instanceof ZodError) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Os dados enviados são inválidos', statusCode: 422, details: err.errors } })
      return
    }

    logger.error(err, 'Unhandled error')
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno no servidor', statusCode: 500 } })
  })

  return app
}
