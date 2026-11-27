import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

const validMetrics = {
  full_name: 'dshanmugapriyan/PulseWorks-AI',
  stargazers_count: 7,
  forks_count: 2,
  open_issues_count: 3,
  updated_at: '2026-11-27T00:00:00Z',
};

function apiResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

describe('workspace pages', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('navigates between Tasks, Analytics, and Settings and loads public metrics', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(apiResponse(validMetrics));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Analytics' }));
    expect(await screen.findByText('Repository health')).toBeInTheDocument();
    expect(await screen.findByText('dshanmugapriyan/PulseWorks-AI')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.github.com/repos/dshanmugapriyan/PulseWorks-AI');
    expect(options.headers).not.toHaveProperty('Authorization');
    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('link', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText(/No task descriptions.*are sent to GitHub/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Tasks' }));
    expect(screen.getByRole('heading', { name: 'AI tasks' })).toBeInTheDocument();
  });

  it('rejects unexpected API data and allows a retry', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse({ ...validMetrics, stargazers_count: 'many' }))
      .mockResolvedValueOnce(apiResponse(validMetrics));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Analytics' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GitHub API returned data in an unexpected format.',
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => {
      expect(screen.getByText('dshanmugapriyan/PulseWorks-AI')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
