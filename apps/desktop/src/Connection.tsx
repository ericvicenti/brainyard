import { useEffect, useMemo, useRef } from 'react'
import { ActionType, ServerActionResponse, ServerActionRequest } from 'server/dispatch'
import { ClientMessage, ServerMessage } from 'server/server'

export type ServerConnection = ReturnType<typeof useServerConnection>

export function useServerConnection(server: string) {
  const send = useRef<(message: ClientMessage) => void>(() => {})
  const subscribers = useRef<Record<string, Set<(value: any) => void>>>({})
  const states = useRef<Record<string, any>>({})

  useEffect(() => {
    const socket = new WebSocket(`ws://${server}/game`)
    socket.addEventListener('open', () => {
      send.current = (message: ClientMessage) => {
        socket.send(JSON.stringify(message))
      }
      Object.entries(subscribers.current).forEach(([channel]) => {
        send.current({ type: 'subscribe', channel })
      })
    })
    socket.addEventListener('message', (rawMessage) => {
      const message: ServerMessage = JSON.parse(rawMessage.data)
      if (message.type === 'update') {
        const { channel, data } = message
        states.current[channel] = data
        subscribers.current[channel]?.forEach((handler) => handler(data))
      }
    })

    return () => {
      send.current = () => {}
      socket.close()
    }
  }, [server])
  return useMemo(
    () => ({
      dispatch,
      subscribe: (channel: string, handler: (value: any) => void) => {
        subscribers.current[channel] = subscribers.current[channel] || new Set()
        subscribers.current[channel].add(handler)
        if (states.current[channel] !== undefined) handler(states.current[channel])
        send.current({ type: 'subscribe', channel })
        return () => {
          if (!subscribers.current[channel]) return
          subscribers.current[channel].delete(handler)
          if (subscribers.current[channel].size === 0)
            send.current({ type: 'unsubscribe', channel })
        }
      },
    }),
    []
  )
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
