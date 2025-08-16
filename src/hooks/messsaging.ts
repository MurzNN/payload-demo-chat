'use client'

import { useWebSocket } from '@/hooks/use-websocket'
import { useCallback, useEffect, useState } from 'react'

export interface Message {
  author: string
  content: string
}

const wsPath = '/api/ws'

const makeWsUrl = (u: string) => {
  if (/^wss?:/.test(u)) return u
  if (/^https?:/.test(u)) return u.replace(/^http/, 'ws')
  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${u}`
}

export function useMessaging(messagesInitial: Message[]) {
  const socket = useWebSocket(() => makeWsUrl(wsPath))
  console.log('msginit', messagesInitial)
  const [messages, setMessages] = useState<Message[]>(messagesInitial)

  useEffect(() => {
    const controller = new AbortController()

    socket?.addEventListener(
      'message',
      async (event) => {
        const payload = typeof event.data === 'string' ? event.data : await event.data.text()
        const message = JSON.parse(payload) as Message
        console.log('Incoming message:', message)
        setMessages((p) => [...p, message])
      },
      controller,
    )

    socket?.addEventListener(
      'error',
      () => {
        const content = 'An error occurred while connecting to the server'
        setMessages((p) => [...p, ...messages, { author: 'System', content }])
      },
      controller,
    )

    socket?.addEventListener(
      'close',
      (event) => {
        if (event.wasClean) return
        const content = 'The connection to the server was closed unexpectedly'
        setMessages((p) => [...p, { author: 'System', content }])
      },
      controller,
    )

    return () => controller.abort()
  }, [socket])

  const sendMessage = useCallback(
    (message: Message) => {
      console.log('Initiating message sending:', message)
      if (!socket || socket.readyState !== socket.OPEN) {
        console.error('WebSocket is not open')
        return
      }
      console.log('Outgoing message:', message)
      socket.send(JSON.stringify(message))
      // setMessages((p) => [...p, message])
      console.log('Message sent:', message)
    },
    [socket],
  )

  return [messages, sendMessage] as const
}
