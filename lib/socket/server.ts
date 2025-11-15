/**
 * Socket.io Server Singleton
 * Proper WebSocket server for real-time updates
 */

import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

/**
 * Initialize Socket.io server (singleton pattern)
 */
export function getSocketServer(res: NextApiResponseServerIO): SocketIOServer {
  if (!res.socket.server.io) {
    console.log('[Socket.io] Initializing server...')

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    })

    // Connection handler
    io.on('connection', (socket) => {
      console.log('[Socket.io] Client connected:', socket.id)

      // Handle domain subscription
      socket.on('subscribe:domain', (domain: string) => {
        console.log(`[Socket.io] ${socket.id} subscribed to domain: ${domain}`)
        socket.join(`domain:${domain}`)
      })

      // Handle URL subscription
      socket.on('subscribe:url', (urlId: string) => {
        console.log(`[Socket.io] ${socket.id} subscribed to URL: ${urlId}`)
        socket.join(`url:${urlId}`)
      })

      // Handle unsubscribe
      socket.on('unsubscribe', (room: string) => {
        console.log(`[Socket.io] ${socket.id} unsubscribed from: ${room}`)
        socket.leave(room)
      })

      // Disconnection handler
      socket.on('disconnect', () => {
        console.log('[Socket.io] Client disconnected:', socket.id)
      })
    })

    res.socket.server.io = io
  }

  return res.socket.server.io
}

/**
 * Emit pageview event to all connected clients
 */
export function emitPageview(
  io: SocketIOServer,
  data: {
    domain: string
    url: string
    urlId: number
    country?: string
    browser?: string
  }
) {
  // Emit to domain subscribers
  io.to(`domain:${data.domain}`).emit('pageview', {
    url: data.url,
    urlId: data.urlId,
    country: data.country,
    browser: data.browser,
    timestamp: new Date().toISOString(),
  })

  // Emit to URL subscribers
  io.to(`url:${data.urlId}`).emit('pageview', {
    url: data.url,
    country: data.country,
    browser: data.browser,
    timestamp: new Date().toISOString(),
  })

  // Emit global event
  io.emit('pageview:global', {
    domain: data.domain,
    url: data.url,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Emit metrics update
 */
export function emitMetricsUpdate(
  io: SocketIOServer,
  metrics: {
    activeVisitors: number
    pageviewsLast24h: number
  }
) {
  io.emit('metrics:update', metrics)
}
