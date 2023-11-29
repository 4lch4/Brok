import { logger } from '@4lch4/backpack'
import { Argument, Command, Option } from 'commander'
import { hostname } from 'os'
import { join } from 'path'

export class ConfigFilesCommand {
  // #region Private Properties & Functions
  private outDir: string = process.cwd()

  private async updateAliases(aliases: string[]) {
    try {
      logger.debug(`[DEBUG][updateAliases]: Successfully downloaded ${aliases.length} aliases.`)

      const scriptContent = `${aliases.join('\n')}\n`
      const scriptPath = join(this.outDir, 'aliases.sh')

      const file = Bun.file(scriptPath)
      if (await file.exists()) {
        const content = await file.text()

        if (content === scriptContent) {
          logger.success('[SUCCESS][updateAliases]: Aliases are up to date!')
          return
        }
      }

      const outRes = await Bun.write(scriptPath, scriptContent)

      if (outRes) {
        logger.success(
          `[SUCCESS][updateAliases]: Successfully wrote aliases to aliases.sh w/ ${outRes} bytes written.`
        )
      } else logger.error(`[ERROR][updateAliases]: Failed to write aliases to aliases.sh.`)
    } catch (error) {
      logger.error(`[ERROR][updateAliases]: Failed to save aliases to aliases.sh.`)
      logger.error(error)
    }
  }

  private async updateSecrets(secrets: string) {
    try {
      const scriptPath = join(this.outDir, 'secrets.env')
      const file = Bun.file(scriptPath)

      if (await file.exists()) {
        const content = await file.text()

        if (content === secrets) {
          logger.success('[SUCCESS][updateSecrets]: Variables are up to date!')
          return
        }
      }

      const outRes = await Bun.write(scriptPath, secrets)

      if (outRes) {
        logger.success(
          `[SUCCESS][updateSecrets]: Successfully wrote variables to variables.sh w/ ${outRes} bytes written.`
        )
      } else logger.error(`[ERROR][updateSecrets]: Failed to write variables to variables.sh.`)
    } catch (error) {
      logger.error(`[ERROR][updateSecrets]: Failed to save variables to variables.sh.`)
      logger.error(error)
    }
  }

  private getDownloadCmd(config: 'aliases' | 'secrets' | 'variables', suffix: string) {
    switch (config) {
      case 'aliases':
        return [
          'doppler',
          'secrets',
          'download',
          '-p',
          'device-configs',
          '-c',
          `aliases_${suffix}`,
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
          `secrets_${suffix}`,
          '--no-file',
          '--format',
          'env',
        ]
    }
  }

  private async getDopplerDetails(suffix: string) {
    let aliasDetails: { [key: string]: string } = {}
    let secretDetails: string = ''

    try {
      const aliasDownloadCmd = this.getDownloadCmd('aliases', suffix)
      const secretDownloadCmd = this.getDownloadCmd('secrets', suffix)

      logger.info(`[INFO][main]: Downloading aliases w/ ${aliasDownloadCmd.join(' ')}`)
      logger.info(`[INFO][main]: Downloading secrets w/ ${secretDownloadCmd.join(' ')}`)

      const aliasProc = Bun.spawn(aliasDownloadCmd)
      const secretProc = Bun.spawn(secretDownloadCmd)

      const stderr = await new Response(aliasProc.stderr).text()

      if (stderr) {
        logger.error('[ERROR]: Failed to download aliases!')
        logger.error(stderr)
      }

      aliasDetails = await new Response(aliasProc.stdout).json()
      secretDetails = await new Response(secretProc.stdout).text()
    } catch (error) {
      logger.error(`[ERROR][getDopplerDetails]: Failed to get Doppler details!`)
      logger.error(error)
    }

    return { aliasDetails, secretDetails }
  }

  private async getConfigDetails(suffix: string) {
    const secrets: string[] = []
    const aliases: string[] = []

    try {
      const { aliasDetails, secretDetails } = await this.getDopplerDetails(suffix)

      logger.info(
        `[INFO][main]: Successfully downloaded ${Object.keys(aliasDetails).length} aliases.`
      )

      if (aliasDetails) {
        // Iterate over each key in the object to create their alias commands.
        for (const key of Object.keys(aliasDetails)) {
          // If the key starts with doppler_ then it's actually a Doppler value I want to ignore.
          if (!key.toLowerCase().startsWith('doppler_')) {
            aliases.push(`alias ${key.toLowerCase()}='${aliasDetails[key]}'`)
          }
        }
      } else console.error('[ERROR][main]: Failed to download doppler json!')

      if (secretDetails) secrets.push(secretDetails)
    } catch (error) {
      console.error(`[ERROR][getDopplerDetails]: Failed to get Doppler details!`)
      console.error(error)
    }

    return { aliases, secrets: secrets.join('\n') }
  }

  private async run({ outDir, opts }: { outDir?: string; opts: { suffix?: string } }) {
    try {
      if (outDir) this.outDir = outDir

      const { aliases, secrets } = await this.getConfigDetails(
        opts.suffix || hostname().toLowerCase()
      )

      await this.updateAliases(aliases)
      await this.updateSecrets(secrets)
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
      .action(async (outDir, opts) => this.run({ outDir, opts }))

    return command
  }
}
