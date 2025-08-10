'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Message, SSEMessage } from '@/types'

export function useRealtimeMessages(chatId: string, currentUserId?: string) {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected')
  const [newMessageCallback, setNewMessageCallback] = useState<((message: Message) => void) | null>(
    null,
  )
  const [deleteMessageCallback, setDeleteMessageCallback] = useState<
    ((messageId: string) => void) | null
  >(null)

  useEffect(() => {
    if (!chatId) return

    console.log(`🔌 Connecting to chat stream: ${chatId}`)
    setConnectionStatus('connecting')

    const eventSource = new EventSource(`/api/chat/${chatId}/stream`)

    eventSource.onopen = () => {
      console.log(`✅ Connected to chat stream: ${chatId}`)
      setConnectionStatus('connected')
    }

    eventSource.onerror = (error) => {
      console.error(`❌ Chat stream error for ${chatId}:`, error)
      setConnectionStatus('error')

      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          setConnectionStatus('connecting')
        }
      }, 5000)
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data)
        console.log(`📨 Received SSE message:`, data)

        switch (data.type) {
          case 'connected':
            console.log(`🎉 Connected to chat room: ${data.chatId}`)
            break

          case 'new_message':
            if (data.message && newMessageCallback) {
              // Determine if message is from current user
              const message = {
                ...data.message,
                role: data.message.userName === currentUserId ? 'own' : 'remote',
              } as Message

              newMessageCallback(message)
            }
            break

          case 'message_deleted':
            if (data.messageId && deleteMessageCallback) {
              deleteMessageCallback(data.messageId)
            }
            break

          default:
            console.log('Unknown SSE message type:', data.type)
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error, event.data)
      }
    }

    return () => {
      console.log(`🔌 Disconnecting from chat stream: ${chatId}`)
      eventSource.close()
      setConnectionStatus('disconnected')
    }
  }, [chatId, currentUserId, newMessageCallback, deleteMessageCallback])

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    setNewMessageCallback(() => callback)
  }, [])

  const onMessageDeleted = useCallback((callback: (messageId: string) => void) => {
    setDeleteMessageCallback(() => callback)
  }, [])

  return {
    connectionStatus,
    onNewMessage,
    onMessageDeleted,
  }
}
