export interface PackageJSON {
  name: string
  displayName: string
  version: string
  description: string
  keywords: string[]
  homepage: string
  bugs: Bugs
  repository: Repository
  license: string
  author: Author
  type: string
  exports: string
  main: string
  types: string
  files: string[]
  scripts: Scripts
  dependencies: { [key: string]: string }
  devDependencies: { [key: string]: string }
  engines: Engines
}

export interface Author {
  name: string
  email: string
  url: string
}

export interface Bugs {
  url: string
  email: string
}

export interface Engines {
  node: string
}

export interface Repository {
  type: string
  url: string
}

export interface Scripts {
  build: string
  lint: string
  pretty: string
  start: string
  test: string
}
