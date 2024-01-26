import { Command } from 'commander'
// import { AliasesCommand } from './aliases'
// import { ConfigFilesCommand } from './config-files'
import { CreateCommand } from './Create'
// import { SyncCommand } from './sync'

export async function buildCommands(): Promise<Command[]> {
  // const configFilesCommand = await new ConfigFilesCommand().build()
  // const aliasesCommand = await new AliasesCommand().build()
  // const createCommand = await new CreateCommand().build()
  // const syncCommand = await new SyncCommand().build()

  return [await new CreateCommand().build()]
}
