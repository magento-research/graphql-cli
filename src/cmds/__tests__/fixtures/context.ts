import sinon = require('sinon')
import {
  GraphQLConfig,
  GraphQLProjectConfig,
  GraphQLConfigData,
} from 'graphql-config'
import { Context } from '../../..'
import { PromptModule } from 'inquirer'

function fakePrompt(questions) {
  return Object.entries(questions).reduce((out, [name]) => ({
    ...out,
    [name]: null,
  }))
}
fakePrompt.registerPrompt = sinon.stub()
fakePrompt.restoreDefaultPrompts = sinon.stub()

export default function makeContext(projectConfig: GraphQLConfigData): Context {
  return {
    spinner: {
      start: sinon.stub().callsFake(console.log),
      fail: sinon.stub().callsFake(console.error),
      warn: sinon.stub().callsFake(console.warn),
      stop: sinon.fake(),
    },
    async getConfig() {
      return new GraphQLConfig(projectConfig, '.graphqlconfig')
    },
    async getProjectConfig() {
      return new GraphQLProjectConfig(projectConfig, '.graphqconfig')
    },
    prompt: (fakePrompt as unknown) as PromptModule,
  }
}
