// Service container following the evolved simple pattern
import config from '@payload-config'
import dotenv from 'dotenv'
import { getPayload, type Payload } from 'payload'
import { User } from '@/payload-types'
import { ChatControllerFactory } from './chat-controller-factory'

// Module-level singletons for core services
let payloadInstance: Payload | null = null
let systemUser: User | null = null
let aiServiceInstance: any = null
let emailServiceInstance: any = null

// Core service getters (same pattern as before)
export async function getPayloadInstance(): Promise<Payload> {
  if (!payloadInstance) {
    console.log('🚀 Initializing Payload')
    dotenv.config()
    payloadInstance = await getPayload({ config })
  }
  return payloadInstance
}

export async function getSystemUser(): Promise<User | null> {
  if (!systemUser) {
    const payload = await getPayloadInstance()
    const result = await payload.find({
      collection: 'users',
      where: {
        email: { equals: process.env.PAYLOAD_USER_SYSTEM_EMAIL },
      },
    })
    systemUser = result.docs[0] || null
  }
  return systemUser
}

// Mock AI Service (replace with real implementation)
export async function getAiService() {
  if (!aiServiceInstance) {
    console.log('🚀 Initializing AI Service')
    aiServiceInstance = {
      async generateResponse(message: string): Promise<string> {
        // Mock implementation - replace with real AI service
        return `AI Response to: "${message}"`
      },

      async moderateContent(content: string): Promise<'APPROVED' | 'BLOCKED'> {
        // Simple moderation rules - replace with real moderation
        const blockedWords = ['spam', 'abuse', 'hate']
        const isBlocked = blockedWords.some((word) => content.toLowerCase().includes(word))
        return isBlocked ? 'BLOCKED' : 'APPROVED'
      },

      async summarizeConversation(messages: string[]): Promise<string> {
        return `Summary of ${messages.length} messages`
      },
    }
  }
  return aiServiceInstance
}

// Mock Email Service (replace with real implementation)
export async function getEmailService() {
  if (!emailServiceInstance) {
    console.log('🚀 Initializing Email Service')
    emailServiceInstance = {
      async sendMessageNotification({
        chatId,
        userName,
        content,
      }: {
        chatId: number
        userName: string
        content: string
      }): Promise<void> {
        console.log(
          `📧 Email notification: ${userName} sent message in chat ${chatId}: "${content.substring(0, 50)}..."`,
        )
      },

      async sendWelcomeEmail(userEmail: string): Promise<void> {
        console.log(`📧 Welcome email sent to: ${userEmail}`)
      },
    }
  }
  return emailServiceInstance
}

// Service Container (hybrid approach as discussed)
class ServiceContainer {
  private static instance: ServiceContainer

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  // All services available in one place - following our evolved pattern
  async getServices() {
    return {
      payload: await getPayloadInstance(),
      systemUser: await getSystemUser(),
      aiService: await getAiService(),
      emailService: await getEmailService(),
      // ✅ Add new services here - only ONE place to modify!
    }
  }

  // Factory instances with all dependencies injected
  async getChatControllerFactory(): Promise<ChatControllerFactory> {
    const services = await this.getServices()

    return new ChatControllerFactory({
      payload: services.payload,
      aiService: services.aiService,
      emailService: services.emailService,
    })
  }

  // Could add more factories here
  async getChatSpammerFactory(): Promise<any> {
    const services = await this.getServices()
    // Return configured spammer factory
    return {
      get: (chatId: number) => ({
        async postSpamMessage() {
          if (!services.systemUser) {
            throw new Error('System user not found')
          }

          const spamMessage = await services.aiService.generateResponse('Generate a test message')

          await services.payload.create({
            collection: 'chat-messages',
            data: {
              chat: chatId,
              user: services.systemUser.id,
              content: spamMessage,
            },
          })
        },
      }),
    }
  }
}

// Public API - clean interface
export async function getChatControllerFactory(): Promise<ChatControllerFactory> {
  const container = ServiceContainer.getInstance()
  return container.getChatControllerFactory()
}

export async function getChatSpammerFactory(): Promise<any> {
  const container = ServiceContainer.getInstance()
  return container.getChatSpammerFactory()
}

// For testing - clean reset
export function resetServices(): void {
  payloadInstance = null
  systemUser = null
  aiServiceInstance = null
  emailServiceInstance = null
  // Reset private instance through getInstance() pattern
  const container = ServiceContainer.getInstance()
  ;(container as any).constructor.instance = null
}

/*
🎯 BENEFITS OF THIS IMPLEMENTATION:

✅ Follows Alexey's factory pattern exactly
✅ Auto-dependency injection - factories get all services automatically  
✅ Single place to add new services - just add to ServiceContainer.getServices()
✅ No need to modify existing factory calls when adding dependencies
✅ Easy to test - simple resetServices()
✅ Type-safe with TypeScript
✅ Scales to many methods per service (like Alexey's 20+ methods)
✅ Clean separation of concerns

Usage example:
```typescript
const factory = await getChatControllerFactory()
const chatController = factory.get(chatId, userId)
await chatController.asyncInit()

// All methods have access to all dependencies automatically
await chatController.postMessage("Hello")
await chatController.generateAiResponse("How are you?")
await chatController.markAsRead()
```
*/
