import { Octokit } from '@octokit/rest';

/** This is a small "wrapper" class for interacting with the GitHub API. */
export class GitHub {
  private octokit: Octokit;

  /**
   * Creates a new instance of the GitHub utility class with the provided API token used for
   * authentication with the GitHub API.
   *
   * @param token A GitHub personal access token.
   */
  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }
}
