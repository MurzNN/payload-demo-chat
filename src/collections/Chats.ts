import type { CollectionConfig } from 'payload'

export const Chats: CollectionConfig = {
  slug: 'chats',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
