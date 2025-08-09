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

export function Chat({ messages }) {
  console.log(messages)
  return (
    <Card className="@container/card to-card">
      <CardHeader>
        <CardTitle>A chat</CardTitle>
        <CardDescription>Chitchatting about something.</CardDescription>
        <CardAction>Action</CardAction>
      </CardHeader>
      <CardContent>
        <p>Messages</p>
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
      </CardContent>

      <CardFooter>
        <form className="relative w-full">
          <Textarea
            id="message"
            placeholder="Type your message here..."
            required
            className="w-full pr-10"
          />
          <Button
            type="submit"
            className="
                absolute
                top-3
                right-2
                "
          >
            <IconSend2 />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
