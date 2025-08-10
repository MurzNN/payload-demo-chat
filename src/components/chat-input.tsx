'use client'

import { useState, useRef } from 'react'
import { createChatMessage } from '@/actions/chat-actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  chatId: string
  userId: string
  disabled?: boolean
}

export function ChatInput({ chatId, userId, disabled = false }: ChatInputProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setError(null)

    try {
      const result = await createChatMessage(formData)

      if (result.success) {
        // Clear the form
        formRef.current?.reset()
        textareaRef.current?.focus()
      } else {
        setError(result.error || 'Failed to send message')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsPending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const formData = new FormData(formRef.current!)
      handleSubmit(formData)
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <input type="hidden" name="chatId" value={chatId} />
      <input type="hidden" name="userId" value={userId} />

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          name="content"
          placeholder="Type your message..."
          disabled={disabled || isPending}
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[60px] resize-none"
          required
        />
        <Button type="submit" disabled={disabled || isPending} className="self-end">
          {isPending ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
    </form>
  )
}
