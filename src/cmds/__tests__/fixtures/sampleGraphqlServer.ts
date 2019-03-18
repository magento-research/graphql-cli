import { readFileSync } from 'fs'
import express = require('express')
import graphqlHttp = require('express-graphql')
import { buildSchema } from 'graphql'
import { createServer, Server } from 'http'
import { promisify } from 'util'
import { format } from 'url'

export class SampleServer {
  app: express.Application
  url: string
  close: () => Promise<void>
  server: Server
  constructor(app, server) {
    this.app = app
    this.server = server
    this.close = promisify(server.close.bind(server))
    const { address, port } = server.address()
    this.url = format({
      protocol: 'http:',
      hostname: address,
      port,
      pathname: '/graphql',
    })
  }
}

export async function startServer(schemaFile): Promise<SampleServer> {
  const app = express()

  app.use(
    '/graphql',
    graphqlHttp({
      schema: buildSchema(readFileSync(schemaFile, 'utf8')),
    }),
  )

  return new Promise(resolve => {
    const server = createServer({}, app)
    server.listen(0, '0.0.0.0', () => {
      resolve(new SampleServer(app, server))
    })
  })
}
