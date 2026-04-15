import { Router } from 'express'
import * as ctrl from './auth.controller'

const router = Router()

router.post('/register', ctrl.register)
router.post('/login', ctrl.login)
router.post('/refresh', ctrl.refresh)
router.post('/logout', ctrl.logout)

export default router
