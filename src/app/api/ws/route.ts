import { validateWebSocketAuth } from '@/middleware/websocket-auth'
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
  request: IncomingMessage,
  server: WebSocketServer,
  _context: { params: Record<string, string | string[]> },
) {
  const mockRequest = {
    headers: request.headers as Record<string, string>,
    cookies: parseCookies(request.headers.cookie || ''),
    url: request.url || '',
  }

  validateWebSocketAuth(mockRequest)
    .then(({ user, success }) => {
      const userId = user?.id?.toString() || null
      const userName = user?.name || user?.email || 'Anonymous'

      if (success) {
        console.log(`✅ WebSocket connection established for authenticated user: ${userId} (${userName})`)
      } else {
        console.log('⚠️ WebSocket connection established for anonymous user')
      }

      return handleWebSocketConnection({
        client,
        request,
        server,
        userId,
        userName,
      })
    })
    .catch((error) => {
      console.error('❌ WebSocket authentication failed:', error)
      return handleWebSocketConnection({
        client,
        request,
        server,
        userId: null,
        userName: 'Anonymous',
      })
    })
}

function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  if (!cookieString) return cookies

  cookieString.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })

  return cookies
}

