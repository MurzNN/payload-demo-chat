import { getLocalI18n, SanitizedConfig } from 'payload'

export type Translate = (key: string) => string

// Get a translate function for a specific locale without a request
export async function getT(locale: string): Promise<Translate> {
  const i18n = await getLocalI18n({
    config: {} as SanitizedConfig,
    language: locale as any,
  })
  return (key: string) => i18n.t(key as any)
}

// Translate the same key across multiple locales
export async function translateAll(
  locales: string[],
  key: string,
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}
  await Promise.all(
    locales.map(async (locale) => {
      const t = await getT(locale)
      results[locale] = t(key)
    }),
  )
  return results
}
