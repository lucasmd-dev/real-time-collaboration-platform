import * as Y from 'yjs'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { logger } from '../../shared/logger'
import { redis, redisSub } from '../../config/redis'
import { UserPayload } from '../auth/auth.service'
import { collaborationChannels } from './collaboration.events'
import { ydocManager } from './ydoc.manager'
import * as presence from './presence.service'
import { verifyCollaborativeAccess } from '../documents/document.service'

export function setupCollaborationGateway(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token
    if (!token) return next(new Error('Não autorizado'))

    try {
      socket.data.user = jwt.verify(token as string, env.JWT_SECRET) as UserPayload
      next()
    } catch {
      next(new Error('Não autorizado'))
    }
  })

  redisSub.psubscribe('doc:*:updates', 'doc:*:awareness', 'doc:*:system')

  redisSub.on('pmessage', (_pattern, channel, message) => {
    const parts = channel.split(':')
    const docId = parts[1]
    const type = parts[2]
    const parsed = JSON.parse(message)

    const room = `doc:${docId}`

    if (type === 'updates') {
      io.to(room).except(parsed.senderSocketId).emit('document:operation', {
        documentId: docId,
        update: parsed.update,
      })
    } else if (type === 'awareness') {
      io.to(room).except(parsed.senderSocketId).emit('presence:update', {
        documentId: docId,
        awareness: parsed.awareness,
      })
    } else if (type === 'system' && parsed.event === 'document:access_revoked') {
      void revokeDocumentAccess(io, docId, parsed.userId)
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as UserPayload
    logger.info({ socketId: socket.id, userId: user.id }, 'Socket connected')

    socket.on('document:join', async ({ documentId }: { documentId: string }) => {
      try {
        const currentDocumentId = socket.data.currentDoc as string | undefined
        if (currentDocumentId && currentDocumentId !== documentId) {
          await handleLeave(socket, currentDocumentId)
        }

        await verifyCollaborativeAccess(documentId, user.id)
        const ydoc = await ydocManager.getOrLoad(documentId)
        await socket.join(`doc:${documentId}`)
        ydocManager.addUser(documentId, socket.id)

        const initialState = Y.encodeStateAsUpdate(ydoc)
        const color = presence.assignColor(user.id)
        const { userAlreadyPresent } = await presence.join(documentId, {
          userId: user.id,
          name: user.name,
          color,
          socketId: socket.id,
        })
        const users = await presence.getAll(documentId)

        socket.emit('document:joined', {
          documentId,
          initialState: Array.from(initialState),
          users,
          color,
        })

        if (!userAlreadyPresent) {
          socket.to(`doc:${documentId}`).emit('user:joined', {
            documentId,
            user: { userId: user.id, name: user.name, color, socketId: socket.id },
          })
        }

        socket.data.currentDoc = documentId
        logger.debug({ userId: user.id, documentId }, 'User joined document')
      } catch (err) {
        logger.error(err, 'Error joining document')
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Não foi possível entrar no documento' })
      }
    })

    socket.on('document:operation', async ({ documentId, update }: { documentId: string; update: number[] }) => {
      try {
        if (!isCurrentDocument(socket, documentId)) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Acesso negado' })
          return
        }

        const ydoc = await ydocManager.getOrLoad(documentId)
        const updateBytes = new Uint8Array(update)
        Y.applyUpdate(ydoc, updateBytes)
        await presence.heartbeat(documentId)

        await redis.publish(collaborationChannels.updates(documentId), JSON.stringify({
          update,
          senderSocketId: socket.id,
        }))
      } catch (err) {
        logger.error(err, 'Error applying operation')
      }
    })

    socket.on('document:sync_request', async ({ documentId, stateVector }: { documentId: string; stateVector: number[] }) => {
      try {
        if (!isCurrentDocument(socket, documentId)) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Acesso negado' })
          return
        }

        const ydoc = await ydocManager.getOrLoad(documentId)
        const sv = new Uint8Array(stateVector)
        const diff = Y.encodeStateAsUpdate(ydoc, sv)

        socket.emit('document:sync_response', {
          documentId,
          update: Array.from(diff),
        })
      } catch (err) {
        logger.error(err, 'Error handling sync request')
      }
    })

    socket.on('presence:update', async ({ documentId, awareness }: { documentId: string; awareness: number[] }) => {
      try {
        if (!isCurrentDocument(socket, documentId)) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Acesso negado' })
          return
        }

        await presence.heartbeat(documentId)

        await redis.publish(collaborationChannels.awareness(documentId), JSON.stringify({
          awareness,
          senderSocketId: socket.id,
        }))
      } catch (err) {
        logger.error(err, 'Error broadcasting awareness')
      }
    })

    socket.on('presence:heartbeat', async ({ documentId }: { documentId: string }) => {
      try {
        if (!isCurrentDocument(socket, documentId)) return
        await presence.heartbeat(documentId)
      } catch (err) {
        logger.error(err, 'Error refreshing presence heartbeat')
      }
    })

    socket.on('document:leave', async ({ documentId }: { documentId: string }) => {
      if (!isCurrentDocument(socket, documentId)) return
      await handleLeave(socket, documentId)
    })

    socket.on('disconnect', async () => {
      const documentId = socket.data.currentDoc
      if (documentId) {
        await handleLeave(socket, documentId)
      }
      logger.info({ socketId: socket.id, userId: user.id }, 'Socket disconnected')
    })
  })
}

function isCurrentDocument(socket: Socket, documentId: string) {
  return socket.data.currentDoc === documentId
}

async function handleLeave(socket: Socket, documentId: string) {
  await socket.leave(`doc:${documentId}`)
  ydocManager.removeUser(documentId, socket.id)

  const { user, userStillPresent } = await presence.leave(documentId, socket.id)
  socket.data.currentDoc = undefined

  if (user && !userStillPresent) {
    socket.to(`doc:${documentId}`).emit('user:left', {
      documentId,
      userId: user.userId,
    })
  }
}

async function revokeDocumentAccess(io: Server, documentId: string, userId: string) {
  const room = `doc:${documentId}`
  const sockets = [...io.of('/').sockets.values()]

  await Promise.all(sockets.map(async (socket) => {
    if (!socket.rooms.has(room) || socket.data.user?.id !== userId) {
      return
    }

    socket.emit('document:access_revoked', { documentId })
    await handleLeave(socket, documentId)
  }))
}
