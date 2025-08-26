import type { WebSocketServer, WebSocket as WSWebSocket } from 'ws'
import type { WSMessage } from '@/types/chat'
import type { IncomingMessage } from 'node:http'
import { getContainer } from '@/container'
import { headers } from 'next/headers'
import { User } from '@/payload-types'

interface WebSocketWithPayloadUser extends WSWebSocket {
  payloadUser?: User | null
}
type WebSocket = WebSocketWithPayloadUser

// Declare global WebSocket manager
declare global {
  var __webSocketManager: WebSocketManager | undefined
}

export class WebSocketManager {
  private server: WebSocketServer | null = null
  private chatSubscriptions = new Map<string, Set<WebSocket>>()

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!globalThis.__webSocketManager) {
      console.log('Creating new WebSocketManager instance')
      globalThis.__webSocketManager = new WebSocketManager()
    } else {
      console.log('Reusing existing WebSocketManager instance')
    }
    return globalThis.__webSocketManager
  }

  setServer(server: WebSocketServer) {
    this.server = server
    console.log('WebSocket server registered with WebSocketManager')
  }

  async handleConnection({
    client,
    server,
    request,
    context,
  }: {
    client: WebSocket
    server: WebSocketServer
    request: IncomingMessage
    context: import('next-ws/server').RouteContext<'/api/ws'>
  }) {
    // Register the server with the manager if not already done
    if (!this.server) {
      this.setServer(server)
    }

    const c = await getContainer()
    const { user } = await c.cradle.payload.auth({ headers: await headers() })
    client = client as WebSocket & { payloadUser: User | null }
    client.payloadUser = user

    // Handle incoming messages
    client.on('message', async (message: Buffer) => {
      try {
        console.log('Received message:', message.toString())
        const parsedMessage: WSMessage = JSON.parse(message.toString())

        switch (parsedMessage.type) {
          case 'subscribe':
            if (parsedMessage.chatId) {
              this.addSubscription(parsedMessage.chatId, client)
              console.log(
                `Client ${user?.id || 'anonymous'} subscribed to chat: ${parsedMessage.chatId}`,
              )

              // Notify other clients in the chat
              this.broadcastToChat(
                parsedMessage.chatId,
                {
                  type: 'system_message',
                  chatId: parsedMessage.chatId,
                  userName: 'System',
                  content: `${user?.name || 'A user'} joined the chat`,
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
                  content: `Welcome to the chat! There are ${this.getChatSubscriberCount(parsedMessage.chatId) - 1} other users online`,
                  createdAt: new Date().toISOString(),
                }),
              )
            }
            break

          case 'unsubscribe':
            if (parsedMessage.chatId) {
              this.removeSubscription(parsedMessage.chatId, client)
              console.log(
                `Client ${user?.id || 'anonymous'} unsubscribed from chat: ${parsedMessage.chatId}`,
              )

              // Notify other clients in the chat
              this.broadcastToChat(
                parsedMessage.chatId,
                {
                  type: 'system_message',
                  chatId: parsedMessage.chatId,
                  userName: 'System',
                  content: `${user?.name || 'A user'} left the chat`,
                  createdAt: new Date().toISOString(),
                },
                client,
              )
            }
            break

          case 'chat_message':
            if (parsedMessage.chatId && parsedMessage.content) {
              console.log(
                `Processing chat message from user ${user?.id || 'anonymous'} for chat: ${parsedMessage.chatId}`,
              )

              // Save message to database using authenticated user info
              const container = await getContainer()
              const chatController = await container.cradle.getChatController({
                chatId: parsedMessage.chatId,
                userId: user?.id, // Use authenticated userId
              })
              await chatController.postMessage(parsedMessage.content)

              // Prepare message for broadcasting with authenticated user info
              const messageToSend: WSMessage = {
                type: 'chat_message',
                chatId: parsedMessage.chatId,
                userId: user?.id || undefined, // Convert null to undefined for type compatibility
                userName: user?.name || parsedMessage.userName || 'Anonymous User',
                content: parsedMessage.content,
                createdAt: new Date().toISOString(),
              }

              // Send confirmation back to sender
              client.send(JSON.stringify(messageToSend))

              // Broadcast the message to all other clients in the chat
              this.broadcastToChat(parsedMessage.chatId, messageToSend, client)
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
      this.removeClientFromAllChats(client)
    })

    // Return cleanup function for when client disconnects
    return () => {
      console.log('Cleaning up websocket client connection')
      this.removeClientFromAllChats(client)
    }
  }

  addSubscription(chatId: string, client: WebSocket) {
    if (!this.chatSubscriptions.has(chatId)) {
      this.chatSubscriptions.set(chatId, new Set())
    }
    this.chatSubscriptions.get(chatId)!.add(client)
    console.log(
      `Client subscribed to chat ${chatId}. Total subscribers: ${this.chatSubscriptions.get(chatId)!.size}`,
    )
    console.log(`Client readyState: ${client.readyState}`)
    console.log(
      `All subscriptions:`,
      Array.from(this.chatSubscriptions.keys()).map((id) => ({
        chatId: id,
        subscribers: this.chatSubscriptions.get(id)?.size,
      })),
    )
  }

  removeSubscription(chatId: string, client: WebSocket) {
    const chatClients = this.chatSubscriptions.get(chatId)
    if (chatClients) {
      chatClients.delete(client)
      if (chatClients.size === 0) {
        this.chatSubscriptions.delete(chatId)
      }
      console.log(
        `Client unsubscribed from chat ${chatId}. Remaining subscribers: ${chatClients.size}`,
      )
    }
  }

  removeClientFromAllChats(client: WebSocket) {
    for (const [chatId, clients] of this.chatSubscriptions) {
      if (clients.has(client)) {
        this.removeSubscription(chatId, client)
      }
    }
  }

  broadcastToChat(chatId: string, message: WSMessage, excludeClient?: WebSocket) {
    const chatClients = this.chatSubscriptions.get(chatId)
    console.log(
      `Attempting to broadcast to chat ${chatId}. Found ${chatClients?.size || 0} subscribers`,
    )

    if (!chatClients || chatClients.size === 0) {
      console.log(`No subscribers for chat ${chatId}`)
      return
    }

    const messageStr = JSON.stringify(message)
    let sentCount = 0
    let excludedCount = 0
    let closedCount = 0

    for (const client of chatClients) {
      if (client === excludeClient) {
        excludedCount++
        continue
      }

      if (client.readyState !== client.OPEN) {
        console.log(`Client not open (readyState: ${client.readyState}), skipping`)
        closedCount++
        continue
      }

      try {
        client.send(messageStr)
        sentCount++
      } catch (error) {
        console.error('Error sending message to client:', error)
        // Remove client if it's no longer valid
        this.removeSubscription(chatId, client)
      }
    }

    console.log(
      `Broadcast to chat ${chatId}: ${sentCount} sent, ${excludedCount} excluded, ${closedCount} closed`,
    )
  }

  getChatSubscriberCount(chatId: string): number {
    return this.chatSubscriptions.get(chatId)?.size || 0
  }

  getSubscriptions() {
    return this.chatSubscriptions
  }
}
