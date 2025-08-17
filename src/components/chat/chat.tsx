'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChatInput } from './chat-input'
import type { Message } from '@/types/chat'
import { useMessaging } from '../../hooks/messsaging'

interface ChatProps {
  messagesInitial: Message[]
  chatId?: string
  userId?: string
  currentUserName?: string
}

export function Chat({ messagesInitial, chatId, userId, currentUserName }: ChatProps) {
  // const [messages, setMessages] = useState<Message[]>(messagesInitial)
  // const { connectionStatus, onNewMessage } = useRealtimeMessages(chatId || '', currentUserName)
  const [messages, sendMessage, connectionStatus] = useMessaging(messagesInitial, chatId, userId)

  return (
    <Card className="@container/card to-card">
      <CardHeader>
        <CardTitle>A chat</CardTitle>
        <CardDescription>
          Chitchatting about something.
          {chatId && (
            <span
              className={`ml-2 px-2 py-1 rounded text-xs ${
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-800'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-100 text-yellow-800'
                    : connectionStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {connectionStatus}
            </span>
          )}
        </CardDescription>
        <CardAction>Action</CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ${
                message.role === 'own'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-secondary text-secondary-foreground mr-auto'
              }`}
            >
              <div className="text-xs">{message.userName}:</div>
              <div>{message.content}</div>
              <div className="text-xs text-gray-500">{message.createdAt}</div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        {chatId ? (
          <ChatInput chatId={chatId} userId={userId} sendMessage={sendMessage} />
        ) : (
          <div className="text-gray-500 text-sm">Login required to send messages</div>
        )}
      </CardFooter>
    </Card>
  )
}
