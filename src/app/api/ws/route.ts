import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export function GET() {
  const headers = new Headers()
  headers.set('Connection', 'Upgrade')
  headers.set('Upgrade', 'websocket')
  return new Response('Upgrade Required', { status: 426, headers })
}

export async function UPGRADE(
  client: import('ws').WebSocket,
  server: import('ws').WebSocketServer,
  request: import('next/server').NextRequest,
  context: import('next-ws/server').RouteContext<'/api/ws'>,
) {
  await headers()
  const payload = await getPayload({ config }) // HERE IS THE PROBLEM!!!
}
