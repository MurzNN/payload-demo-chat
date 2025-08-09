import { collectMeta } from 'next/dist/build/utils'
import { C } from 'vitest/dist/chunks/reporters.d.DL9pg5DB.js'

export const seedInitialData = async ({ payload, force }) => {
  if (force) {
    payload.logger.info('Clearing previous data.')
    await payload.delete({
      collection: 'users',
      where: {},
    })
    await payload.delete({
      collection: 'chats',
      where: {},
    })
    await payload.delete({
      collection: 'chat-messages',
      where: {},
    })
  }

  if ((await payload.count({ collection: 'users' })).totalDocs > 0) {
    payload.logger.info('Users collection is not empty, skipping seeding.')
    return
  }

  const userAdmin = await payload.create({
    collection: 'users',
    data: {
      name: 'Admin',
      email: process.env.PAYLOAD_USER_ADMIN_EMAIL,
      password: process.env.PAYLOAD_USER_ADMIN_PASSWORD,
    },
  })
  payload.logger.info(`Created admin user: ${process.env.PAYLOAD_USER_ADMIN_EMAIL}`)

  const userSystem = await payload.create({
    collection: 'users',
    data: {
      name: 'System User',
      email: process.env.PAYLOAD_USER_SYSTEM_EMAIL,
      password: process.env.PAYLOAD_USER_SYSTEM_PASSWORD,
    },
  })

  const usersCount = 3
  const users = {}
  for (let i = 1; i <= usersCount; i++) {
    users[i] = await payload.create({
      collection: 'users',
      data: {
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: `password${i}`,
      },
    })
  }
  const chatCount = 4
  for (let i = 1; i <= chatCount; i++) {
    const chat = await payload.create({
      collection: 'chats',
      data: {
        title: 'Chat ' + Math.random().toString(36).substring(7),
      },
    })

    const messageCount = 3
    for (let j = 1; j <= messageCount; j++) {
      const randUser = users[Math.floor(Math.random() * usersCount) + 1]
      await payload.create({
        collection: 'chat-messages',
        data: {
          chat: chat.id,
          user: randUser.id,
          content: `Message ${j} - ` + Math.random().toString(36).substring(7),
        },
      })
    }
  }
  payload.logger.info(`Initial data seeded.`)
}
