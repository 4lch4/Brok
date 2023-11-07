#!/usr/bin/env node

import { logger } from '@4lch4/backpack'
import { Argument, Command, program } from 'commander'
import fs from 'fs-extra'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { PackageJSON } from './types/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

type TemplateInfo = {
  id: string
  name: string
  description: string
}

const AvailableTemplates: TemplateInfo[] = [
  {
    id: 'ts-module',
    name: 'TypeScript Module',
    description: 'A simple TypeScript module with a build script and a test script.',
  },
  {
    id: 'elysia-api',
    name: 'Elysia API',
    description: 'A template for creating an API with the Elysia framework.',
  },
]

function buildCreateCommand() {
  const templateArg = new Argument('<template>', 'The template to use for the project')
    .choices(AvailableTemplates.map(template => template.id))
    .argOptional()

  return new Command('create')
    .description('Create a new project')
    .addArgument(templateArg)
    .action(async template => {
      logger.info(`Creating a new project with the ${template} template...`)
    })
}

async function setup() {
  try {
    const pkg = (await fs.readJson(join(__dirname, '..', 'package.json'))) as PackageJSON
    const Brok = program.name(pkg.name).description(pkg.description).version(pkg.version)

    Brok.addCommand(buildCreateCommand())

    return Brok.parse(process.argv)
  } catch (error) {
    logger.error('Error caught while setting up Brok...')
    logger.error(error)
    throw error
  }
}

setup()
  .then(Brok => {
    logger.info('Brok setup complete!')
    return Brok
  })
  .catch(() => process.exit(1))
