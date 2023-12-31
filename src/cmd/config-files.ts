import { logger } from '@4lch4/backpack'
import { Argument, Command, Option } from 'commander'
import { hostname } from 'os'
import { join } from 'path'
import { BaseCmd } from '~/lib/index'

export class ConfigFilesCommand extends BaseCmd {
  // #region Private Properties & Functions
  private outDir: string = process.cwd()

  private async updateAliases(aliases: string[]) {
    try {
      logger.debug(
        `[ConfigFilesCommand][updateAliases]: Successfully downloaded ${aliases.length} aliases.`
      )

      const scriptContent = `${aliases.join('\n')}\n`
      const scriptPath = join(this.outDir, 'aliases.sh')

      const file = Bun.file(scriptPath)
      if (await file.exists()) {
        const content = await file.text()

        if (content === scriptContent) {
          logger.success('[ConfigFilesCommand][updateAliases]: Aliases are up to date!')
          return
        }
      }

      const outRes = await Bun.write(scriptPath, scriptContent)

      if (outRes) {
        logger.success(
          `[ConfigFilesCommand][updateAliases]: Successfully wrote aliases to aliases.sh w/ ${outRes} bytes written.`
        )
      } else
        logger.error(`[ConfigFilesCommand][updateAliases]: Failed to write aliases to aliases.sh.`)
    } catch (error) {
      logger.error(`[ConfigFilesCommand][updateAliases]: Failed to save aliases to aliases.sh.`)
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
          logger.success('[ConfigFilesCommand][updateSecrets]: Variables are up to date!')
          return
        }
      }

      const outRes = await Bun.write(scriptPath, secrets)

      if (outRes) {
        logger.success(
          `[ConfigFilesCommand][updateSecrets]: Successfully wrote variables to variables.sh w/ ${outRes} bytes written.`
        )
      } else
        logger.error(
          `[ConfigFilesCommand][updateSecrets]: Failed to write variables to variables.sh.`
        )
    } catch (error) {
      logger.error(`[ConfigFilesCommand][updateSecrets]: Failed to save variables to variables.sh.`)
      logger.error(error)
    }
  }

  private getDownloadCmd(config: 'aliases' | 'secrets' | 'variables', suffix: string) {
    const cmdPrefix = ['doppler', 'secrets', 'download', '-p', 'device-configs']
    const cmdSuffix = ['--no-file', '2>&1']

    switch (config) {
      case 'aliases':
        return [...cmdPrefix, '-c', `aliases_${suffix}`, ...cmdSuffix]

      case 'secrets':
      case 'variables':
        return [...cmdPrefix, '-c', `secrets_${suffix}`, '--format', 'env', ...cmdSuffix]
    }
  }

  private async getDopplerDetails(suffix: string) {
    let aliasDetails: { [key: string]: string } = {}
    let secretDetails: string = ''

    try {
      const aliasDownloadCmd = this.getDownloadCmd('aliases', suffix)
      const secretDownloadCmd = this.getDownloadCmd('secrets', suffix)

      logger.debug(
        `[ConfigFilesCommand][getDopplerDetails]: Downloading aliases w/ ${aliasDownloadCmd.join(
          ' '
        )}`
      )
      logger.debug(
        `[ConfigFilesCommand][getDopplerDetails]: Downloading secrets w/ ${secretDownloadCmd.join(
          ' '
        )}`
      )

      const aliasProc = Bun.spawn(aliasDownloadCmd)
      const secretProc = Bun.spawn(secretDownloadCmd)

      const stderr = await new Response(aliasProc.stderr).text()

      if (stderr) {
        logger.error('[ConfigFilesCommand][getDopplerDetails]: Failed to download aliases!')
        logger.error(stderr)
      }

      aliasDetails = await new Response(aliasProc.stdout).json()
      secretDetails = await new Response(secretProc.stdout).text()
    } catch (error) {
      logger.error(`[ConfigFilesCommand][getDopplerDetails]: Failed to get Doppler details!`)
      logger.error(error)
    }

    return { aliasDetails, secretDetails }
  }

  private async getConfigDetails(suffix: string) {
    const secrets: string[] = []
    const aliases: string[] = []

    try {
      const { aliasDetails, secretDetails } = await this.getDopplerDetails(suffix)

      logger.success(
        `[ConfigFilesCommand][getConfigDetails]: Successfully downloaded ${
          Object.keys(aliasDetails).length
        } aliases.`
      )

      if (aliasDetails) {
        // Iterate over each key in the object to create their alias commands.
        for (const key of Object.keys(aliasDetails)) {
          // If the key starts with doppler_ then it's actually a Doppler value I want to ignore.
          if (!key.toLowerCase().startsWith('doppler_')) {
            aliases.push(`alias ${key.toLowerCase()}='${aliasDetails[key]}'`)
          }
        }
      } else
        console.error('[ConfigFilesCommand][getConfigDetails]: Failed to download doppler json!')

      if (secretDetails) secrets.push(secretDetails)
    } catch (error) {
      console.error(`[ConfigFilesCommand][getConfigDetails]: Failed to get Doppler details!`)
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
      logger.error(`[ConfigFilesCommand][run]: Failed to download aliases!`)
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
