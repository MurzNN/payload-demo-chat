import { getContainer, initializeServiceOnDemand } from '@/container'
import type { ChatController } from '@/services/chat-controller'
import type { ChatSpammer } from '@/services/chat-spammer'

// Lazy service getters that initialize on first access
export async function getChatController(): Promise<ChatController> {
  const container = await getContainer()

  // Initialize only when first accessed
  await initializeServiceOnDemand('chatController')

  return container.cradle.chatController
}

export async function getChatSpammer(): Promise<ChatSpammer> {
  const container = await getContainer()

  // Initialize only when first accessed
  await initializeServiceOnDemand('chatSpammer')

  return container.cradle.chatSpammer
}

// Helper to get multiple services and initialize them
export async function getServices<T extends Record<string, any>>(
  serviceNames: string[],
): Promise<T> {
  const container = await getContainer()

  // Initialize all requested services
  await Promise.all(serviceNames.map((name) => initializeServiceOnDemand(name)))

  // Return object with all services
  const services = {} as T
  serviceNames.forEach((name) => {
    services[name as keyof T] = container.cradle[name]
  })

  return services
}

// Preload services that are commonly used together
export async function preloadChatServices() {
  await getServices(['chatController', 'chatSpammer'])
}
