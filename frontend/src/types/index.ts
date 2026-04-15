export interface User {
  id: string
  email: string
  name: string
}

export interface Document {
  id: string
  title: string
  ownerId: string
  createdAt: string
  updatedAt: string
  role: 'owner' | 'editor'
  activeCollaborators: number
}

export interface Collaborator {
  id: string
  name: string
  email: string
  role: 'owner' | 'editor'
}

export interface PresenceUser {
  userId: string
  name: string
  color: string
  socketId: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    statusCode: number
  }
}

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error'
export type ConnectionStatus = 'connected' | 'connecting' | 'offline'
