import { logger } from '@4lch4/backpack'
import { Argument, Command } from 'commander'

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

export function buildCreateCommand() {
  const templateArg = new Argument('<template>', 'The template to use for the project')
    .choices(AvailableTemplates.map(template => template.id))
    .argOptional()

  return new Command('create')
    .alias('c')
    .description('Create a new project')
    .addArgument(templateArg)
    .action(async template => {
      logger.info(`Creating a new project with the ${template} template...`)
    })
}
