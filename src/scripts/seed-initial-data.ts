export const seedInitialData = async (payload) => {
  if ((await payload.count({ collection: 'users' }).then((result) => result.totalDocs)) === 0) {
    await payload.create({
      collection: 'users',
      data: {
        name: 'Admin',
        email: process.env.PAYLOAD_USER_ADMIN_EMAIL,
        password: process.env.PAYLOAD_USER_ADMIN_PASSWORD,
      },
    })
    payload.logger.info(`Created admin user: ${process.env.PAYLOAD_USER_ADMIN_EMAIL}`)
    await payload.create({
      collection: 'users',
      data: {
        name: 'System User',
        email: process.env.PAYLOAD_USER_SYSTEM_EMAIL,
        password: process.env.PAYLOAD_USER_SYSTEM_PASSWORD,
      },
    })
    payload.logger.info(`Created system user: ${process.env.PAYLOAD_USER_SYSTEM_EMAIL}`)
  }

  if ((await payload.count({ collection: 'chats' }).then((result) => result.totalDocs)) === 0) {
    const userAdmin = await payload
      .find({
        collection: 'users',
        where: {
          email: process.env.PAYLOAD_USER_ADMIN_EMAIL,
        },
        limit: 1,
      })
      .then((res) => res.docs[0])
    const userSystem = await payload
      .find({
        collection: 'users',
        where: {
          email: process.env.PAYLOAD_USER_SYSTEM_EMAIL,
        },
        limit: 1,
      })
      .then((res) => res.docs[0])

    for (let i = 0; i < 5; i++) {
      const chat = await payload.create({
        collection: 'chats',
        data: {
          title: 'A chat ' + Math.random().toString(36).substring(7),
        },
      })
      payload.logger.info(`Created chat id ${chat.id}: ${chat.title}`)

      await payload.create({
        collection: 'chat-messages',
        data: {
          chat: chat.id,
          user: userSystem.id,
          content: 'Hello world!',
        },
      })
      await payload.create({
        collection: 'chat-messages',
        data: {
          chat: chat.id,
          user: userAdmin.id,
          content: 'Hi there! ' + Math.random().toString(36).substring(7),
        },
      })
      payload.logger.info(`Created starting messages.`)
    }
  }
}
