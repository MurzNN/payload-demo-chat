import { getLocalI18n, Payload } from 'payload'
import { randomUUID } from 'crypto'
import { User } from '@/payload-types'
import { AcceptedLanguages, I18n, SupportedLanguages, TFunction } from '@payloadcms/translations'
import { ChatController } from './chat-controller'

export class ChatSpammer {
  private payload: Payload
  private systemUser: User
  private chatController: ChatController

  constructor({
    payload,
    systemUser,
    chatController,
  }: {
    payload: Payload
    systemUser: User
    chatController: ChatController
  }) {
    this.payload = payload
    this.systemUser = systemUser
    this.chatController = chatController
  }

  async init() {
    // init logic
    // await this.postSpamMessage()
  }

  async dispose() {
    // dispose logic
  }

  async postSpamMessage(): Promise<void> {
    const chatId = 1
    this.chatController.postMessage(
      chatId,
      this.systemUser.id,
      'This is a spam message ' + Math.random().toString(36).substring(7),
    )
  }
}
