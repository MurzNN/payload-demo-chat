import { headers as getHeaders } from 'next/headers.js'
import React from 'react'

import { Chat } from '@/components/chat/chat'
import { ChatList } from '@/components/chat/chat-list'
import { getContainer } from '@/container'
import type { PaginatedDocs } from 'payload'
import type { Chat as ChatType } from '@/payload-types'

export default async function Chats({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  console.log('Loading chat with id', chatId)
  const headers = await getHeaders()

  const container = await getContainer()
  const payload = container.cradle.payload
  const { user } = await payload.auth({ headers })
  console.log(' loading controller for chatId:', chatId, 'userId:', user?.id?.toString())
  const chatController = await container.cradle.getChatController({
    chatId: chatId,
    userId: user?.id?.toString() || '123',
  })
  const messages = await chatController.getMessages()
  const chats = await payload
    .find({
      collection: 'chats',
    })
    .then((res: PaginatedDocs<ChatType>) => res.docs)

  return (
    <div className="content p-10">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-2">
          <ChatList chats={chats} chatActive={chatId} />
        </div>
        <div className="col-span-10">
          <Chat
            messagesInitial={messages}
            chatId={chatId}
            userId={user?.id?.toString()}
            currentUserName={user?.name || undefined}
          />
        </div>
      </div>
    </div>
  )
}
