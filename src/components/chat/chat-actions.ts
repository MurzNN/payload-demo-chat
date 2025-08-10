'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Import the broadcast function
import { broadcastToChat } from '@/app/api/chat/[chatId]/stream/route'
import { getContainer } from '@/container'
import { asValue } from 'awilix/lib/resolvers.js'

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

    const headers = await getHeaders()
    const rootContainer = await getContainer()
    const payload = rootContainer.cradle.payload
    const { user } = await payload.auth({ headers })

    // Create scoped container for this request
    const ctxContainer = rootContainer.createScope()
    ctxContainer.register({
      ctxChatId: asValue(chatId),
      ctxUserId: asValue(user?.id),
    })

    // Use lazy service loading - only initializes when first used
    const chatController = ctxContainer.cradle.chatController

    const result = await chatController.postMessage(content)
    console.log(result)
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
    // Parse chatId to number
    const chatIdNum = parseInt(chatId, 10)
    if (isNaN(chatIdNum)) {
      return {
        success: false,
        error: 'Invalid chat ID',
      }
    }

    const headers = await getHeaders()
    const rootContainer = await getContainer()
    const payload = rootContainer.cradle.payload
    const { user } = await payload.auth({ headers })

    // Create scoped container for this request
    const ctxContainer = rootContainer.createScope()
    ctxContainer.register({
      ctxChatId: asValue(chatId),
      ctxUserId: asValue(user?.id),
    })

    // Use lazy service loading - only initializes when first used
    const chatController = ctxContainer.cradle.chatController

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
