#!/usr/bin/env bun

import { logger } from '@4lch4/backpack'
import { pc } from '@4lch4/backpack/vendors'
import { program } from 'commander'
import pkg from '../package.json'
import { buildCommands } from './cmd'

async function setup() {
  try {
    const Brok = program
      .name(pkg.name)
      .description(pkg.description)
      .version(pkg.version)
      .showSuggestionAfterError(true)

    for (const command of await buildCommands()) {
      Brok.addCommand(command)
    }

    return Brok.parse(process.argv)
  } catch (error) {
    logger.error(pc.red('Error caught while setting up Brok...'))
    logger.error(error)
    throw error
  }
}

setup().catch(logger.error)
