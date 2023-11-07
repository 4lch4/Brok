import { z } from 'zod'

export const RepoSchema = z.object({
  name: z.string().refine(name => name.startsWith('4lch4/'), {
    message: 'Invalid repo name',
  }),
  description: z.string().optional(),
  url: z.string().refine(url => url.startsWith('git@github.com')),
})

export enum TemplateRepos {
  'TypeScript-Module' = '4lch4/TypeScript-Module-Template',
}

export const Repos: { [key: string]: z.infer<typeof RepoSchema> } = {
  'TypeScript Module': {
    name: TemplateRepos['TypeScript-Module'],
    description: 'A template for creating TypeScript modules.',
    url: `git@github.com/${TemplateRepos['TypeScript-Module']}`,
  },
}
