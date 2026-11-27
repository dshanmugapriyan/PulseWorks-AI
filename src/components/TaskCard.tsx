import type { TaskItem, TaskPriority, TaskStatus } from '../types/task';

interface TaskCardProps {
  task: TaskItem;
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  queued: 'bg-slate-800 text-slate-300',
  running: 'bg-cyan-500/10 text-cyan-300',
  review: 'bg-violet-500/10 text-violet-300',
  completed: 'bg-emerald-500/10 text-emerald-300',
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'text-slate-400',
  medium: 'text-sky-300',
  high: 'text-amber-300',
  critical: 'text-rose-300',
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <article
      aria-label={`Task ${task.id}: ${task.title}`}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500">{task.id}</p>
          <h2 className="mt-2 font-medium leading-6 text-white">{task.title}</h2>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[task.status]}`}>
          {task.status === 'review' ? 'In review' : task.status}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{task.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-800 pt-3 text-xs">
        <span className={`font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority} priority
        </span>
        <span className="text-slate-500">{task.agentPipeline}</span>
        <span className="text-slate-500">{task.dueDate}</span>
      </div>
    </article>
  );
}
