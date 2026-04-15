import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as service from './document.service'

function serializeDocument(doc: {
  id: string
  title: string
  owner_id?: string
  created_at?: Date
  updated_at?: Date
  role?: string
  activeCollaborators?: number
}) {
  return {
    id: doc.id,
    title: doc.title,
    ownerId: doc.owner_id,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    role: doc.role ?? 'owner',
    activeCollaborators: doc.activeCollaborators ?? 0,
  }
}

function serializeCollaborator(collaborator: {
  id: string
  name: string
  email: string
  role: string
}) {
  return {
    id: collaborator.id,
    name: collaborator.name,
    email: collaborator.email,
    role: collaborator.role,
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1
    const limit = Math.min(Number(req.query.limit) || 20, 100)
    const result = await service.list(req.user!.id, page, limit)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await service.verifyCollaborativeAccess(req.params.id, req.user!.id)
    res.json(serializeDocument(doc))
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await service.create(req.user!.id)
    res.status(201).json(serializeDocument(doc))
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { title } = z.object({ title: z.string().min(1).max(500) }).parse(req.body)
    const doc = await service.rename(req.params.id, title, req.user!.id)
    res.json(serializeDocument(doc))
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function listCollaborators(req: Request, res: Response, next: NextFunction) {
  try {
    const collaborators = await service.listCollaborators(req.params.id, req.user!.id)
    res.json(collaborators.map(serializeCollaborator))
  } catch (err) {
    next(err)
  }
}

export async function addCollaborator(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body)
    const collaborators = await service.shareWithCollaborator(req.params.id, email, req.user!.id)
    res.status(201).json(collaborators.map(serializeCollaborator))
  } catch (err) {
    next(err)
  }
}

export async function deleteCollaborator(req: Request, res: Response, next: NextFunction) {
  try {
    const collaborators = await service.removeCollaborator(req.params.id, req.params.userId, req.user!.id)
    res.json(collaborators.map(serializeCollaborator))
  } catch (err) {
    next(err)
  }
}
