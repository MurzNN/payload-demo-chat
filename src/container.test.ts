// Example test demonstrating the benefits of the singleton pattern
import { describe, it, expect, beforeEach } from 'vitest'
import { getContainer, resetContainer, isServiceInitialized } from './container'

describe('Container Singleton', () => {
  beforeEach(() => {
    // Clean slate for each test - this is why the reset method is valuable
    resetContainer()
  })

  it('should maintain single instance across multiple calls', async () => {
    const container1 = await getContainer()
    const container2 = await getContainer()

    // Same instance should be returned
    expect(container1).toBe(container2)
  })

  it('should properly encapsulate state without globals', () => {
    // No global variables polluting the namespace
    expect(typeof globalThis.__appContainerPromise).toBe('undefined')
    expect(typeof globalThis.__appLazyManager).toBe('undefined')
  })

  it('should handle lazy service initialization safely', async () => {
    // Before container initialization
    expect(isServiceInitialized('chatController')).toBe(false)

    // This won't throw, it returns false safely
    expect(() => isServiceInitialized('nonExistent')).not.toThrow()
  })

  it('should allow clean testing with reset', async () => {
    await getContainer()
    expect(isServiceInitialized('chatController')).toBe(false)

    resetContainer()
    // After reset, we can start fresh
    expect(isServiceInitialized('chatController')).toBe(false)
  })
})
