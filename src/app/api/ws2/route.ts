import { NextRequest } from 'next/server'
import * as ws from 'ws'

export const dynamic = 'force-dynamic' // Ensures the handler runs on Node.js

export const GET = async (req: NextRequest): Promise<Response> => {
  console.log('req ws2')
  // Check if it's an upgrade request (optional, req.upgrade handles this implicitly)
  if (
    req.headers.get('connection')?.toLowerCase() === 'upgrade' &&
    req.headers.get('upgrade')?.toLowerCase() === 'websocket'
  ) {
    console.log('req ws2 upgrade')
    req.upgrade((request, socket) => {
      console.log('req ws2 upgrade2')
      const server = new ws.WebSocketServer({ noServer: true })
      server.handleUpgrade(request, socket, Buffer.alloc(0), (websocket) => {
        // Handle the WebSocket connection here
        console.log('WebSocket connection established!')
        websocket.send('Welcome to the WebSocket server!')

        websocket.on('message', (message) => {
          console.log(`Received: ${message}`)
          websocket.send(`Echo: ${message}`)
        })

        websocket.on('close', () => {
          console.log('WebSocket connection closed.')
        })
      })
    })

    // Return a response indicating the upgrade is being handled
    return new Response(null, {
      status: 101,
      headers: { Upgrade: 'websocket', Connection: 'Upgrade' },
    })
  }

  // Handle regular GET requests if not an upgrade
  return new Response('Not a WebSocket upgrade request.', { status: 200 })
}
