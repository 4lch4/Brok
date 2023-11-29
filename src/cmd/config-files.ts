import { logger } from '@4lch4/backpack'
import { Argument, Command, Option, program } from 'commander'
import { hostname } from 'os'
import { join } from 'path'
import { BASH_SCRIPT_STARTER } from '../constants'

export class ConfigFilesCommand {
  // #region Private Properties & Functions
  private outDir: string = process.cwd()

  private async updateAliases(aliases: string[]) {
    try {
      logger.debug(`[DEBUG][saveAliases]: Successfully downloaded ${aliases.length} aliases.`)

      const scriptContent = `${BASH_SCRIPT_STARTER}\n\n${aliases.join('\n')}\n`
      const scriptPath = join(this.outDir, 'aliases.sh')

      const file = Bun.file(scriptPath)
      if (await file.exists()) {
        const content = await file.text()

        if (content === scriptContent) {
          logger.success('[SUCCESS][saveAliases]: Aliases are up to date!')
          return
        }
      }

      const outRes = await Bun.write(scriptPath, scriptContent)

      if (outRes) {
        logger.success(
          `[SUCCESS][saveAliases]: Successfully wrote aliases to aliases.sh w/ ${outRes} bytes written.`
        )
      } else logger.error(`[ERROR][saveAliases]: Failed to write aliases to aliases.sh.`)
    } catch (error) {
      logger.error(`[ERROR][saveAliases]: Failed to save aliases to aliases.sh.`)
      logger.error(error)
    }
  }

  private async updateVariables(variables: string[]) {
    try {
      logger.debug(`[DEBUG][saveVariables]: Successfully downloaded ${variables.length} variables.`)

      const scriptContent = `${BASH_SCRIPT_STARTER}\n\n${variables.join('\n')}\n`
      const scriptPath = join(this.outDir, 'variables.sh')

      const file = Bun.file(scriptPath)

      if (await file.exists()) {
        const content = await file.text()

        if (content === scriptContent) {
          logger.success('[SUCCESS][saveVariables]: Variables are up to date!')
          return
        }
      }

      const outRes = await Bun.write(scriptPath, scriptContent)

      if (outRes) {
        logger.success(
          `[SUCCESS][saveVariables]: Successfully wrote variables to variables.sh w/ ${outRes} bytes written.`
        )
      } else logger.error(`[ERROR][saveVariables]: Failed to write variables to variables.sh.`)
    } catch (error) {
      logger.error(`[ERROR][saveVariables]: Failed to save variables to variables.sh.`)
      logger.error(error)
    }
  }

  private getDownloadCmd(config: 'aliases' | 'secrets' | 'variables') {
    switch (config) {
      case 'aliases':
        return [
          'doppler',
          'secrets',
          'download',
          '-p',
          'device-configs',
          '-c',
          'aliases',
          '--no-file',
        ]

      case 'secrets':
      case 'variables':
        return [
          'doppler',
          'secrets',
          'download',
          '-p',
          'device-configs',
          '-c',
          'aliases',
          '--no-file',
          '--format',
          'env',
        ]
    }
  }

  private async getDopplerDetails() {
    try {
      const aliasDownloadCmd = this.getDownloadCmd('aliases')
      const secretDownloadCmd = this.getDownloadCmd('secrets')

      const aliasProc = Bun.spawn(aliasDownloadCmd)
      const secretProc = Bun.spawn(secretDownloadCmd)

      const stderr = await new Response(aliasProc.stderr).text()

      if (stderr) {
        logger.error('[ERROR]: Failed to download aliases!')
        logger.error(stderr)
      }

      return {
        aliasDetails: (await new Response(aliasProc.stdout).json()) as { [key: string]: string },
        secretDetails: (await new Response(secretProc.stdout).json()) as { [key: string]: string },
      }
    } catch (error) {
      throw error
    }
  }

  private async getConfigDetails() {
    const secrets: string[] = []
    const aliases: string[] = []

    try {
      const { aliasDetails, secretDetails } = await this.getDopplerDetails()

      if (aliasDetails) {
        // Iterate over each key in the object to create their alias commands.
        for (const key of Object.keys(aliasDetails)) {
          // If the key starts with doppler_ then it's actually a Doppler value I want to ignore.
          if (!key.toLowerCase().startsWith('doppler_')) {
            aliases.push(`alias ${key.toLowerCase()}='${aliasDetails[key]}'`)
          }
        }
      } else console.error('[ERROR][main]: Failed to download doppler json!')

      if (secretDetails) {
        // Iterate over each key in the object to create the array of secrets.
        for (const key of Object.keys(secretDetails)) {
          // If the key starts with doppler_ then it's actually a Doppler value I want to ignore.
          if (!key.toLowerCase().startsWith('doppler_')) {
            secrets.push(`${key}='${secretDetails[key]}'`)
          }
        }
      }
    } catch (error) {
      console.error(`[ERROR][getDopplerDetails]: Failed to get Doppler details!`)
      console.error(error)
    }

    return { aliases, secrets }
  }

  private async run(outDir?: string) {
    try {
      if (outDir) this.outDir = outDir
      const opts = program.opts()

      logger.info(`[INFO][main]: Received opts ${JSON.stringify(opts, null, 2)}`)

      const { aliases, secrets } = await this.getConfigDetails()

      await this.updateAliases(aliases)
      await this.updateVariables(secrets)
    } catch (error) {
      logger.error(`[ERROR][main]: Failed to download aliases!`)
      logger.error(error)
    }
  }
  // #endregion Private Properties & Functions

  public async build() {
    const command = new Command('config-files').alias('cfg').alias('config').alias('cfg')

    const outDirArg = new Argument(
      '[outDir]',
      'The directory to save the config files to.'
    ).default(this.outDir)

    const configSuffix = new Option(
      '-s, --suffix [suffix]',
      'The suffix to use for the Doppler config name. Defaults to the hostname.'
    )
      .default(hostname().toLowerCase())
      .env('DOPPLER_CONFIG_SUFFIX')

    command
      .description('Creates the latest config files for the local machine.')
      .addArgument(outDirArg)
      .addOption(configSuffix)

      .action(this.run)

    return command
  }
}
