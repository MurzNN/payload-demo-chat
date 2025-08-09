import type { NestedKeysStripped } from '@payloadcms/translations'
import { enTranslations } from '@payloadcms/translations/languages/en'
import { frTranslations } from '@payloadcms/translations/languages/fr'
import { deTranslations } from '@payloadcms/translations/languages/de'

export const customTranslations = {
  en: {
    custom: {
      chats: 'Chats',
      newChat: 'New Chat',
    },
  },
  fr: {
    custom: {
      chats: 'Discussions',
      newChat: 'Nouveau Chat',
    },
  },
  de: {
    custom: {
      chats: 'Chats',
      newChat: 'Neuer Chat',
    },
  },
}

export type CustomTranslationsObject = typeof customTranslations.en &
  typeof customTranslations.fr &
  typeof customTranslations.de &
  typeof enTranslations &
  typeof frTranslations &
  typeof deTranslations

export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>
