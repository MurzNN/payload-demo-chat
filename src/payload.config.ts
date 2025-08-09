// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
  onInit: async (payload) => {
    if (process.env.PAYLOAD_ADMIN_EMAIL && process.env.PAYLOAD_ADMIN_PASSWORD) {
      if (
        (await payload
          .count({
            collection: 'users',
            where: {
              email: process.env.PAYLOAD_ADMIN_EMAIL,
            },
          })
          .then((result) => result.totalDocs)) === 0
      ) {
        await payload.create({
          collection: 'users',
          data: {
            email: process.env.PAYLOAD_ADMIN_EMAIL,
            password: process.env.PAYLOAD_ADMIN_PASSWORD,
          },
        })
        payload.logger.info(`Created admin user: ${process.env.PAYLOAD_ADMIN_EMAIL}`)
      }
    }
  },
})
