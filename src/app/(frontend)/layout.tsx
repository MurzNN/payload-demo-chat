import React from 'react'
import '@/styles/globals.css'
import { Badge } from '@/components/ui/badge'
export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <h1>
          My chat app:&nbsp;
          <a href="/chats">Chats</a>
        </h1>
        <main>{children}</main>
      </body>
    </html>
  )
}
