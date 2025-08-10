'use server'

import { getChatControllerFactory, getPayloadInstance } from '@/services/service-container'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Import the broadcast function
import { broadcastToChat } from '@/app/api/chat/[chatId]/stream/route'

export async function createChatMessage(formData: FormData) {
  try {
    const content = formData.get('content') as string
    const chatId = formData.get('chatId') as string
    const userId = formData.get('userId') as string

    if (!content || !chatId) {
      return {
        success: false,
        error: 'Missing required fields: content or chatId',
      }
    }

    // Parse chatId to number
    const chatIdNum = parseInt(chatId, 10)
    if (isNaN(chatIdNum)) {
      return {
        success: false,
        error: 'Invalid chat ID',
      }
    }

    // ✅ NEW: Use factory pattern following Alexey's approach
    const chatControllerFactory = await getChatControllerFactory()
    const chatController = chatControllerFactory.get(chatIdNum, userId)
    await chatController.asyncInit()

    const result = await chatController.postMessage(content)

    // Get user info for real-time broadcast
    const payload = await getPayloadInstance()
    const user = userId
      ? await payload.findByID({
          collection: 'users',
          id: userId,
        })
      : null

    // Broadcast new message to all connected clients
    broadcastToChat(chatId, {
      type: 'new_message',
      message: {
        id: result.id,
        content: result.content,
        createdAt: result.createdAt,
        userName: userId ? user?.name || 'Anonymous' : 'Anonymous',
        role: 'remote', // Will be determined by client
      },
      timestamp: new Date().toISOString(),
    })

    // Revalidate the chat page to show new message
    revalidatePath(`/chats/${chatId}`)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Error creating chat message:', error)
    return {
      success: false,
      error: 'Failed to create message',
    }
  }
}

export async function createChat(formData: FormData) {
  try {
    const payload = await getPayloadInstance()

    const title = formData.get('title') as string

    if (!title) {
      return {
        success: false,
        error: 'Chat title is required',
      }
    }

    const result = await payload.create({
      collection: 'chats',
      data: {
        title: title.trim(),
      },
    })

    // Revalidate chats list
    revalidatePath('/chats')

    // Redirect to new chat
    redirect(`/chats/${result.id}`)
  } catch (error) {
    console.error('Error creating chat:', error)
    return {
      success: false,
      error: 'Failed to create chat',
    }
  }
}

export async function deleteChatMessage(messageId: string, chatId: string) {
  try {
    // Parse chatId to number
    const chatIdNum = parseInt(chatId, 10)
    if (isNaN(chatIdNum)) {
      return {
        success: false,
        error: 'Invalid chat ID',
      }
    }

    // ✅ NEW: Use factory pattern
    const chatControllerFactory = await getChatControllerFactory()
    const chatController = chatControllerFactory.get(chatIdNum)

    await chatController.deleteMessage(messageId)

    // Revalidate the chat page
    revalidatePath(`/chats/${chatId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting chat message:', error)
    return {
      success: false,
      error: 'Failed to delete message',
    }
  }
}
