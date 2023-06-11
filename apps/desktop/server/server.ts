import express, { Request, Response } from 'express'
import next from 'next'
import WebSocket from 'ws'
import { IncomingMessage, createServer } from 'http'
import bodyParser from 'body-parser'
import { ServerDispatch } from './dispatch'
import { nanoid } from 'nanoid'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const port = process.env.PORT || 3000

export type SubscribeMessage = {
  type: 'subscribe'
  channel: string
}

export type UnsubscribeMessage = {
  type: 'unsubscribe'
  channel: string
}

export type ClientMessage = SubscribeMessage | UnsubscribeMessage

export type SubscriptionUpdate = {
  type: 'update'
  channel: string
  data: any
}

export type ServerMessage = SubscriptionUpdate

async function startServer() {
  const server = express()
  const httpServer = createServer(server)
  const wss = new WebSocket.Server({ noServer: true })

  const subbableStates: Record<string, any> = {
    'Room:HomeRoom': {
      clock: 0,
    },
  }
  const subbableHandlers: Record<string, Record<string, (value: any) => void>> = {}

  function updateState(channel: string, state: any) {
    subbableStates[channel] = state
    if (subbableHandlers[channel]) {
      Object.values(subbableHandlers[channel]).forEach((handler) => {
        handler(state)
      })
    }
  }

  setInterval(() => {
    const clock = subbableStates['Room:HomeRoom'].clock
    updateState('Room:HomeRoom', { clock: clock + 1 })
  }, 500)

  const clients: Record<
    string,
    {
      id: string
      send: (msg: ServerMessage) => void
    }
  > = {}

  wss.addListener('connection', (connection) => {
    const clientId = nanoid()

    function sendClient(msg: ServerMessage) {
      connection.send(JSON.stringify(msg))
    }
    function handleClientMessage(msg: ClientMessage) {
      if (msg.type === 'subscribe') {
        sendClient({
          type: 'update',
          channel: msg.channel,
          data: subbableStates[msg.channel],
        })
        subbableHandlers[msg.channel] = subbableHandlers[msg.channel] || {}
        subbableHandlers[msg.channel][clientId] = () => {
          sendClient({
            type: 'update',
            channel: msg.channel,
            data: subbableStates[msg.channel],
          })
        }
      } else if (msg.type === 'unsubscribe') {
        if (subbableHandlers[msg.channel][clientId]) {
          delete subbableHandlers[msg.channel][clientId]
        }
      }
    }

    connection.on('message', (data) => {
      const clientMessage: ClientMessage = JSON.parse(data.toString('utf-8'))
      handleClientMessage(clientMessage)
    })

    clients[clientId] = {
      id: clientId,
      send: sendClient,
    }

    connection.on('close', () => {
      delete clients[clientId]
    })
  })

  server.post('/dispatch', bodyParser.json(), (req, res) => {
    const requestAction = req.body
    ServerDispatch(requestAction)
      .then((response) => {
        res.setHeader('content-type', 'application/json')
        res.send(JSON.stringify(response || null))
      })
      .catch((e) => {
        res.statusCode = 500
        res.send(
          JSON.stringify({
            message: e.message,
          })
        )
      })
  })

  server.all('*', (req: Request, res: Response) => {
    return handle(req, res)
  })
  httpServer.on('upgrade', (req: IncomingMessage, socket, head) => {
    if (req.url === '/game') {
      wss.handleUpgrade(req, socket, head, (socket) => {
        wss.emit('connection', socket, req)
      })
    }
  })
  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, (err?: any) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

startServer()
  .then(() => {
    // careful not to update this line! the launcher checks for "ready - started server on"
    console.log(`Brainyard ready - started server on http://localhost:${port}/`)
  })
  .catch((e) => {
    console.error('Brainyard')
    console.error(e)
  })
