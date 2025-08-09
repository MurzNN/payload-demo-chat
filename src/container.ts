import config from '@payload-config'
import dotenv from 'dotenv'
import { getPayload } from 'payload'
import { AwilixManager } from 'awilix-manager'
import { asClass, asValue, createContainer } from 'awilix'
import { ChatSpammer } from './services/chat-spammer'
import { ChatController } from './services/chat-controller'

const container = createContainer({
  injectionMode: 'PROXY',
})

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
    asyncInitPriority: 10, // lower value means its initted earlier
    asyncDisposePriority: 10, // lower value means its disposed earlier
    asyncInit: 'init',
    asyncDispose: 'dispose',
    eagerInject: true, // this will be constructed and cached immediately. Redundant for resolves with `asyncInit` parameter set, as that is always resolved eagerly. If a string is passed, then additional synchronous method will be invoked in addition to constructor on injection.
  }),
)
container.register('ctxChatId', asValue(undefined))
container.register('ctxUserId', asValue(undefined))
container.register(
  'chatSpammer',
  asClass(ChatSpammer, {
    lifetime: 'SINGLETON',
    asyncInitPriority: 10, // lower value means its initted earlier
    asyncDisposePriority: 10, // lower value means its disposed earlier
    asyncInit: 'init',
    asyncDispose: 'dispose',
    eagerInject: true, // this will be constructed and cached immediately. Redundant for resolves with `asyncInit` parameter set, as that is always resolved eagerly. If a string is passed, then additional synchronous method will be invoked in addition to constructor on injection.
  }),
)

const awilixManager = new AwilixManager({
  diContainer: container,
  asyncInit: true,
  asyncDispose: true,
  strictBooleanEnforced: true,
})

export { container }

export const initContainerManager = async () => {
  await awilixManager.executeInit()
}
