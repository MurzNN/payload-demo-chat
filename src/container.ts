import config from '@payload-config'
import dotenv from 'dotenv'
import { getPayload } from 'payload'
import { asClass, asValue, createContainer, type AwilixContainer } from 'awilix'
import { ChatSpammer } from './services/chat-spammer'
import { ChatController } from './services/chat-controller'

// Lazy initialization manager
class LazyServiceManager {
  private initializedServices = new Set<string>()
  private container: AwilixContainer
  private initMethods = new Map<string, string>()

  constructor(container: AwilixContainer) {
    this.container = container
    // Define which services have init methods
    this.initMethods.set('chatController', 'init')
    this.initMethods.set('chatSpammer', 'init')
  }

  async initializeService(serviceName: string): Promise<void> {
    if (this.initializedServices.has(serviceName)) {
      return
    }

    const initMethod = this.initMethods.get(serviceName)
    if (initMethod) {
      console.log(`🔄 Lazy initializing service: ${serviceName}`)
      const instance = this.container.resolve(serviceName)
      if (typeof instance[initMethod] === 'function') {
        await instance[initMethod]()
      }
      this.initializedServices.add(serviceName)
      console.log(`✅ Service initialized: ${serviceName}`)
    }
  }

  isServiceInitialized(serviceName: string): boolean {
    return this.initializedServices.has(serviceName)
  }

  getInitializedServices(): string[] {
    return Array.from(this.initializedServices)
  }
}

// Ensure TypeScript knows about our global cache (avoids duplicate containers in dev/HMR)
declare global {
  var __appContainerPromise: Promise<AwilixContainer<any>> | undefined

  var __appLazyManager: LazyServiceManager | undefined
}

async function buildContainer(): Promise<AwilixContainer<any>> {
  console.log('🏗️ Building new container instance at:', new Date().toISOString())
  const container = createContainer({ injectionMode: 'PROXY' })

  // @todo Task 1 start: Rework this to initialize in a service directly
  dotenv.config()
  const payload = await getPayload({ config })

  const systemUser = await payload
    .find({
      collection: 'users',
      where: {
        email: {
          equals: process.env.PAYLOAD_USER_SYSTEM_EMAIL,
        },
      },
    })
    .then((res) => res.docs[0])

  container.register('payload', asValue(payload))
  container.register('systemUser', asValue(systemUser))
  // Task 1 end.

  container.register(
    'chatController',
    asClass(ChatController, {
      lifetime: 'TRANSIENT',
    }),
  )
  container.register('ctxChatId', asValue(undefined))
  container.register('ctxUserId', asValue(undefined))
  container.register(
    'chatSpammer',
    asClass(ChatSpammer, {
      lifetime: 'SINGLETON',
    }),
  )

  // Store lazy manager globally
  globalThis.__appLazyManager = new LazyServiceManager(container)

  return container
}

export async function getContainer(): Promise<AwilixContainer<any>> {
  if (!globalThis.__appContainerPromise) {
    globalThis.__appContainerPromise = buildContainer()
  }
  return globalThis.__appContainerPromise
}

// For compatibility with existing imports
export const container = await getContainer()

export const initContainerManager = async (): Promise<void> => {
  // For lazy loading, we don't run executeInit() here
  // Services will be initialized on demand
  console.log('🔄 Container manager ready for lazy initialization')
}

export async function initializeServiceOnDemand(serviceName: string): Promise<void> {
  if (!globalThis.__appLazyManager) {
    throw new Error('Lazy service manager not initialized')
  }
  await globalThis.__appLazyManager.initializeService(serviceName)
}

export function isServiceInitialized(serviceName: string): boolean {
  return globalThis.__appLazyManager?.isServiceInitialized(serviceName) || false
}

export function getInitializedServices(): string[] {
  return globalThis.__appLazyManager?.getInitializedServices() || []
}
