'use server'

import { getContainer } from '@/container'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Import the broadcast function
import { broadcastToChat } from '@/app/api/chat/[chatId]/stream/route'

export async function createChatMessage(formData: FormData) {
  try {
    const container = await getContainer()
    const payload = container.cradle.payload

    const content = formData.get('content') as string
    const chatId = formData.get('chatId') as string
    const userId = formData.get('userId') as string

    if (!content || !chatId || !userId) {
      return {
        success: false,
        error: 'Missing required fields: content, chatId, or userId',
      }
    }

    const result = await payload.create({
      collection: 'chat-messages',
      data: {
        content: content.trim(),
        chat: chatId,
        user: userId,
      },
    })

    // Get user info for real-time broadcast
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    // Broadcast new message to all connected clients
    broadcastToChat(chatId, {
      type: 'new_message',
      message: {
        id: result.id,
        content: result.content,
        createdAt: result.createdAt,
        userName: user?.name || 'Anonymous',
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
    const container = await getContainer()
    const payload = container.cradle.payload

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
    const container = await getContainer()
    const payload = container.cradle.payload

    await payload.delete({
      collection: 'chat-messages',
      id: messageId,
    })

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
