import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { User } from '@/types'
import { disconnectSocket } from '@/services/socket'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await axios.post('/api/v1/auth/login', { email, password })
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true })
      },

      register: async (email, name, password) => {
        const { data } = await axios.post('/api/v1/auth/register', { email, name, password })
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true })
      },

      logout: () => {
        const { refreshToken } = get()
        if (refreshToken) {
          axios.post('/api/v1/auth/logout', { refreshToken }).catch(() => {})
        }
        disconnectSocket()
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      refreshSession: async () => {
        const { refreshToken } = get()
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
