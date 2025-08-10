export interface Message {
  id: string
  content: string
  createdAt: string
  userName: string
  role: 'own' | 'remote'
}

export interface SSEMessage {
  type: 'connected' | 'new_message' | 'message_deleted'
  message?: Message
  messageId?: string
  chatId?: string
  timestamp: string
}

export interface ChatConnection {
  chatId: string
  userId: string
  connectionTime: string
}

export interface ChatFormData {
  content: string
  chatId: string
  userId: string
}

export interface CreateChatFormData {
  title: string
}
