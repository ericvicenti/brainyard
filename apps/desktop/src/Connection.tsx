import { useEffect } from 'react'

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
