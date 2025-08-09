'use client'

import { IconSend2 } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useRef, useState } from 'react'

export function ChatList({ chats, chatActive }) {
  return (
    <div className="chat-list bg-gray-50 h-full p-4 rounded-lg shadow flex flex-col">
      <Button className="mb-4 w-full">New Chat</Button>
      <ul className="space-y-2">
        {chats.map((chat) => (
          <li key={chat.id}>
            <a
              href={`/chats/${chat.id}`}
              className="block px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-800 font-medium"
            >
              {chat.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
