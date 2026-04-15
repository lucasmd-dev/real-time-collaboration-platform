process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.DATABASE_URL = 'postgresql://rtcp:rtcp_dev@localhost:5432/rtcp'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters'
process.env.JWT_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.CORS_ORIGIN = 'http://localhost:5173'

import { Errors } from '../../shared/errors'
import * as service from './document.service'
import * as repo from './document.repository'
import * as presence from '../collaboration/presence.service'
import * as collaborationEvents from '../collaboration/collaboration.events'

jest.mock('./document.repository')
jest.mock('../collaboration/presence.service')
jest.mock('../collaboration/collaboration.events')

describe('document.service', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists owned and shared documents with collaborator counts', async () => {
    ;(repo.findAccessibleByUser as jest.Mock).mockResolvedValue({
      rows: [
        {
          id: 'doc-1',
          title: 'Owned doc',
          owner_id: 'user-1',
          created_at: new Date('2026-01-01T00:00:00.000Z'),
          updated_at: new Date('2026-01-02T00:00:00.000Z'),
          role: 'owner',
        },
        {
          id: 'doc-2',
          title: 'Shared doc',
          owner_id: 'user-2',
          created_at: new Date('2026-01-03T00:00:00.000Z'),
          updated_at: new Date('2026-01-04T00:00:00.000Z'),
          role: 'editor',
        },
      ],
      total: 2,
    })
    ;(presence.getCounts as jest.Mock).mockResolvedValue(new Map([
      ['doc-1', 1],
      ['doc-2', 3],
    ]))

    const result = await service.list('user-1')

    expect(result.data).toEqual([
      expect.objectContaining({ id: 'doc-1', role: 'owner', activeCollaborators: 1 }),
      expect.objectContaining({ id: 'doc-2', role: 'editor', activeCollaborators: 3 }),
    ])
    expect(result.pagination.total).toBe(2)
  })

  it('shares a document only with existing non-owner users', async () => {
    ;(repo.findAccessibleById as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      owner_id: 'owner-1',
      role: 'owner',
    })
    ;(repo.findUserByEmail as jest.Mock).mockResolvedValue({
      id: 'user-2',
      email: 'user-2@example.com',
      name: 'User Two',
    })
    ;(repo.listCollaborators as jest.Mock).mockResolvedValue([
      { id: 'owner-1', role: 'owner' },
      { id: 'user-2', role: 'editor' },
    ])

    const collaborators = await service.shareWithCollaborator('doc-1', 'user-2@example.com', 'owner-1')

    expect(repo.addCollaborator).toHaveBeenCalledWith('doc-1', 'user-2', 'owner-1')
    expect(collaborators).toHaveLength(2)
  })

  it('allows only the owner to list collaborators', async () => {
    ;(repo.findAccessibleById as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      owner_id: 'owner-1',
      role: 'editor',
    })

    await expect(service.listCollaborators('doc-1', 'editor-1')).rejects.toEqual(Errors.Forbidden())
  })

  it('publishes an access revocation when a collaborator is removed', async () => {
    ;(repo.findAccessibleById as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      owner_id: 'owner-1',
      role: 'owner',
    })
    ;(repo.removeCollaborator as jest.Mock).mockResolvedValue(true)
    ;(repo.listCollaborators as jest.Mock).mockResolvedValue([{ id: 'owner-1', role: 'owner' }])

    await service.removeCollaborator('doc-1', 'user-2', 'owner-1')

    expect(collaborationEvents.publishDocumentAccessRevoked).toHaveBeenCalledWith('doc-1', 'user-2')
  })

  it('rejects access when the user is not part of the document', async () => {
    ;(repo.findAccessibleById as jest.Mock).mockResolvedValue(null)

    await expect(service.verifyCollaborativeAccess('doc-1', 'user-9')).rejects.toEqual(Errors.Forbidden())
  })
})
