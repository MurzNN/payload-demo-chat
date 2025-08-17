import { handleWebSocketConnection } from '@/utils/websocket'
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
  server: WebSocketServer,
  args: any,
) {
  return handleWebSocketConnection(client, _request, server, args)
}
