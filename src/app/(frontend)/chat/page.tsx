import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { Chat } from '@/components/chat'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const messagesDocs = await payload
    .find({
      collection: 'chat-messages',
      sort: '-createdAt',
      limit: 20,
    })
    .then((res) => res.docs)

  const messages = messagesDocs.map((doc) => ({
    id: doc.id,
    content: doc.content,
    createdAt: doc.createdAt,
    userName: doc.user.name ?? 'anonymous',
    role: doc.user.id == user?.id ? 'own' : 'remote',
  }))

  return (
    <div className="content p-10">
      <Chat messages={messages} />
    </div>
  )
}
