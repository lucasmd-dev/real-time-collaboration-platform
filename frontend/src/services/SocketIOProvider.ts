import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import * as awarenessProtocol from 'y-protocols/awareness'
import { Socket } from 'socket.io-client'
import { ConnectionStatus } from '@/types'

type StatusCallback = (status: ConnectionStatus) => void

export class SocketIOProvider {
  readonly doc: Y.Doc
  readonly awareness: Awareness
  private socket: Socket
  private documentId: string
  private statusCallbacks: StatusCallback[] = []
  private pendingUpdates: number[][] = []
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null

  private readonly handleDocumentOperation = ({ documentId, update }: { documentId: string; update: number[] }) => {
    if (documentId !== this.documentId) return
    Y.applyUpdate(this.doc, new Uint8Array(update), 'remote')
  }

  private readonly handleSyncResponse = ({ documentId, update }: { documentId: string; update: number[] }) => {
    if (documentId !== this.documentId) return
    Y.applyUpdate(this.doc, new Uint8Array(update), 'remote')
  }

  private readonly handlePresenceUpdate = ({ documentId, awareness }: { documentId: string; awareness: number[] }) => {
    if (documentId !== this.documentId) return
    awarenessProtocol.applyAwarenessUpdate(this.awareness, new Uint8Array(awareness), 'remote')
  }

  private readonly handleConnect = () => {
    this.notifyStatus('connected')
    this.startHeartbeat()
    this.syncAfterReconnect()
  }

  private readonly handleDisconnect = () => {
    this.stopHeartbeat()
    this.notifyStatus('offline')
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      [...this.awareness.getStates().keys()].filter(id => id !== this.doc.clientID),
      'disconnect',
    )
  }

  private readonly handleConnecting = () => {
    this.notifyStatus('connecting')
  }

  constructor(doc: Y.Doc, socket: Socket, documentId: string) {
    this.doc = doc
    this.socket = socket
    this.documentId = documentId
    this.awareness = new Awareness(doc)

    this.setupDocumentSync()
    this.setupPresenceSync()
    this.setupConnectionHandlers()

    if (this.socket.connected) {
      this.startHeartbeat()
    }
  }

  private setupDocumentSync() {
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || origin === 'server') {
        return
      }

      const updateArray = Array.from(update)
      if (!this.socket.connected) {
        this.pendingUpdates.push(updateArray)
        return
      }
      this.socket.emit('document:operation', {
        documentId: this.documentId,
        update: updateArray,
      })
    })

    this.socket.on('document:operation', this.handleDocumentOperation)
    this.socket.on('document:sync_response', this.handleSyncResponse)
  }

  private setupPresenceSync() {
    this.awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      if (!this.socket.connected) return
      const changedClients = [...added, ...updated, ...removed]
      const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      this.socket.emit('presence:update', {
        documentId: this.documentId,
        awareness: Array.from(update),
      })
    })

    this.socket.on('presence:update', this.handlePresenceUpdate)
  }

  private setupConnectionHandlers() {
    this.socket.on('connect', this.handleConnect)
    this.socket.on('disconnect', this.handleDisconnect)
    this.socket.on('connecting', this.handleConnecting)
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (!this.socket.connected) return
      this.socket.emit('presence:heartbeat', { documentId: this.documentId })
    }, 25_000)
  }

  private stopHeartbeat() {
    if (!this.heartbeatTimer) return
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private syncAfterReconnect() {
    const stateVector = Y.encodeStateVector(this.doc)
    this.socket.emit('document:sync_request', {
      documentId: this.documentId,
      stateVector: Array.from(stateVector),
    })

    while (this.pendingUpdates.length > 0) {
      const update = this.pendingUpdates.shift()!
      this.socket.emit('document:operation', {
        documentId: this.documentId,
        update,
      })
    }
  }

  onStatusChange(cb: StatusCallback) {
    this.statusCallbacks.push(cb)
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(fn => fn !== cb)
    }
  }

  private notifyStatus(status: ConnectionStatus) {
    this.statusCallbacks.forEach(cb => cb(status))
  }

  destroy() {
    this.stopHeartbeat()
    this.awareness.destroy()
    this.socket.off('document:operation', this.handleDocumentOperation)
    this.socket.off('document:sync_response', this.handleSyncResponse)
    this.socket.off('presence:update', this.handlePresenceUpdate)
    this.socket.off('connect', this.handleConnect)
    this.socket.off('disconnect', this.handleDisconnect)
    this.socket.off('connecting', this.handleConnecting)
  }
}
