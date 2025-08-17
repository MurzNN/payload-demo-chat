import { getPayload, Payload } from 'payload'
import config from '@payload-config'
import { User } from '@/payload-types'

export interface WebSocketAuthResult {
  user: User | null
  payload: Payload | null
  success: boolean
}

export async function validateWebSocketAuth(request: {
  headers: Headers | Record<string, string>
  cookies?: Record<string, string>
  url?: string
}): Promise<WebSocketAuthResult> {
  try {
    // Handle different header types properly
    let headers: Headers
    if (request.headers instanceof Headers) {
      headers = request.headers
    } else {
      headers = new Headers()
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.set(key, value)
      })
    }

    const mockRequest = {
      headers,
      cookies: request.cookies || {},
      url: request.url || '',
    }

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: mockRequest.headers })

    return {
      user,
      payload,
      success: !!user,
    }
  } catch (error) {
    console.error('WebSocket auth validation failed:', error)
    return {
      user: null,
      payload: null,
      success: false,
    }
  }
}
