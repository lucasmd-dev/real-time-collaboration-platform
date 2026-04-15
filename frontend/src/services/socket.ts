import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
    })
  }

  socket.auth = { token }

  if (!socket.connected) {
    socket.connect()
  }

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
