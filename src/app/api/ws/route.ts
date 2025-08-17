import { handleWebSocketConnection } from '@/utils/websocket'
import type { WebSocket, WebSocketServer } from 'ws'
import type { IncomingMessage } from 'node:http'

export function GET() {
  const headers = new Headers()
  headers.set('Connection', 'Upgrade')
  headers.set('Upgrade', 'websocket')
  return new Response('Upgrade Required', { status: 426, headers })
}

export function SOCKET(client: WebSocket, request: IncomingMessage, server: WebSocketServer) {
  const payloadUserId = '0'
  // @todo Detect the current user from the Payload session.
  return handleWebSocketConnection({
    client,
    request,
    server,
    userId: payloadUserId,
  })
}
