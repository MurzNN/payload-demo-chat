import { Payload } from 'payload'
import { User, ChatMessage } from '@/payload-types'
import { Message } from '@/types/chat'
import { getContainer } from '@/container'
import { asValue } from 'awilix/lib/resolvers.js'
import { WebSocketManager } from './websocket-manager'
import type { WSMessage } from '@/types/chat'

export class ChatController {
  private payload: Payload
  private ctxChatId: string
  private ctxUserId: string | null
  private webSocketManager: WebSocketManager

  constructor({
    payload,
    ctxChatId,
    ctxUserId,
    webSocketManager,
  }: {
    payload: Payload
    ctxChatId: string
    ctxUserId: string | null
    webSocketManager: WebSocketManager
  }) {
    this.payload = payload
    this.ctxChatId = ctxChatId
    this.ctxUserId = ctxUserId
    this.webSocketManager = webSocketManager
  }

  public static async get({
    chatId,
    userId,
  }: {
    chatId: string
    userId: string | null
  }): Promise<ChatController> {
    const scope = (await getContainer()).createScope()
    scope.register('ctxChatId', asValue(chatId))
    scope.register('ctxUserId', asValue(userId))
    const service = scope.build(ChatController)
    await service.asyncInit()
    return service
  }

  async asyncInit() {
    console.log('ChatController async init')
    // init logic
  }

  async asyncDispose() {
    // dispose logic
    console.log('ChatController async dispose')
  }

  async getMessages(): Promise<Message[]> {
    console.log('loading messages for id', this.ctxChatId)

    if (!this.ctxChatId) {
      throw new Error('ChatController: ctxChatId is required but not set')
    }

    const messagesDocs = await this.payload
      .find({
        collection: 'chat-messages',
        where: {
          chat: {
            equals: this.ctxChatId,
          },
        },
        sort: '-createdAt',
        limit: 20,
      })
      .then((res) => res.docs as ChatMessage[])

    const user = (await this.payload.findByID({
      collection: 'users',
      id: 1,
    })) as User

    messagesDocs.reverse()
    const messages = messagesDocs.map(
      (doc): Message => ({
        id: doc.id.toString(),
        content: doc.content,
        createdAt: doc.createdAt,
        userName: typeof doc.user === 'object' && doc.user?.name ? doc.user.name : 'anonymous',
        role: typeof doc.user === 'object' && doc.user?.id === user?.id ? 'own' : 'remote',
      }),
    )

    return messages
  }

  async postMessage(content: string): Promise<void> {
    console.log('Posting message:', content)
    await this.payload.create({
      collection: 'chat-messages',
      data: {
        chat: parseInt(this.ctxChatId, 10),
        user: this.ctxUserId ? parseInt(this.ctxUserId, 10) : null,
        content: content,
      },
    })
    setTimeout(() => {
      this.postResponse(content)
    }, 1000)
  }

  async postResponse(userMessage: string): Promise<void> {
    console.log('Posting response for message:', userMessage)
    const responseContent = 'Response to: ' + userMessage

    // Save the response message to database
    const responseDoc = await this.payload.create({
      collection: 'chat-messages',
      data: {
        chat: parseInt(this.ctxChatId, 10),
        user: 1,
        content: responseContent,
      },
    })

    // Get user info for the response
    const responseUser = (await this.payload.findByID({
      collection: 'users',
      id: 1,
    })) as User

    // Send the response message to WebSocket subscribers
    const wsMessage: WSMessage = {
      type: 'chat_message',
      chatId: this.ctxChatId,
      userId: '1',
      userName: responseUser?.name || 'Bot',
      content: responseContent,
      createdAt: new Date().toISOString(),
    }

    this.webSocketManager.broadcastToChat(this.ctxChatId, wsMessage)
    console.log(`Response sent to WebSocket subscribers for chat ${this.ctxChatId}`)
  }
}
