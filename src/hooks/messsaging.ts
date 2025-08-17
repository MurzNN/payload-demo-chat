'use client'

import { useWebSocket } from '@/hooks/use-websocket'
import { useCallback, useEffect, useState, useRef } from 'react'
import type { Message, WSMessage } from '@/types/chat'

const wsPath = '/api/ws'

const makeWsUrl = (u: string) => {
  if (/^wss?:/.test(u)) return u
  if (/^https?:/.test(u)) return u.replace(/^http/, 'ws')
  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${u}`
}

export function useMessaging(messagesInitial: Message[], chatId?: string, userId?: string) {
  const socket = useWebSocket(() => makeWsUrl(wsPath))
  console.log('useMessaging initialized with:', {
    messagesInitial: messagesInitial.length,
    chatId,
    userId,
  })
  const [messages, setMessages] = useState<Message[]>(messagesInitial)
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting')
  const isSubscribed = useRef(false)

  // Track WebSocket connection status
  useEffect(() => {
    if (!socket) {
      setConnectionStatus('connecting')
      return
    }

    const handleOpen = () => {
      console.log('WebSocket connected')
      setConnectionStatus('connected')
    }

    const handleClose = () => {
      console.log('WebSocket disconnected')
      setConnectionStatus('disconnected')
      isSubscribed.current = false
    }

    const handleError = (error: Event) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('error')
    }

    // Set initial status based on current readyState
    switch (socket.readyState) {
      case WebSocket.CONNECTING:
        setConnectionStatus('connecting')
        break
      case WebSocket.OPEN:
        setConnectionStatus('connected')
        break
      case WebSocket.CLOSED:
      case WebSocket.CLOSING:
        setConnectionStatus('disconnected')
        break
    }

    socket.addEventListener('open', handleOpen)
    socket.addEventListener('close', handleClose)
    socket.addEventListener('error', handleError)

    return () => {
      socket.removeEventListener('open', handleOpen)
      socket.removeEventListener('close', handleClose)
      socket.removeEventListener('error', handleError)
    }
  }, [socket])

  // Subscribe to chat when socket connects and chatId is available
  useEffect(() => {
    console.log('Subscription effect triggered:', {
      socket: !!socket,
      chatId,
      isSubscribed: isSubscribed.current,
      readyState: socket?.readyState,
    })
    if (!socket || !chatId || isSubscribed.current) return

    const subscribeToChat = () => {
      if (socket.readyState === socket.OPEN && !isSubscribed.current) {
        console.log('Subscribing to chat:', chatId)
        const subscribeMessage: WSMessage = {
          type: 'subscribe',
          chatId,
          userId,
        }
        socket.send(JSON.stringify(subscribeMessage))
        isSubscribed.current = true
        console.log('Subscription message sent, isSubscribed set to true')
      } else {
        console.log('Cannot subscribe:', {
          readyState: socket.readyState,
          isSubscribed: isSubscribed.current,
        })
      }
    }

    // Try to subscribe immediately if socket is already open
    console.log('Attempting immediate subscription...')
    subscribeToChat()

    // If socket is not open yet, wait for it to open
    if (socket.readyState !== socket.OPEN) {
      console.log('Socket not open, adding open event listener')
      const handleOpen = () => {
        console.log('Socket opened, attempting subscription...')
        subscribeToChat()
        socket.removeEventListener('open', handleOpen)
      }
      socket.addEventListener('open', handleOpen)
    }

    return () => {
      if (socket && chatId && isSubscribed.current) {
        console.log('Unsubscribing from chat:', chatId)
        const unsubscribeMessage: WSMessage = {
          type: 'unsubscribe',
          chatId,
          userId,
        }
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify(unsubscribeMessage))
        }
        isSubscribed.current = false
      }
    }
  }, [socket, chatId, userId])

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return

    const controller = new AbortController()
    console.log('Setting up message listeners')

    socket?.addEventListener(
      'message',
      async (event) => {
        const payload = typeof event.data === 'string' ? event.data : await event.data.text()
        const wsMessage = JSON.parse(payload) as WSMessage
        console.log('Incoming WebSocket message:', wsMessage)

        // Convert WSMessage to Message format for display
        if (wsMessage.type === 'chat_message' || wsMessage.type === 'system_message') {
          const message: Message = {
            userName: wsMessage.userName || 'Unknown',
            content: wsMessage.content || '',
          }
          console.log('Adding message to state:', message)
          setMessages((p) => {
            console.log('Previous messages count:', p.length)
            const newMessages = [...p, message]
            console.log('New messages count:', newMessages.length)
            return newMessages
          })
        } else {
          console.log('Ignoring message with type:', wsMessage.type)
        }
      },
      controller,
    )

    socket?.addEventListener(
      'error',
      () => {
        const content = 'An error occurred while connecting to the server'
        setMessages((p) => [...p, { userName: 'System', content }])
      },
      controller,
    )

    socket?.addEventListener(
      'close',
      (event) => {
        if (event.wasClean) return
        const content = 'The connection to the server was closed unexpectedly'
        setMessages((p) => [...p, { userName: 'System', content }])
        isSubscribed.current = false
      },
      controller,
    )

    return () => controller.abort()
  }, [socket])

  const sendMessage = useCallback(
    (content: string) => {
      console.log('Initiating message sending:', { content, chatId, userId })
      if (!socket || socket.readyState !== socket.OPEN) {
        console.error('WebSocket is not open')
        return
      }

      if (!chatId) {
        console.error('No chatId provided')
        return
      }

      const wsMessage: WSMessage = {
        type: 'chat_message',
        chatId,
        userId,
        content,
        userName: userId ? 'User' : 'Anonymous',
        createdAt: new Date().toISOString(),
      }

      console.log('Outgoing WebSocket message:', wsMessage)
      socket.send(JSON.stringify(wsMessage))
      console.log('Message sent:', wsMessage)
    },
    [socket, chatId, userId],
  )

  return [messages, sendMessage, connectionStatus] as const
}
