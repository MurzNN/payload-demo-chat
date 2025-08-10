import { getContainer, isServiceInitialized, getInitializedServices } from '@/container'
import { getChatController, getChatSpammer } from '@/lib/lazy-services'

export default async function TestLazy() {
  const container = await getContainer()

  // Check initial state
  const initialServices = getInitializedServices()
  const isChatControllerInitialized = isServiceInitialized('chatController')
  const isChatSpammerInitialized = isServiceInitialized('chatSpammer')

  // Test lazy initialization timing
  const startTime = Date.now()

  // This should not trigger initialization (just get the proxy)
  const chatSpammerProxy = container.cradle.chatSpammer
  const withoutInitTime = Date.now() - startTime

  // This should trigger initialization
  const initStartTime = Date.now()
  const chatController = await getChatController()
  const withControllerInitTime = Date.now() - initStartTime

  // This should also trigger initialization
  const spammerInitStartTime = Date.now()
  const chatSpammer = await getChatSpammer()
  const withSpammerInitTime = Date.now() - spammerInitStartTime

  // Check state after initialization
  const finalServices = getInitializedServices()
  const isControllerNowInitialized = isServiceInitialized('chatController')
  const isSpammerNowInitialized = isServiceInitialized('chatSpammer')

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Lazy Initialization Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-3">Initial State</h3>
          <div className="space-y-2 text-sm">
            <p>
              Initialized services:{' '}
              {initialServices.length > 0 ? initialServices.join(', ') : 'None'}
            </p>
            <p>
              ChatController:{' '}
              {isChatControllerInitialized ? '✅ Initialized' : '❌ Not initialized'}
            </p>
            <p>ChatSpammer: {isChatSpammerInitialized ? '✅ Initialized' : '❌ Not initialized'}</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold mb-3">After Lazy Loading</h3>
          <div className="space-y-2 text-sm">
            <p>Initialized services: {finalServices.join(', ')}</p>
            <p>
              ChatController: {isControllerNowInitialized ? '✅ Initialized' : '❌ Not initialized'}
            </p>
            <p>ChatSpammer: {isSpammerNowInitialized ? '✅ Initialized' : '❌ Not initialized'}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <h3 className="font-semibold mb-3">Performance Metrics</h3>
        <div className="space-y-2 text-sm">
          <p>
            Service proxy access (no init): <strong>{withoutInitTime}ms</strong>
          </p>
          <p>
            ChatController initialization: <strong>{withControllerInitTime}ms</strong>
          </p>
          <p>
            ChatSpammer initialization: <strong>{withSpammerInitTime}ms</strong>
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded">
        <h3 className="font-semibold mb-3">Manual Tests</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check terminal for lazy initialization logs</li>
          <li>Refresh page - services should not re-initialize if already loaded</li>
          <li>Navigate to different pages to see selective loading</li>
          <li>Compare startup logs with previous (eager) initialization</li>
        </ol>
      </div>

      <div className="bg-purple-50 p-4 rounded">
        <h3 className="font-semibold mb-3">Service Instances</h3>
        <div className="space-y-2 text-sm">
          <p>ChatController type: {typeof chatController}</p>
          <p>ChatSpammer type: {typeof chatSpammer}</p>
          <p>Proxy type: {typeof chatSpammerProxy}</p>
          <p>
            Same instance check: {chatSpammer === chatSpammerProxy ? '✅ Same' : '❌ Different'}
          </p>
        </div>
      </div>
    </div>
  )
}
