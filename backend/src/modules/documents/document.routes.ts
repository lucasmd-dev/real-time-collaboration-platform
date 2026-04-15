import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware'
import * as ctrl from './document.controller'

const router = Router()

router.use(authenticate)

router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.get('/:id', ctrl.getOne)
router.patch('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)
router.get('/:id/collaborators', ctrl.listCollaborators)
router.post('/:id/collaborators', ctrl.addCollaborator)
router.delete('/:id/collaborators/:userId', ctrl.deleteCollaborator)

export default router
