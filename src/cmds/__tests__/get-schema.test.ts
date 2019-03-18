import { readFileSync } from 'fs'
import { resolve } from 'path'
import test from 'ava'
import sinon = require('sinon')
import { buildSchema, printSchema } from 'graphql'
import { SampleServer, startServer } from './fixtures/sampleGraphqlServer'
import makeContext from './fixtures/context'
import * as command from '../get-schema'

function normalizeSchema(sdl) {
  return printSchema(buildSchema(sdl))
}

const sampleSchemaFile = resolve(
  __dirname,
  '..',
  '..',
  '..',
  'sampleSchema.graphql',
)
const savedSchemaFile = resolve(__dirname, 'fixtures', 'savedSchema.graphql')
let sampleServer: SampleServer
let context

test.beforeEach(async () => {
  try {
    sinon.stub(process, 'exit')
    sampleServer = await startServer(sampleSchemaFile)
    context = makeContext({
      schemaPath: savedSchemaFile,
      extensions: {
        endpoints: {
          default: sampleServer.url,
        },
      },
    })
  } catch (e) {
    console.error(e)
  }
})

test.afterEach(async () => {
  ;(process.exit as any).restore()
  await sampleServer.close()
})

test('gets and saves a valid schema', async t => {
  await t.notThrows(command.handler(context, {}))
  try {
    t.is(
      normalizeSchema(readFileSync(sampleSchemaFile, 'utf8')),
      normalizeSchema(readFileSync(savedSchemaFile, 'utf8')),
      'saved schema',
    )
  } catch (e) {
    t.fail(e)
  }
})
