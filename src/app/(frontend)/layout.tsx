import React from 'react'
import '@/styles/globals.css'
import Link from 'next/link'
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
          <Link href="/chats">Chats</Link>
        </h1>
        <main>{children}</main>
      </body>
    </html>
  )
}
