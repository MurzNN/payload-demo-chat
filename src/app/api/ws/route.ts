import type { WebSocket, WebSocketServer } from 'ws'
import type { IncomingMessage } from 'node:http'

export function GET() {
  const headers = new Headers()
  headers.set('Connection', 'Upgrade')
  headers.set('Upgrade', 'websocket')
  return new Response('Upgrade Required', { status: 426, headers })
}

export function SOCKET(
  client: WebSocket,
  _request: IncomingMessage,
  _server: WebSocketServer,
  _context: { params: Record<string, string | string[]> },
) {
  console.log('🚀 WebSocket connection established')
  
  client.on('message', (message) => {
    console.log('📨 Received message:', message.toString())
    client.send(`Echo: ${message}`)
  })

  client.on('close', () => {
    console.log('👋 WebSocket connection closed')
  })

  client.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })
}

