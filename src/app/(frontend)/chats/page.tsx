import { headers as getHeaders } from 'next/headers.js'
import React from 'react'
import type { PaginatedDocs } from 'payload'

import { getContainer } from '@/container'
import { ChatList } from '@/components/chat/chat-list'
import { CreateChatForm } from '@/components/chat/create-chat-form'
import type { Chat } from '@/payload-types'

export default async function Chats() {
  const headers = await getHeaders()
  const container = await getContainer()
  const payload = container.cradle.payload
  const { user: _user } = await payload.auth({ headers })

  const chats = await payload
    .find({
      collection: 'chats',
    })
    .then((res: PaginatedDocs<Chat>) => res.docs)

  return (
    <div className="content p-10">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <ChatList chats={chats} chatActive={undefined} />
        </div>
        <div className="col-span-4">
          <CreateChatForm />
        </div>
      </div>
    </div>
  )
}
