import { Payload } from 'payload'
import { User, ChatMessage } from '@/payload-types'
import { Message } from '@/types/chat'

// Enhanced ChatController following Alexey's pattern
export class ChatController {
  private payload: Payload
  private chatId: number
  private userId?: string | number
  private aiService?: any // Will be injected
  private emailService?: any // Will be injected
  public user?: User

  constructor({
    payload,
    chatId,
    userId,
    aiService,
    emailService,
  }: {
    payload: Payload
    chatId: number
    userId?: string | number
    aiService?: any
    emailService?: any
  }) {
    this.payload = payload
    this.chatId = chatId
    this.userId = userId
    this.aiService = aiService
    this.emailService = emailService
  }

  async asyncInit(): Promise<void> {
    // Initialize user context if userId provided
    if (this.userId) {
      this.user = (await this.payload.findByID({
        collection: 'users',
        id: this.userId,
      })) as User
    }
  }

  async getMessages(): Promise<Message[]> {
    console.log('loading messages for id', this.chatId)

    const messagesDocs = await this.payload
      .find({
        collection: 'chat-messages',
        where: {
          chat: { equals: this.chatId },
        },
        sort: '-createdAt',
        limit: 20,
      })
      .then((res) => res.docs as ChatMessage[])

    const currentUser =
      this.user ||
      ((await this.payload.findByID({
        collection: 'users',
        id: 1,
      })) as User)

    messagesDocs.reverse()
    return messagesDocs.map(
      (doc): Message => ({
        id: doc.id.toString(),
        content: doc.content,
        createdAt: doc.createdAt,
        userName: typeof doc.user === 'object' && doc.user?.name ? doc.user.name : 'anonymous',
        role: typeof doc.user === 'object' && doc.user?.id === currentUser?.id ? 'own' : 'remote',
      }),
    )
  }

  async postMessage(content: string): Promise<ChatMessage> {
    // Use AI service for content moderation if available
    if (this.aiService) {
      const moderationResult = await this.aiService.moderateContent(content)
      if (moderationResult === 'BLOCKED') {
        throw new Error('Message blocked by AI moderation')
      }
    }

    const message = (await this.payload.create({
      collection: 'chat-messages',
      data: {
        chat: this.chatId,
        user: this.userId
          ? typeof this.userId === 'string'
            ? parseInt(this.userId, 10)
            : this.userId
          : null,
        content: content.trim(),
      },
    })) as ChatMessage

    // Send email notification if service available
    if (this.emailService && this.user) {
      await this.emailService.sendMessageNotification({
        chatId: this.chatId,
        userName: this.user.name || 'Anonymous',
        content,
      })
    }

    return message
  }

  async generateAiResponse(userMessage: string): Promise<string> {
    if (!this.aiService) {
      throw new Error('AI service not available')
    }
    return await this.aiService.generateResponse(userMessage)
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.payload.delete({
      collection: 'chat-messages',
      id: messageId,
    })
  }

  async updateMessage(messageId: string, content: string): Promise<ChatMessage> {
    return (await this.payload.update({
      collection: 'chat-messages',
      id: messageId,
      data: { content },
    })) as ChatMessage
  }

  async getMessageHistory(limit: number = 50): Promise<Message[]> {
    return this.getMessages() // Could extend with different logic
  }

  async markAsRead(): Promise<void> {
    // Mark chat as read for current user
    if (this.userId) {
      // Implementation for marking messages as read
      console.log(`Marking chat ${this.chatId} as read for user ${this.userId}`)
    }
  }

  async getChatStats(): Promise<{ messageCount: number; participantCount: number }> {
    const messageCount = await this.payload.count({
      collection: 'chat-messages',
      where: { chat: { equals: this.chatId } },
    })

    // Get unique participants
    const messages = await this.payload.find({
      collection: 'chat-messages',
      where: { chat: { equals: this.chatId } },
      limit: 1000, // Reasonable limit for participant counting
    })

    const uniqueUsers = new Set(
      messages.docs
        .map((msg) => (typeof msg.user === 'object' ? msg.user?.id : msg.user))
        .filter(Boolean),
    )

    return {
      messageCount: messageCount.totalDocs,
      participantCount: uniqueUsers.size,
    }
  }
}

// Factory following Alexey's exact pattern
export class ChatControllerFactory {
  private payload: Payload
  private aiService?: any
  private emailService?: any

  constructor({
    payload,
    aiService,
    emailService,
  }: {
    payload: Payload
    aiService?: any
    emailService?: any
  }) {
    this.payload = payload
    this.aiService = aiService
    this.emailService = emailService
  }

  // Creates scoped instance with chat context (like Alexey's get(user))
  get(chatId: number, userId?: string | number): ChatController {
    return new ChatController({
      payload: this.payload,
      chatId, // ← Scoped context
      userId,
      aiService: this.aiService,
      emailService: this.emailService,
    })
  }
}
