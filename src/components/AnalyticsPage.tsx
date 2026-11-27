import { useEffect, useState } from 'react';
import { fetchRepositoryMetrics, REPOSITORY_URL } from '../lib/githubRepoApi';
import type { TaskItem, TaskStatus } from '../types/task';

interface AnalyticsPageProps {
  tasks: TaskItem[];
}

const TASK_STATUSES: Array<{ id: TaskStatus; label: string; color: string }> = [
  { id: 'running', label: 'Running', color: 'bg-cyan-400' },
  { id: 'queued', label: 'Queued', color: 'bg-slate-400' },
  { id: 'review', label: 'In review', color: 'bg-violet-400' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-400' },
];

export function AnalyticsPage({ tasks }: AnalyticsPageProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [repositoryState, setRepositoryState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; fullName: string; stars: number; forks: number; issues: number; updatedAt: string }
  >({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setRepositoryState({ status: 'loading' });

    fetchRepositoryMetrics().then(
      (metrics) => {
        if (!active) return;
        setRepositoryState({
          status: 'success',
          fullName: metrics.full_name,
          stars: metrics.stargazers_count,
          forks: metrics.forks_count,
          issues: metrics.open_issues_count,
          updatedAt: metrics.updated_at,
        });
      },
      (error: unknown) => {
        if (!active) return;
        setRepositoryState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unable to load public repository metrics.',
        });
      },
    );

    return () => {
      active = false;
    };
  }, [retryCount]);

  const counts: Record<TaskStatus, number> = {
    queued: 0,
    running: 0,
    review: 0,
    completed: 0,
  };
  tasks.forEach((task) => {
    counts[task.status] += 1;
  });
  const total = tasks.length;
  const activeTasks = counts.running + counts.queued;

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-400">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Analytics</h1>
        <p className="mt-2 text-sm text-slate-400">
          Task activity and public project health at a glance.
        </p>
      </div>

      <section aria-label="Task analytics" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total tasks', value: total },
          { label: 'Active tasks', value: activeTasks },
          { label: 'Awaiting review', value: counts.review },
        ].map((metric) => (
          <article key={metric.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{metric.value}</p>
          </article>
        ))}
      </section>

      <section
        aria-label="Task status breakdown"
        className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6"
      >
        <h2 className="font-semibold text-white">Task status breakdown</h2>
        <div className="mt-5 space-y-4">
          {TASK_STATUSES.map((status) => {
            const count = counts[status.id];
            const percent = total === 0 ? 0 : (count / total) * 100;
            return (
              <div key={status.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-300">{status.label}</span>
                  <span className="text-slate-400">{count}</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-800"
                  role="progressbar"
                  aria-label={`${status.label} tasks`}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={count}
                >
                  <div className={`h-full rounded-full ${status.color}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        aria-label="Public repository metrics"
        className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-400">
              External API · public data
            </p>
            <h2 className="mt-2 font-semibold text-white">Repository health</h2>
            <p className="mt-1 text-sm text-slate-400">
              Live metadata from the public PulseWorks AI GitHub repository.
            </p>
          </div>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-cyan-300 hover:text-cyan-200"
          >
            View repository
          </a>
        </div>

        {repositoryState.status === 'loading' && (
          <p role="status" className="mt-5 text-sm text-slate-400">
            Loading public repository metrics…
          </p>
        )}
        {repositoryState.status === 'error' && (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-rose-300">{repositoryState.message}</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        )}
        {repositoryState.status === 'success' && (
          <>
            <p className="mt-5 text-xs text-slate-500">{repositoryState.fullName}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Stars', value: repositoryState.stars },
                { label: 'Forks', value: repositoryState.forks },
                { label: 'Open issues & pull requests', value: repositoryState.issues },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg bg-slate-950/70 px-4 py-3">
                  <p className="text-xs text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{metric.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Repository metadata updated {new Date(repositoryState.updatedAt).toLocaleString()}.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
