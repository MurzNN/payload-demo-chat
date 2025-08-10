import { Payload } from 'payload'
import { User } from '@/payload-types'
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
    console.log('ChatSpammer async init')
    // await this.postSpamMessage()
  }

  async dispose() {
    // dispose logic
    console.log('ChatSpammer async dispose')
  }

  async postSpamMessage(): Promise<void> {
    const userId = this.systemUser.id
    await this.chatController.postMessage(
      userId,
      'This is a spam message ' + Math.random().toString(36).substring(7),
    )
  }
}
