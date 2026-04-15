import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { Socket } from 'socket.io-client'
import { SocketIOProvider } from './SocketIOProvider'

type SocketPayload = {
  documentId?: string
  update?: number[]
}

type SocketHandler = (payload?: SocketPayload) => void

function createSocketMock(connected: boolean) {
  const listeners = new Map<string, Set<SocketHandler>>()
  const emitted: Array<{ event: string; payload?: SocketPayload }> = []

  const socket = {
    connected,
    auth: {},
    emitted,
    on(event: string, handler: SocketHandler) {
      const current = listeners.get(event) ?? new Set<SocketHandler>()
      current.add(handler)
      listeners.set(event, current)
      return this
    },
    off(event: string, handler?: SocketHandler) {
      if (!handler) {
        listeners.delete(event)
        return this
      }

      listeners.get(event)?.delete(handler)
      return this
    },
    emit(event: string, payload?: SocketPayload) {
      emitted.push({ event, payload })
      listeners.get(event)?.forEach(listener => listener(payload))
      return true
    },
    trigger(event: string, payload?: SocketPayload) {
      listeners.get(event)?.forEach(listener => listener(payload))
    },
  }

  return socket as unknown as Socket & {
    emitted: Array<{ event: string; payload?: SocketPayload }>
    trigger: (event: string, payload?: SocketPayload) => void
    connected: boolean
  }
}

describe('SocketIOProvider', () => {
  it('nao reenfileira updates remotos para o servidor', () => {
    const socket = createSocketMock(true)
    const localDoc = new Y.Doc()
    const remoteDoc = new Y.Doc()
    const provider = new SocketIOProvider(localDoc, socket, 'doc-1')

    remoteDoc.getText('default').insert(0, 'Ola')
    const update = Y.encodeStateAsUpdate(remoteDoc)

    socket.trigger('document:operation', {
      documentId: 'doc-1',
      update: Array.from(update),
    })

    expect(localDoc.getText('default').toString()).toBe('Ola')
    expect(socket.emitted.filter(event => event.event === 'document:operation')).toHaveLength(0)

    provider.destroy()
    localDoc.destroy()
    remoteDoc.destroy()
  })

  it('envia updates pendentes ao reconectar', () => {
    const socket = createSocketMock(false)
    const doc = new Y.Doc()
    const provider = new SocketIOProvider(doc, socket, 'doc-2')

    doc.getText('default').insert(0, 'Sync')

    expect(socket.emitted.filter(event => event.event === 'document:operation')).toHaveLength(0)

    socket.connected = true
    socket.trigger('connect')

    expect(socket.emitted.some(event => event.event === 'document:sync_request')).toBe(true)
    expect(socket.emitted.filter(event => event.event === 'document:operation')).toHaveLength(1)

    provider.destroy()
    doc.destroy()
  })
})
