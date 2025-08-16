import { getContainer } from '@/container'

export function GET() {
  const headers = new Headers()
  headers.set('Connection', 'Upgrade')
  headers.set('Upgrade', 'websocket')
  return new Response('Upgrade Required', { status: 426, headers })
}

export function SOCKET(
  client: import('ws').WebSocket,
  _request: import('node:http').IncomingMessage,
  server: import('ws').WebSocketServer,
  args,
) {
  console.log('ARGS:', args)
  for (const other of server.clients) {
    if (client === other || other.readyState !== other.OPEN) continue
    other.send(
      JSON.stringify({
        author: 'System',
        content: 'A new user joined the chat',
      }),
    )
  }

  client.on('message', async (message) => {
    console.log('Received message:', message.toString())
    const parsedMessage = JSON.parse(message.toString())
    const container = await getContainer()
    const payload = container.cradle.payload
    const chatController = await container.cradle.getChatController({
      chatId: parsedMessage.chatId,
      userId: null,
    })
    chatController.postMessage(parsedMessage.content)
    // Forward the message to all other clients
    client.send(
      JSON.stringify({
        author: 'User',
        content: parsedMessage.content,
      }),
    )
    for (const other of server.clients)
      if (client !== other && other.readyState === other.OPEN) other.send(message)
  })

  client.send(
    JSON.stringify({
      author: 'System',
      content: `Welcome to the chat! There ${server.clients.size - 1 === 1 ? 'is 1 other user' : `are ${server.clients.size - 1 || 'no'} other users`} online`,
    }),
  )

  return () => {
    for (const other of server.clients) {
      if (client === other || other.readyState !== other.OPEN) continue
      other.send(
        JSON.stringify({
          author: 'System',
          content: 'A user left the chat',
        }),
      )
    }
  }
}
