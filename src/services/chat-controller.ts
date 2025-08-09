import { Payload } from 'payload'

export class ChatController {
  private payload: Payload
  private ctxChatId: string
  private ctxUserId: string

  constructor({
    payload,
    ctxChatId,
    ctxUserId,
  }: {
    payload: Payload
    ctxChatId: string
    ctxUserId: string
  }) {
    this.payload = payload
    this.ctxChatId = ctxChatId
    this.ctxUserId = ctxUserId
  }

  async init() {
    // init logic
  }

  async dispose() {
    // dispose logic
  }

  async getMessages(): Promise<any[]> {
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
      .then((res) => res.docs)

    const user = this.payload.findByID({
      collection: 'users',
      id: 1,
    })

    messagesDocs.reverse()
    const messages = messagesDocs.map((doc) => ({
      id: doc.id,
      content: doc.content,
      createdAt: doc.createdAt,
      userName: doc.user?.name ?? 'anonymous',
      role: doc.user?.id == user?.id ? 'own' : 'remote',
    }))

    return messages
  }

  async postMessage(userId, content): Promise<void> {
    await this.payload.create({
      collection: 'chat-messages',
      data: {
        chat: this.ctxUserId,
        user: userId,
        content: content,
      },
    })
  }
}
