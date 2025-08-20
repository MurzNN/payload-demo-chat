import { getContainer } from '@/container'
import config from '@payload-config'
import type { IncomingMessage } from 'node:http'
import { AuthResult } from 'node_modules/payload/dist/auth/operations/auth'
import { getPayload } from 'payload'

export function GET() {
  const headers = new Headers()
  headers.set('Connection', 'Upgrade')
  headers.set('Upgrade', 'websocket')
  return new Response('Upgrade Required', { status: 426, headers })
}

export function SOCKET(
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
  context: { params: Record<string, string | string[]> },
) {
  payloadAuthByHttpRequest(request).then(async ({ user }) => {
    const container = await getContainer()
    container.cradle.webSocketManager.handleConnection({
      client,
      request,
      server,
      user,
    })
  })
}

async function payloadAuthByHttpRequest(request: IncomingMessage): Promise<AuthResult> {
  // We need to convert Node.js headers to the Next.js headers format.
  const headers = new Headers()
  Object.entries(request.headers).forEach(([key, value]) => {
    headers.set(key, value as string)
  })
  const payload = await getPayload({ config })
  const authResult = await payload.auth({
    canSetHeaders: false,
    headers,
  })
  return authResult
}
