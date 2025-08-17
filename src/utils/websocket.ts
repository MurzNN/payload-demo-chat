import { getContainer } from '@/container'
import type { WebSocket, WebSocketServer } from 'ws'
import type { IncomingMessage } from 'node:http'
import type { WSMessage } from '@/types/chat'
import { WebSocketManager } from '../services/websocket-manager'

// Get the WebSocket manager instance
const wsManager = WebSocketManager.getInstance()

export function handleWebSocketConnection({
  client,
  request,
  server,
  userId,
  userName,
}: {
  client: WebSocket
  request: IncomingMessage
  server: WebSocketServer
  userId: string | null
  userName?: string
}) {
  if (userId) {
    console.log(`✅ WebSocket connection from authenticated user ${userId} (${userName || 'Unknown'})`)
  } else {
    console.log('⚠️ WebSocket connection from unauthenticated user')
  }

  // Register the server with the manager if not already done
  wsManager.setServer(server)

  // Handle incoming messages
  client.on('message', async (message: Buffer) => {
    try {
      console.log('Received message:', message.toString())
      const parsedMessage: WSMessage = JSON.parse(message.toString())

      switch (parsedMessage.type) {
        case 'subscribe':
          if (parsedMessage.chatId) {
            wsManager.addSubscription(parsedMessage.chatId, client)
            console.log(`Client ${userId || 'anonymous'} subscribed to chat: ${parsedMessage.chatId}`)

            // Notify other clients in the chat
            wsManager.broadcastToChat(
              parsedMessage.chatId,
              {
                type: 'system_message',
                chatId: parsedMessage.chatId,
                userName: 'System',
                content: `${userName || 'A user'} joined the chat`,
                createdAt: new Date().toISOString(),
              },
              client,
            )

            // Send welcome message to the new client
            client.send(
              JSON.stringify({
                type: 'system_message',
                chatId: parsedMessage.chatId,
                userName: 'System',
                content: `Welcome to the chat! There are ${wsManager.getChatSubscriberCount(parsedMessage.chatId) - 1} other users online`,
                createdAt: new Date().toISOString(),
              }),
            )
          }
          break

        case 'unsubscribe':
          if (parsedMessage.chatId) {
            wsManager.removeSubscription(parsedMessage.chatId, client)
            console.log(`Client ${userId || 'anonymous'} unsubscribed from chat: ${parsedMessage.chatId}`)

            // Notify other clients in the chat
            wsManager.broadcastToChat(
              parsedMessage.chatId,
              {
                type: 'system_message',
                chatId: parsedMessage.chatId,
                userName: 'System',
                content: `${userName || 'A user'} left the chat`,
                createdAt: new Date().toISOString(),
              },
              client,
            )
          }
          break

        case 'chat_message':
          if (parsedMessage.chatId && parsedMessage.content) {
            console.log(`Processing chat message from user ${userId || 'anonymous'} for chat: ${parsedMessage.chatId}`)

            // Save message to database using authenticated user info
            const container = await getContainer()
            const chatController = await container.cradle.getChatController({
              chatId: parsedMessage.chatId,
              userId: userId, // Use authenticated userId
            })
            await chatController.postMessage(parsedMessage.content)

            // Prepare message for broadcasting with authenticated user info
            const messageToSend: WSMessage = {
              type: 'chat_message',
              chatId: parsedMessage.chatId,
              userId: userId || undefined, // Convert null to undefined for type compatibility
              userName: userName || parsedMessage.userName || 'Anonymous User',
              content: parsedMessage.content,
              createdAt: new Date().toISOString(),
            }

            // Send confirmation back to sender
            client.send(JSON.stringify(messageToSend))

            // Broadcast the message to all other clients in the chat
            wsManager.broadcastToChat(parsedMessage.chatId, messageToSend, client)
          }
          break

        default:
          console.warn('Unknown message type:', parsedMessage.type)
      }
    } catch (error) {
      console.error('Error processing message:', error)
      client.send(
        JSON.stringify({
          type: 'system_message',
          userName: 'System',
          content: 'Error processing your message',
          timestamp: new Date().toISOString(),
        }),
      )
    }
  })

  // Handle client disconnect
  client.on('close', () => {
    console.log('Client disconnected')
    wsManager.removeClientFromAllChats(client)
  })

  // Return cleanup function for when client disconnects
  return () => {
    console.log('Cleaning up client connection')
    wsManager.removeClientFromAllChats(client)
  }
}
