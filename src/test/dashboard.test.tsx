import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { SystemBannerEngine } from '../lib/systemBannerEngine';

describe('SystemBannerEngine', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('sorts notices by severity and supports dismissal and restore', () => {
    const engine = new SystemBannerEngine({
      initialNotices: [
        {
          id: 'n-info',
          severity: 'info',
          title: 'Info Notice',
          message: 'General update',
          dismissible: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'n-incident',
          severity: 'incident',
          title: 'Incident Notice',
          message: 'Active incident',
          dismissible: false,
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    expect(engine.getActiveNotice()?.id).toBe('n-incident');
    engine.dismissNotice('n-incident');
    // Non-dismissible incident remains visible
    expect(engine.getActiveNotice()?.id).toBe('n-incident');

    engine.dismissNotice('n-info');
    expect(engine.getVisibleNotices().map((n) => n.id)).toEqual(['n-incident']);
    engine.restoreDismissed();
    expect(engine.getVisibleNotices().length).toBe(2);
  });
});

describe('PulseWorks AI Dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders system banner, navbar, sidebar, and initial task cards', () => {
    render(<App />);

    expect(screen.getByRole('region', { name: /system status banner/i })).toBeInTheDocument();
    expect(screen.getByText('PulseWorks AI')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /task status filters/i })).toBeInTheDocument();
    expect(screen.getByText('Synthesize multi-region telemetry digest')).toBeInTheDocument();
  });

  it('filters tasks using the sidebar status navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /queued/i }));

    expect(screen.getByText('Generate SDK migration codemod for v2 endpoints')).toBeInTheDocument();
    expect(screen.queryByText('Synthesize multi-region telemetry digest')).not.toBeInTheDocument();
  });

  it('enforces strict Zod validation in TaskCreationForm and dispatches valid tasks', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /new task/i }));
    const dialog = screen.getByRole('dialog');

    // Submit empty form -> should block with Zod validation errors
    await user.click(within(dialog).getByRole('button', { name: /dispatch task/i }));
    expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    expect(within(dialog).getAllByText(/Task title must be at least 3 characters/i).length).toBeGreaterThanOrEqual(1);
    expect(within(dialog).getByLabelText(/task title/i)).toHaveAttribute('aria-invalid', 'true');

    // Fill valid fields
    await user.type(within(dialog).getByLabelText(/task title/i), 'Deploy telemetry trace collector');
    await user.type(
      within(dialog).getByLabelText(/objective & instructions/i),
      'Deploy streaming OpenTelemetry collector across inference nodes.',
    );

    const tagInput = within(dialog).getByLabelText(/routing tags/i);
    await user.type(tagInput, 'otel-trace{Enter}');

    await user.click(within(dialog).getByRole('button', { name: /dispatch task/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Deploy telemetry trace collector')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: /system status banner/i })).getByText(
        'Task added to queue',
      ),
    ).toBeInTheDocument();
  });
});

