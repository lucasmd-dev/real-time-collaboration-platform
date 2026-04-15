import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { UserPayload } from './auth.service'

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Não autorizado', statusCode: 401 } })
    return
  }

  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, env.JWT_SECRET) as UserPayload
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Não autorizado', statusCode: 401 } })
  }
}
