import config from '@payload-config'
import dotenv from 'dotenv'
import { getPayload, type Payload } from 'payload'
import { asClass, asValue, createContainer, type AwilixContainer } from 'awilix'
import { ChatSpammer } from './services/chat-spammer'
import { ChatController } from './services/chat-controller'
import { WebSocketManager } from './services/websocket-manager'
// Direct global reference - more reliable than Symbol in Next.js
declare global {
  var __appContainerController: ContainerController | undefined
  var __appContainerPromise: Promise<AwilixContainer> | undefined
  var __appContainerManagerPromise: Promise<AwilixContainer> | undefined
  var __moduleSignature: string | undefined
}

export class ContainerController {
  private containerPromise: Promise<AwilixContainer> | null = null
  private isBuilding = false

  static getInstance(): ContainerController {
    // Use direct global reference for better reliability
    if (!globalThis.__appContainerController) {
      globalThis.__appContainerController = new ContainerController()
      console.log('🆕 Creating new ContainerController instance')
    } else {
      console.log('♻️ Reusing existing ContainerController instance')
    }
    return globalThis.__appContainerController
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

  // Reset for testing
  reset(): void {
    console.log('🔄 Resetting container for testing')
    this.containerPromise = null
    this.isBuilding = false
    globalThis.__appContainerPromise = undefined
    globalThis.__appContainerManagerPromise = undefined
    // Also clear the controller instance to ensure full reset
    if (globalThis.__appContainerController === this) {
      globalThis.__appContainerController = undefined
    }
  }

  private async buildContainer(): Promise<AwilixContainer> {
    console.log('🏗️ Building new container instance')

    const container = createContainer({ injectionMode: 'PROXY' })

    dotenv.config()
    const payload = await getPayload({ config })
    container.register('payload', asValue(payload))

    // Register WebSocket manager as singleton
    const wsManager = WebSocketManager.getInstance()
    container.register('webSocketManager', asValue(wsManager))

    container.register('getChatController', asValue(ChatController.get))

    return container
  }
}

export async function getContainer(): Promise<AwilixContainer> {
  const containerManager = ContainerController.getInstance()
  return containerManager.getContainer()
}
