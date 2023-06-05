import { useEffect } from 'react'
import { ActionType, ServerActionResponse, ServerActionRequest } from 'server/dispatch'

export function useServerConnection() {
  useEffect(() => {
    console.log('useServerConnection')
    const socket = new WebSocket('ws://localhost:3000/game')
    socket.addEventListener('open', () => {
      console.log('connected')
      socket.send(JSON.stringify({ hello: 'from the client' }))
    })
    socket.addEventListener('message', (message) => {
      const body = JSON.parse(message.data)
      console.log('ws msg from server', body)
    })

    return () => {
      console.log('end useServerConnection')
    }
  }, [])
  return {}
}

export async function dispatch<AT extends ActionType>(
  action: ServerActionRequest<AT>
): Promise<ServerActionResponse<AT>> {
  const res = await fetch('http://localhost:3000/dispatch', {
    method: 'post',
    body: JSON.stringify(action),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const body = await res.json()
  return body
}
