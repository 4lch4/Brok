import { Command } from 'commander'
import { BaseCmd } from '~/lib/BaseCmd'

export class CreateCommand extends BaseCmd {
  public async build() {
    return new Command('create')
      .alias('c')
      .description('Create a new project')
      .action(async () => {
        console.log('create')
      })
  }
}
