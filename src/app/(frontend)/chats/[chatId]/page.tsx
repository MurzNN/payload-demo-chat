import { headers as getHeaders } from 'next/headers.js'
import React from 'react'

import { Chat } from '@/components/chat/chat'
import { ChatList } from '@/components/chat/chat-list'
import { getContainer } from '@/container'
import type { PaginatedDocs } from 'payload'
import type { Chat as ChatType } from '@/payload-types'
import { asValue } from 'awilix'

export default async function Chats({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  console.log('Loading chat with id', chatId)
  const headers = await getHeaders()

  const rootContainer = await getContainer()
  const payload = rootContainer.cradle.payload
  const { user } = await payload.auth({ headers })

  // Parse chatId to number (Payload IDs are typically numbers)
  const chatIdNum = parseInt(chatId, 10)
  if (isNaN(chatIdNum)) {
    throw new Error(`Invalid chat ID: ${chatId}`)
  }

  // Create scoped container for this request
  const ctxContainer = rootContainer.createScope()
  ctxContainer.register({
    ctxChatId: asValue(chatId),
    ctxUserId: asValue(user?.id),
  })

  // Use lazy service loading - only initializes when first used
  const chatController = ctxContainer.cradle.chatController
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
            messages={messages}
            chatId={chatId}
            userId={user?.id?.toString()}
            currentUserName={user?.name || undefined}
          />
        </div>
      </div>
    </div>
  )
}
