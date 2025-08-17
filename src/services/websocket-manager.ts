import type { WebSocketServer, WebSocket } from 'ws'
import type { WSMessage } from '@/types/chat'

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
    console.log(JSON.stringify(chatId))
    console.log(this.chatSubscriptions)
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
