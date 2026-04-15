import { Errors } from '../../shared/errors'
import { publishDocumentAccessRevoked } from '../collaboration/collaboration.events'
import * as presence from '../collaboration/presence.service'
import * as repo from './document.repository'

export async function list(userId: string, page = 1, limit = 20) {
  const { rows, total } = await repo.findAccessibleByUser(userId, page, limit)
  const counts = await presence.getCounts(rows.map(row => row.id))

  return {
    data: rows.map(row => ({
      id: row.id,
      title: row.title,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      role: row.role,
      activeCollaborators: counts.get(row.id) ?? 0,
    })),
    pagination: { page, limit, total },
  }
}

export async function create(userId: string) {
  return repo.create(userId)
}

export async function rename(id: string, title: string, userId: string) {
  await verifyOwnerAccess(id, userId)
  return repo.updateTitle(id, title)
}

export async function remove(id: string, userId: string) {
  await verifyOwnerAccess(id, userId)
  await repo.remove(id)
}

export async function listCollaborators(id: string, userId: string) {
  await verifyOwnerAccess(id, userId)
  return repo.listCollaborators(id)
}

export async function shareWithCollaborator(id: string, email: string, userId: string) {
  const doc = await verifyOwnerAccess(id, userId)
  const collaborator = await repo.findUserByEmail(email)

  if (!collaborator) {
    throw Errors.NotFound('Usuário não encontrado')
  }

  if (collaborator.id === doc.owner_id) {
    throw Errors.BadRequest('O dono do documento já possui acesso')
  }

  await repo.addCollaborator(id, collaborator.id, userId)
  return repo.listCollaborators(id)
}

export async function removeCollaborator(id: string, collaboratorId: string, userId: string) {
  const doc = await verifyOwnerAccess(id, userId)

  if (doc.owner_id === collaboratorId) {
    throw Errors.BadRequest('O acesso do dono não pode ser removido')
  }

  const removed = await repo.removeCollaborator(id, collaboratorId)
  if (!removed) {
    throw Errors.NotFound('Colaborador não encontrado')
  }

  await publishDocumentAccessRevoked(id, collaboratorId)
  return repo.listCollaborators(id)
}

export async function verifyCollaborativeAccess(id: string, userId: string) {
  const doc = await repo.findAccessibleById(id, userId)
  if (!doc) throw Errors.Forbidden()
  return doc
}

export async function verifyOwnerAccess(id: string, userId: string) {
  const doc = await verifyCollaborativeAccess(id, userId)
  if (doc.owner_id !== userId) throw Errors.Forbidden()
  return doc
}
