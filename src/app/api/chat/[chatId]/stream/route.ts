import { getContainer } from '@/container'
import { NextRequest } from 'next/server'

// Store active connections for real-time updates
const chatConnections = new Map<string, Set<WritableStreamDefaultWriter>>()

export async function GET(request: NextRequest, { params }: { params: { chatId: string } }) {
  const { chatId } = params

  if (!chatId) {
    return new Response('Chat ID required', { status: 400 })
  }

  const encoder = new TextEncoder()
  let writer: WritableStreamDefaultWriter

  const stream = new ReadableStream({
    start(controller) {
      writer = controller.getWriter()

      // Add this connection to the chat room
      if (!chatConnections.has(chatId)) {
        chatConnections.set(chatId, new Set())
      }
      chatConnections.get(chatId)!.add(writer)

      // Send initial connection message
      const welcomeMessage = {
        type: 'connected',
        chatId,
        timestamp: new Date().toISOString(),
      }

      writer.write(encoder.encode(`data: ${JSON.stringify(welcomeMessage)}\n\n`))

      // Send keepalive every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          writer.write(encoder.encode(': keepalive\n\n'))
        } catch (error) {
          clearInterval(keepAlive)
        }
      }, 30000)

      // Cleanup function
      const cleanup = () => {
        clearInterval(keepAlive)
        const connections = chatConnections.get(chatId)
        if (connections) {
          connections.delete(writer)
          if (connections.size === 0) {
            chatConnections.delete(chatId)
          }
        }
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup)
    },

    cancel() {
      // Cleanup when stream is cancelled
      const connections = chatConnections.get(chatId)
      if (connections) {
        connections.delete(writer)
        if (connections.size === 0) {
          chatConnections.delete(chatId)
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// Function to broadcast message to all connections in a chat
export function broadcastToChat(chatId: string, data: any) {
  const connections = chatConnections.get(chatId)
  if (!connections || connections.size === 0) {
    return
  }

  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify(data)}\n\n`
  const encodedMessage = encoder.encode(message)

  // Send to all active connections
  const deadConnections: WritableStreamDefaultWriter[] = []

  connections.forEach((writer) => {
    try {
      writer.write(encodedMessage)
    } catch (error) {
      // Connection is dead, mark for removal
      deadConnections.push(writer)
    }
  })

  // Clean up dead connections
  deadConnections.forEach((writer) => {
    connections.delete(writer)
  })

  // Remove chat room if no connections left
  if (connections.size === 0) {
    chatConnections.delete(chatId)
  }
}
