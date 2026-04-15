import * as Y from 'yjs'
import { logger } from '../../shared/logger'
import { findById, updateYdocState } from '../documents/document.repository'

interface ManagedDoc {
  doc: Y.Doc
  dirty: boolean
  persistTimer: ReturnType<typeof setTimeout> | null
  unloadTimer: ReturnType<typeof setTimeout> | null
  activeUsers: Set<string>
}

class YDocManager {
  private docs = new Map<string, ManagedDoc>()

  private createManaged(documentId: string, initialState?: Uint8Array, activeUsers = new Set<string>()) {
    const doc = new Y.Doc()

    if (initialState) {
      Y.applyUpdate(doc, initialState)
    }

    const managed: ManagedDoc = {
      doc,
      dirty: false,
      persistTimer: null,
      unloadTimer: null,
      activeUsers,
    }

    doc.on('update', () => {
      managed.dirty = true
      this.schedulePersist(documentId, managed)
    })

    return managed
  }

  async getOrLoad(documentId: string): Promise<Y.Doc> {
    const existing = this.docs.get(documentId)
    if (existing) return existing.doc

    const record = await findById(documentId)
    const initialState = record?.ydoc_state ? new Uint8Array(record.ydoc_state) : undefined
    const managed = this.createManaged(documentId, initialState)

    this.docs.set(documentId, managed)
    logger.debug({ documentId }, 'Y.Doc loaded into memory')
    return managed.doc
  }

  addUser(documentId: string, userId: string) {
    const managed = this.docs.get(documentId)
    if (!managed) return

    if (managed.unloadTimer) {
      clearTimeout(managed.unloadTimer)
      managed.unloadTimer = null
    }

    managed.activeUsers.add(userId)
  }

  removeUser(documentId: string, userId: string) {
    const managed = this.docs.get(documentId)
    if (!managed) return

    managed.activeUsers.delete(userId)

    if (managed.activeUsers.size === 0) {
      this.scheduleUnload(documentId, managed)
    }
  }

  private schedulePersist(documentId: string, managed: ManagedDoc) {
    if (managed.persistTimer) clearTimeout(managed.persistTimer)
    managed.persistTimer = setTimeout(async () => {
      if (!managed.dirty) return
      const state = Y.encodeStateAsUpdate(managed.doc)
      await updateYdocState(documentId, state)
      managed.dirty = false
      logger.debug({ documentId }, 'Y.Doc persisted')
    }, 2_000)
  }

  private scheduleUnload(documentId: string, managed: ManagedDoc) {
    if (managed.unloadTimer) clearTimeout(managed.unloadTimer)

    managed.unloadTimer = setTimeout(async () => {
      const current = this.docs.get(documentId)
      if (!current || current.activeUsers.size > 0) return

      if (current.dirty) {
        const state = Y.encodeStateAsUpdate(current.doc)
        await updateYdocState(documentId, state)
      }

      if (current.persistTimer) clearTimeout(current.persistTimer)
      if (current.unloadTimer) clearTimeout(current.unloadTimer)

      this.docs.delete(documentId)
      current.doc.destroy()
      logger.debug({ documentId }, 'Y.Doc unloaded from memory')
    }, 30_000)
  }
}

export const ydocManager = new YDocManager()
