import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { Socket } from 'socket.io-client'
import { SocketIOProvider } from '@/services/SocketIOProvider'
import { ConnectionStatus, PresenceUser, SaveStatus } from '@/types'
import { useAuthStore } from '@/store/authStore'

interface CollaborationState {
  ydoc: Y.Doc | null
  provider: SocketIOProvider | null
  users: PresenceUser[]
  connectionStatus: ConnectionStatus
  saveStatus: SaveStatus
}

export function useCollaboration(documentId: string, socket: Socket) {
  const user = useAuthStore(s => s.user)
  const [state, setState] = useState<CollaborationState>({
    ydoc: null,
    provider: null,
    users: [],
    connectionStatus: 'connecting',
    saveStatus: 'saving',
  })
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const ydoc = new Y.Doc()
    const persistence = new IndexeddbPersistence(`ydoc-${documentId}`, ydoc)
    const provider = new SocketIOProvider(ydoc, socket, documentId)

    const unsubStatus = provider.onStatusChange((status) => {
      setState(s => ({
        ...s,
        connectionStatus: status,
        saveStatus: status === 'offline' ? 'offline' : s.saveStatus === 'offline' ? 'saved' : s.saveStatus,
      }))
    })

    ydoc.on('update', (_update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || origin === 'server') return

      setState(s => ({ ...s, saveStatus: 'saving' }))
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        setState(s => (s.saveStatus === 'saving' ? { ...s, saveStatus: 'saved' } : s))
      }, 2_500)
    })

    if (user) {
      provider.awareness.setLocalStateField('user', {
        name: user.name,
        color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
      })
    }

    const handleDocumentJoined = ({ users, color, initialState }: {
      users: PresenceUser[]
      color: string
      initialState: number[]
    }) => {
      Y.applyUpdate(ydoc, new Uint8Array(initialState), 'server')
      setState(s => ({ ...s, users, connectionStatus: 'connected', saveStatus: 'saved' }))
      if (user) {
        provider.awareness.setLocalStateField('user', { name: user.name, color })
      }
    }

    const handleUserJoined = ({ user: joinedUser }: { user: PresenceUser }) => {
      setState(s => ({
        ...s,
        users: [...s.users.filter(existingUser => existingUser.userId !== joinedUser.userId), joinedUser],
      }))
    }

    const handleUserLeft = ({ userId }: { userId: string }) => {
      setState(s => ({ ...s, users: s.users.filter(u => u.userId !== userId) }))
    }

    socket.on('document:joined', handleDocumentJoined)
    socket.on('user:joined', handleUserJoined)
    socket.on('user:left', handleUserLeft)

    socket.emit('document:join', { documentId })
    setState(s => ({ ...s, ydoc, provider }))

    return () => {
      socket.emit('document:leave', { documentId })
      socket.off('document:joined', handleDocumentJoined)
      socket.off('user:joined', handleUserJoined)
      socket.off('user:left', handleUserLeft)
      unsubStatus()
      provider.destroy()
      persistence.destroy()
      ydoc.destroy()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [documentId, socket, user])

  return state
}
