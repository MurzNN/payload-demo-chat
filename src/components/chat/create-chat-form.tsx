'use client'

import { useState, useRef } from 'react'
import { createChat } from '@/components/chat/chat-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function CreateChatForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setError(null)

    try {
      const result = await createChat(formData)

      if (!result?.success) {
        setError(result?.error || 'Failed to create chat')
      }
      // If successful, redirect happens automatically in the action
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Create New Chat</h3>

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            name="title"
            placeholder="Chat title..."
            disabled={isPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Creating...' : 'Create Chat'}
        </Button>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      </form>
    </Card>
  )
}
