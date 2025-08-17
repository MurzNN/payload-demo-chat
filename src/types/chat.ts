export interface Message {
  id?: string
  content: string
  createdAt: string
  userName: string
  role: 'own' | 'remote'
}

export interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'chat_message' | 'system_message'
  id?: string
  chatId?: string
  userId?: string
  content?: string
  userName?: string
  createdAt?: string
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
