import config from '@payload-config'
import dotenv from 'dotenv'
import { getPayload, type Payload } from 'payload'
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

// Direct global reference - more reliable than Symbol in Next.js
declare global {
  var __appContainerSingleton: ContainerSingleton | undefined
  var __appContainerPromise: Promise<AwilixContainer> | undefined
}

// Singleton container manager - prevents double initialization
class ContainerSingleton {
  private containerPromise: Promise<AwilixContainer> | null = null
  private lazyManager: LazyServiceManager | null = null
  private isBuilding = false

  static getInstance(): ContainerSingleton {
    // Use direct global reference for better reliability
    if (!globalThis.__appContainerSingleton) {
      globalThis.__appContainerSingleton = new ContainerSingleton()
      console.log('🆕 Creating new ContainerSingleton instance')
    } else {
      console.log('♻️ Reusing existing ContainerSingleton instance')
    }
    return globalThis.__appContainerSingleton
  }

  async getContainer(): Promise<AwilixContainer> {
    // Use global promise for cross-module consistency
    if (!globalThis.__appContainerPromise) {
      console.log('🚀 Starting container initialization...')
      this.isBuilding = true
      try {
        globalThis.__appContainerPromise = this.buildContainer()
        this.containerPromise = globalThis.__appContainerPromise
        await globalThis.__appContainerPromise // Wait for completion
        console.log('✅ Container initialization completed')
      } catch (error) {
        console.error('❌ Container initialization failed:', error)
        globalThis.__appContainerPromise = undefined
        this.containerPromise = null
        throw error
      } finally {
        this.isBuilding = false
      }
    } else {
      console.log('♻️ Returning existing container')
      this.containerPromise = globalThis.__appContainerPromise
    }

    return globalThis.__appContainerPromise
  }

  getLazyManager(): LazyServiceManager {
    if (!this.lazyManager) {
      throw new Error('Container not initialized. Call getContainer() first.')
    }
    return this.lazyManager
  }

  // Reset for testing
  reset(): void {
    console.log('🔄 Resetting container for testing')
    this.containerPromise = null
    this.lazyManager = null
    this.isBuilding = false
    globalThis.__appContainerPromise = undefined
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

    container.register('ctxChatId', asValue(undefined))
    container.register('ctxUserId', asValue(undefined))

    container.loadModules(['services/*.ts'], {
      esModules: true,
    })
    console.log(container.registrations)
    // container.register(
    //   'chatController',
    //   asClass(ChatController, {
    //     lifetime: 'TRANSIENT',
    //   }),
    // )
    // container.register(
    //   'chatSpammer',
    //   asClass(ChatSpammer, {
    //     lifetime: 'SINGLETON',
    //   }),
    // )

    // Initialize lazy manager
    this.lazyManager = new LazyServiceManager(container)

    return container
  }
}

// Public API - clean interface without global pollution
export async function getContainer(): Promise<AwilixContainer> {
  const containerManager = ContainerSingleton.getInstance()
  return containerManager.getContainer()
}

// For compatibility with existing imports - lazy initialization
let _containerCache: Promise<AwilixContainer> | null = null
export const container = (() => {
  if (!_containerCache) {
    _containerCache = getContainer()
  }
  return _containerCache
})()

export const initContainerManager = async (): Promise<void> => {
  // For lazy loading, we don't run executeInit() here
  // Services will be initialized on demand
  console.log('🔄 Container manager ready for lazy initialization')
}

export async function initializeServiceOnDemand(serviceName: string): Promise<void> {
  const containerManager = ContainerSingleton.getInstance()
  const lazyManager = containerManager.getLazyManager()
  await lazyManager.initializeService(serviceName)
}

export function isServiceInitialized(serviceName: string): boolean {
  try {
    const containerManager = ContainerSingleton.getInstance()
    const lazyManager = containerManager.getLazyManager()
    return lazyManager.isServiceInitialized(serviceName)
  } catch {
    return false
  }
}

export function getInitializedServices(): string[] {
  try {
    const containerManager = ContainerSingleton.getInstance()
    const lazyManager = containerManager.getLazyManager()
    return lazyManager.getInitializedServices()
  } catch {
    return []
  }
}

// For testing - allows clean reset
export function resetContainer(): void {
  const containerManager = ContainerSingleton.getInstance()
  containerManager.reset()
  _containerCache = null // Reset cache too
  globalThis.__appContainerSingleton = undefined
}
