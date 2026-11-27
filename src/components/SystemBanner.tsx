import { useEffect, useSyncExternalStore } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Info, ShieldAlert, Wrench, X } from 'lucide-react';
import type { SystemBannerEngine } from '../lib/systemBannerEngine';
import type { SystemSeverity } from '../types/task';

interface SystemBannerProps {
  engine: SystemBannerEngine;
}

const BANNER_STYLES: Record<
  SystemSeverity,
  { icon: typeof CheckCircle2; classes: string; label: string }
> = {
  operational: {
    icon: CheckCircle2,
    classes: 'border-emerald-500/20 bg-emerald-950/40 text-emerald-200',
    label: 'Operational',
  },
  info: {
    icon: Info,
    classes: 'border-cyan-500/20 bg-cyan-950/40 text-cyan-200',
    label: 'Notice',
  },
  degraded: {
    icon: AlertTriangle,
    classes: 'border-amber-500/20 bg-amber-950/40 text-amber-200',
    label: 'Degraded',
  },
  maintenance: {
    icon: Wrench,
    classes: 'border-violet-500/20 bg-violet-950/40 text-violet-200',
    label: 'Maintenance',
  },
  incident: {
    icon: ShieldAlert,
    classes: 'border-rose-500/20 bg-rose-950/40 text-rose-200',
    label: 'Incident',
  },
};

export function SystemBanner({ engine }: SystemBannerProps) {
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);

  useEffect(() => {
    engine.startAutoRotation();
    return () => engine.stopAutoRotation();
  }, [engine]);

  if (!state.enabled) return null;

  const notice = engine.getActiveNotice();
  if (!notice) {
    return (
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-center text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          System notices hidden
        </span>
        <button
          type="button"
          onClick={() => engine.restoreDismissed()}
          className="ml-3 text-cyan-300 hover:text-cyan-200"
        >
          Restore
        </button>
      </div>
    );
  }

  const style = BANNER_STYLES[notice.severity];
  const Icon = style.icon;

  return (
    <div
      role="region"
      aria-label="System status banner"
      onMouseEnter={() => engine.setPaused(true)}
      onMouseLeave={() => engine.setPaused(false)}
      className={`border-b ${style.classes}`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="shrink-0 text-xs font-semibold">{style.label}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{notice.title}</p>
          <p className="truncate text-xs opacity-80">{notice.message}</p>
        </div>
        {notice.dismissible && (
          <button
            type="button"
            onClick={() => engine.dismissNotice(notice.id)}
            aria-label={`Dismiss ${notice.title}`}
            className="shrink-0 rounded-md p-1 text-current opacity-70 transition hover:bg-white/10 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
