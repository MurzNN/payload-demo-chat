import { headers as getHeaders } from 'next/headers.js'
import React from 'react'

import { Chat } from '@/components/chat'
import { container } from '@/container'
import { asValue } from 'awilix'
import { ChatList } from '@/components/chat-list'
import { ChatController } from '@/services/chat-controller'

export default async function Chats({ params }) {
  const { chatId } = await params
  console.log('Loading chat with id', chatId)
  const headers = await getHeaders()
  const payload = container.cradle.payload
  const { user } = await payload.auth({ headers })
  const ctxContainer = container.createScope()
  ctxContainer.register({
    ctxChatId: asValue(chatId),
    ctxUserId: asValue(user?.id),
  })
  const chatController: ChatController = ctxContainer.cradle.chatController
  const messages = await chatController.getMessages()

  const chats = await payload
    .find({
      collection: 'chats',
    })
    .then((res) => res.docs)

  return (
    <div className="content p-10">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-2">
          <ChatList chats={chats} chatActive={chatId} />
        </div>
        <div className="col-span-10">
          <Chat messages={messages} />
        </div>
      </div>
    </div>
  )
}
