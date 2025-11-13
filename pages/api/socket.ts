/**
 * Socket.io Connection Endpoint
 * Initializes the WebSocket server for real-time updates
 */

import { NextApiRequest } from 'next'
import { getSocketServer, type NextApiResponseServerIO } from '@/lib/socket/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method === 'GET' || req.method === 'POST') {
    // Initialize Socket.io server (singleton)
    const io = getSocketServer(res)

    // Send connection info
    res.status(200).json({
      success: true,
      message: 'Socket.io server initialized',
      path: '/api/socket',
      connected: io.sockets.sockets.size,
    })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
