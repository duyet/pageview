import { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer, Socket } from 'net'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export interface RealtimeMetrics {
  totalViews: number
  uniqueVisitors: number
  activePages: Array<{
    path: string
    views: number
  }>
  recentCountries: Array<{
    country: string
    count: number
  }>
  hourlyViews: Array<{
    hour: string
    views: number
  }>
}
