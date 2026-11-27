import { z } from 'zod';

const REPOSITORY_API_URL =
  'https://api.github.com/repos/dshanmugapriyan/PulseWorks-AI';
export const REPOSITORY_URL = 'https://github.com/dshanmugapriyan/PulseWorks-AI';

const repositoryMetricsSchema = z.object({
  full_name: z.string().min(1),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  open_issues_count: z.number().int().nonnegative(),
  updated_at: z.string().datetime({ offset: true }),
});

export type RepositoryMetrics = z.infer<typeof repositoryMetricsSchema>;

export async function fetchRepositoryMetrics(): Promise<RepositoryMetrics> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

  try {
    let response: Response;
    try {
      response = await fetch(REPOSITORY_API_URL, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('The GitHub API request timed out. Please try again.');
      }
      throw new Error('Unable to reach the GitHub API. Check your connection and retry.', {
        cause: error,
      });
    }

    if (!response.ok) {
      throw new Error(`GitHub API request failed with status ${response.status}.`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('GitHub API returned invalid JSON.', { cause: error });
    }

    const result = repositoryMetricsSchema.safeParse(payload);
    if (!result.success) {
      throw new Error('GitHub API returned data in an unexpected format.');
    }

    return result.data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
