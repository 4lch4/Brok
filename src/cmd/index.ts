import { Command } from 'commander'
import { AliasesCommand } from './aliases'
import { ConfigFilesCommand } from './config-files'
import { buildCreateCommand } from './create'

export async function buildCommands(): Promise<Command[]> {
  const configFilesCommand = await new ConfigFilesCommand().build()
  const aliasesCommand = await new AliasesCommand().build()
  const createCommand = buildCreateCommand()

  return [configFilesCommand, aliasesCommand, createCommand]
}
