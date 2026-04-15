import { create } from 'zustand'
import { Document } from '@/types'
import api from '@/services/api'

interface DocumentState {
  documents: Document[]
  loading: boolean
  fetch: () => Promise<void>
  create: () => Promise<Document>
  rename: (id: string, title: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/documents')
      set({ documents: data.data })
    } finally {
      set({ loading: false })
    }
  },

  create: async () => {
    const { data } = await api.post('/documents')
    const doc: Document = {
      id: data.id,
      title: data.title,
      ownerId: data.ownerId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      role: data.role ?? 'owner',
      activeCollaborators: data.activeCollaborators ?? 0,
    }
    set({ documents: [doc, ...get().documents] })
    return doc
  },

  rename: async (id, title) => {
    const { data } = await api.patch(`/documents/${id}`, { title })
    set({
      documents: get().documents.map(d => d.id === id ? { ...d, title: data.title, updatedAt: data.updatedAt ?? d.updatedAt, role: data.role ?? d.role } : d),
    })
  },

  remove: async (id) => {
    await api.delete(`/documents/${id}`)
    set({ documents: get().documents.filter(d => d.id !== id) })
  },
}))
