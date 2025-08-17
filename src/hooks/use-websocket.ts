'use client'

import { useEffect, useRef, useState } from 'react'

export function useWebSocket(url: () => string) {
  const ref = useRef<WebSocket | null>(null)
  const target = useRef(url)
  const [, update] = useState(0)

  useEffect(() => {
    if (ref.current) {
      console.log('WebSocket already exists, skipping creation')
      return
    }

    console.log('Creating new WebSocket connection to:', target.current())
    const socket = new WebSocket(target.current())
    ref.current = socket

    socket.addEventListener('open', () => {
      console.log('WebSocket connection opened')
      update((p) => p + 1)
    })

    socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason)
    })

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error)
    })

    return () => {
      console.log('Cleaning up WebSocket connection')
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }
    }
  }, [])

  return ref.current
}
