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

// Singleton container manager - proper encapsulation without globals
class ContainerSingleton {
  private static instance: ContainerSingleton | null = null
  private containerPromise: Promise<AwilixContainer> | null = null
  private lazyManager: LazyServiceManager | null = null

  private constructor() {}

  static getInstance(): ContainerSingleton {
    if (!ContainerSingleton.instance) {
      ContainerSingleton.instance = new ContainerSingleton()
    }
    return ContainerSingleton.instance
  }

  async getContainer(): Promise<AwilixContainer> {
    if (!this.containerPromise) {
      this.containerPromise = this.buildContainer()
    }
    return this.containerPromise
  }

  getLazyManager(): LazyServiceManager {
    if (!this.lazyManager) {
      throw new Error('Container not initialized. Call getContainer() first.')
    }
    return this.lazyManager
  }

  // Reset for testing
  reset(): void {
    this.containerPromise = null
    this.lazyManager = null
  }

  private async buildContainer(): Promise<AwilixContainer> {
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

    // Initialize lazy manager
    this.lazyManager = new LazyServiceManager(container)

    return container
  }
}

// Singleton instance
const containerManager = ContainerSingleton.getInstance()

// Public API - clean interface without global pollution
export async function getContainer(): Promise<AwilixContainer> {
  return containerManager.getContainer()
}

// For compatibility with existing imports
export const container = await getContainer()

export const initContainerManager = async (): Promise<void> => {
  // For lazy loading, we don't run executeInit() here
  // Services will be initialized on demand
  console.log('🔄 Container manager ready for lazy initialization')
}

export async function initializeServiceOnDemand(serviceName: string): Promise<void> {
  const lazyManager = containerManager.getLazyManager()
  await lazyManager.initializeService(serviceName)
}

export function isServiceInitialized(serviceName: string): boolean {
  try {
    const lazyManager = containerManager.getLazyManager()
    return lazyManager.isServiceInitialized(serviceName)
  } catch {
    return false
  }
}

export function getInitializedServices(): string[] {
  try {
    const lazyManager = containerManager.getLazyManager()
    return lazyManager.getInitializedServices()
  } catch {
    return []
  }
}

// For testing - allows clean reset
export function resetContainer(): void {
  containerManager.reset()
}
