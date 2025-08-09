import { Button } from '@/components/ui/button'

export function ChatList({ chats, chatActive }) {
  return (
    <div className="chat-list bg-gray-50 h-full p-4 rounded-lg shadow flex flex-col">
      <Button className="mb-4 w-full">New chat</Button>
      <ul className="space-y-2">
        {chats.map((chat) => (
          <li key={chat.id} className={chat.id == chatActive ? 'bg-secondary' : ''}>
            <a
              href={`/chats/${chat.id}`}
              className="block px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-800 font-medium"
            >
              {chat.id} - xx {chatActive} - {chat.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
