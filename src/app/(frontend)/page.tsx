import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.css'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <div className="grid grid-cols-12 min-h-screen">
      <div className="col-span-10 mx-auto flex flex-col justify-between py-8">
        <div>
          {!user && <h1 className="text-2xl font-bold mb-4">Welcome to the chat app!</h1>}
          {user && <h1 className="text-2xl font-bold mb-4">Welcome back, {user.email}</h1>}
          <div className="flex gap-4 mb-8">
            <Link href="/chats" passHref legacyBehavior>
              <Button as="a" variant="outline" rel="noopener noreferrer">
                List chats
              </Button>
            </Link>
            <Link href={payloadConfig.routes.admin} passHref legacyBehavior>
              <Button as="a" rel="noopener noreferrer">
                Go to admin panel
              </Button>
            </Link>
          </div>
        </div>
        <div className="footer text-center text-gray-500 mt-8">
          <p>Footer</p>
        </div>
      </div>
      {/* Empty columns for spacing if needed */}
      <div className="col-span-2"></div>
    </div>
  )
}
