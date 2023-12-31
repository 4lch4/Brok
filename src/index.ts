#!/usr/bin/env bun

import { logger } from '@4lch4/backpack'
import { readPackageJSON } from '@4lch4/backpack/utils'
import { program } from 'commander'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { buildCommands } from './cmd'
import { PackageJSON } from './types'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function setup() {
  try {
    const pkg = (await readPackageJSON(
      join(__dirname, '..', 'package.json')
    )) as Required<PackageJSON>

    const Brok = program.name(pkg.name).description(pkg.description).version(pkg.version)

    for (const command of await buildCommands()) {
      Brok.addCommand(command)
    }

    return Brok.parse(process.argv)
  } catch (error) {
    logger.error('Error caught while setting up Brok...')
    logger.error(error)
    throw error
  }
}

setup().catch(console.error)
