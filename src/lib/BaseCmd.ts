import { Command } from 'commander'

/** A class to be extended by all commands. */
export abstract class BaseCmd {
  abstract build(): Promise<Command>
}
