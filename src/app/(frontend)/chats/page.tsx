import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { Chat } from '@/components/chat'
import { container } from '@/container'
import { asClass, asValue, createContainer } from 'awilix'
import { ChatList } from '@/components/chat-list'

export default async function Chats() {
  const headers = await getHeaders()
  const payload = container.cradle.payload
  const { user } = await payload.auth({ headers })

  const chats = await payload
    .find({
      collection: 'chats',
    })
    .then((res) => res.docs)

  return (
    <div className="content p-10">
      <ChatList chats={chats} />
    </div>
  )
}
