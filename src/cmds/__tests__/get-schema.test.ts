import { readFileSync, unlinkSync } from 'fs'
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
  try {
    unlinkSync(savedSchemaFile)
  } catch (e) {
    // if saved schema didn't exist it's fine
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

test('gets and saves a valid schema from an endpoint', async t => {
  await t.notThrows(command.handler(context, { endpoint: 'default' }))
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

test('gets and saves a valid schema from a manual endpoint and manual output', async t => {
  const alternateOutput = resolve(
    savedSchemaFile,
    './anotherSavedSchemaFile.graphql',
  )
  await t.notThrows(
    command.handler(context, {
      endpoint: sampleServer.url,
      output: alternateOutput,
    }),
  )
  try {
    t.is(
      normalizeSchema(readFileSync(sampleSchemaFile, 'utf8')),
      normalizeSchema(readFileSync(alternateOutput, 'utf8')),
      'saved alternate output',
    )
    unlinkSync(alternateOutput)
  } catch (e) {
    t.fail(e)
  }
})

test('gets schema in watch mode by polling server', async function(t) {
  sinon.assert.fail = msg => t.fail(msg)
  const clock = sinon.useFakeTimers()
  await command.handler(context, { watch: true })
  // @ts-ignore sinon defs are not up to date, countTimers is missing
  t.is(clock.countTimers(), 1)
  clock.reset()
  clock.uninstall()
})
