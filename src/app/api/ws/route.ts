import { headers as getHeaders } from 'next/headers.js'
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
  // Detect the current user from the Payload session.

  // Issue #1: If I add async to the SOCKET function (to use getPayload), it starts to
  // drop the websocket connection.

  // Issue #2: I can't get the HTTP headers to check the auth:
  // getHeaders().then(async (headers) => {
  //   console.log('WebSocket headers:', headers)
  // })
  // Error: `headers` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context
  //   at headers (../../../src/server/request/headers.ts:132:47)
  //   at SOCKET (src/app/api/ws/route.ts:22:12)

  return handleWebSocketConnection({
    client,
    request,
    server,
    userId: payloadUserId,
  })
}
