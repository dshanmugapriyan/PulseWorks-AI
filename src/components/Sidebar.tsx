import { useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Layers,
  Play,
  Settings,
  X,
} from 'lucide-react';
import type { SidebarFilter, WorkspacePage } from '../types/task';

interface SidebarProps {
  activePage: WorkspacePage;
  onSelectPage: (page: WorkspacePage) => void;
  activeFilter: SidebarFilter;
  onSelectFilter: (filter: SidebarFilter) => void;
  counts: Record<SidebarFilter, number>;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: SidebarFilter;
  label: string;
  icon: typeof Layers;
}> = [
  { id: 'all', label: 'All tasks', icon: Layers },
  { id: 'running', label: 'Running', icon: Play },
  { id: 'queued', label: 'Queued', icon: Clock3 },
  { id: 'review', label: 'In review', icon: Clock3 },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export function Sidebar({
  activePage,
  onSelectPage,
  activeFilter,
  onSelectFilter,
  counts,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const navigation = (
    <div className="space-y-5 p-3">
      <nav aria-label="Workspace navigation" className="space-y-1">
        <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Workspace
        </p>
        {(
          [
            { id: 'tasks', label: 'Tasks', icon: Layers },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const selected = activePage === item.id;
          return (
            <a
              key={item.id}
              href={`#/${item.id}`}
              aria-current={selected ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault();
                onSelectPage(item.id);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                selected
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {activePage === 'tasks' && (
        <nav aria-label="Task status filters" className="space-y-1 border-t border-slate-800 pt-4">
          <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Filter tasks
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const selected = activeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={selected ? 'true' : undefined}
                onClick={() => {
                  onSelectFilter(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                  selected
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </span>
                <span className="text-xs text-slate-500">{counts[item.id]}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-slate-800 lg:block">
        {navigation}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-slate-950/70"
          />
          <aside className="relative w-72 max-w-[85vw] border-r border-slate-800 bg-slate-950">
            <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
              <span className="text-sm font-medium text-white">Navigation</span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </>
  );
}
