import { Menu, Plus, Sparkles } from 'lucide-react';
import { appEnv } from '../config/env';

interface NavbarProps {
  onOpenSidebar: () => void;
  onOpenCreateModal: () => void;
  showCreateTaskButton: boolean;
}

export function Navbar({
  onOpenSidebar,
  onOpenCreateModal,
  showCreateTaskButton,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-900 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-semibold tracking-tight text-white">{appEnv.VITE_APP_NAME}</span>
        </div>

        {showCreateTaskButton && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New task
          </button>
        )}
      </div>
    </header>
  );
}
