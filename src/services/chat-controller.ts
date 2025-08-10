import { Payload } from 'payload'
import { User, ChatMessage } from '@/payload-types'
import { Message } from '@/types/chat'

export class ChatController {
  private payload: Payload
  private ctxChatId: number
  private ctxUserId: string

  constructor({
    payload,
    ctxChatId,
    ctxUserId,
  }: {
    payload: Payload
    ctxChatId: number
    ctxUserId: string
  }) {
    this.payload = payload
    this.ctxChatId = ctxChatId
    this.ctxUserId = ctxUserId
  }

  async init() {
    console.log('ChatController async init')
    // init logic
  }

  async dispose() {
    // dispose logic
    console.log('ChatController async dispose')
  }

  async getMessages(): Promise<Message[]> {
    console.log('loading messages for id', this.ctxChatId)
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

  async postMessage(userId: number, content: string): Promise<void> {
    await this.payload.create({
      collection: 'chat-messages',
      data: {
        chat: this.ctxChatId,
        user: userId,
        content: content,
      },
    })
  }
}
