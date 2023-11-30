/**
 * I want the Aliases command to be a way for me to add aliases to my shell and
 * have it stored using my regular backup method for dotfiles.
 */
import { logger } from '@4lch4/backpack'
import { Argument, Command } from 'commander'
import { BaseCmd } from '~/lib/index'

export class AliasesCommand extends BaseCmd {
  private async run() {}

  public async build() {
    logger.debug('[AliasesCommand][build]: Building aliases command.')

    const aliasName = new Argument('<alias-name>', 'The name of the alias, e.g. "g" for "git".')
    const aliasCommand = new Argument('<command>', 'The command to alias, e.g. "git".')

    return new Command('aliases')
      .description('Confidently add persisted aliases to your shell.')
      .addArgument(aliasName)
      .addArgument(aliasCommand)
      .action(this.run)
  }
}
