import express, { Request, Response } from 'express'
import next from 'next'
import WebSocket from 'ws'
import { IncomingMessage, createServer } from 'http'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const port = process.env.PORT || 3000

async function startServer() {
  const server = express()
  const httpServer = createServer(server)
  const wss = new WebSocket.Server({ noServer: true })
  wss.addListener('connection', (connection) => {
    // console.log('Socket connected!')
    connection.on('message', (data) => {
      console.log('message from client', JSON.parse(data.toString('utf-8')))
    })
    connection.send(JSON.stringify({ hello: 'from the server' }))
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
    console.log('Brainyard Started on http://localhost:3000/')
  })
  .catch((e) => {
    console.error('Brainyard')
    console.error(e)
  })
