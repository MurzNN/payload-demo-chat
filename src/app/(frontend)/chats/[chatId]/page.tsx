import { headers as getHeaders } from 'next/headers.js'
import React from 'react'

import { Chat } from '@/components/chat/chat'
import { ChatList } from '@/components/chat/chat-list'
import { getChatControllerFactory } from '@/services/service-container'
import { getPayloadInstance } from '@/services/service-container'
import type { PaginatedDocs } from 'payload'
import type { Chat as ChatType } from '@/payload-types'

export default async function Chats({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  console.log('Loading chat with id', chatId)
  const headers = await getHeaders()

  // ✅ NEW: Use factory pattern following Alexey's approach
  const payload = await getPayloadInstance()
  const { user } = await payload.auth({ headers })

  // Parse chatId to number (Payload IDs are typically numbers)
  const chatIdNum = parseInt(chatId, 10)
  if (isNaN(chatIdNum)) {
    throw new Error(`Invalid chat ID: ${chatId}`)
  }

  // ✅ NEW: Get factory with all dependencies auto-injected
  const chatControllerFactory = await getChatControllerFactory()

  // ✅ NEW: Create scoped controller instance (like Alexey's get(user))
  const chatController = chatControllerFactory.get(chatIdNum, user?.id)
  await chatController.asyncInit() // Initialize user context

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
