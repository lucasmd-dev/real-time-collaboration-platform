import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as authService from './auth.service'

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
})

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name, password } = registerSchema.parse(req.body)
    const result = await authService.register(email, name, password)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body)
    const tokens = await authService.refreshTokens(refreshToken)
    res.json(tokens)
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body)
    await authService.logout(refreshToken)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
