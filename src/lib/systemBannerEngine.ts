import type { SystemBannerNotice, SystemSeverity } from '../types/task';

const SEVERITY_PRIORITY: Record<SystemSeverity, number> = {
  incident: 5,
  degraded: 4,
  maintenance: 3,
  info: 2,
  operational: 1,
};

const STORAGE_KEY = 'pulseworks.dismissed_banners.v1';

export interface SystemBannerState {
  enabled: boolean;
  notices: SystemBannerNotice[];
  activeIndex: number;
  dismissedIds: string[];
  paused: boolean;
  latencyMs: number;
  lastSyncedAt: string;
}

export interface SystemBannerConfig {
  enabled?: boolean;
  defaultSeverity?: SystemSeverity;
  dismissible?: boolean;
  rotationIntervalMs?: number;
  initialNotices?: SystemBannerNotice[];
}

type Listener = () => void;

function readPersistedDismissals(): string[] {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage?.getItem !== 'function') {
      return [];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writePersistedDismissals(ids: string[]): void {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage?.setItem !== 'function') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function buildDefaultSystemNotices(
  defaultSeverity: SystemSeverity = 'operational',
  dismissible = true,
): SystemBannerNotice[] {
  const now = new Date().toISOString();
  const primaryByLevel: Record<SystemSeverity, SystemBannerNotice> = {
    operational: {
      id: 'sys-core-operational',
      severity: 'operational',
      title: 'All AI Clusters Operational',
      message: 'Orchestrator, CodeSynth, DataPulse, and SentinelQA pipelines are running at nominal throughput.',
      metricLabel: '99.98% uptime · 42ms p95',
      dismissible,
      updatedAt: now,
    },
    info: {
      id: 'sys-core-info',
      severity: 'info',
      title: 'PulseWorks Model Routing v2.4 Active',
      message: 'Dynamic token budgeting and client-side Zod task guardrails are enabled across all queues.',
      metricLabel: '8 worker slots ready',
      dismissible,
      updatedAt: now,
    },
    degraded: {
      id: 'sys-core-degraded',
      severity: 'degraded',
      title: 'Elevated Queue Latency',
      message: 'High-concurrency inference workers are experiencing brief queue bursts; critical tasks remain prioritized.',
      metricLabel: '188ms p95 · Auto-scaling',
      dismissible,
      updatedAt: now,
    },
    maintenance: {
      id: 'sys-core-maintenance',
      severity: 'maintenance',
      title: 'Scheduled Vector Index Checkpoint',
      message: 'Rolling index compaction is running in us-east-1 with zero expected task drops.',
      metricLabel: 'Window: 15m remaining',
      dismissible,
      updatedAt: now,
    },
    incident: {
      id: 'sys-core-incident',
      severity: 'incident',
      title: 'External Webhook Rate Limit Detected',
      message: 'Outbound callback retries are queued automatically; human-approval gates remain enforced.',
      metricLabel: 'Mitigation active',
      dismissible: false,
      updatedAt: now,
    },
  };

  const notices: SystemBannerNotice[] = [primaryByLevel[defaultSeverity]];
  if (defaultSeverity !== 'info') {
    notices.push(primaryByLevel.info);
  }
  return notices;
}

export class SystemBannerEngine {
  private state: SystemBannerState;
  private listeners = new Set<Listener>();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private rotationIntervalMs: number;

  constructor(config: SystemBannerConfig = {}) {
    const enabled = config.enabled ?? true;
    const dismissible = config.dismissible ?? true;
    const defaultSeverity = config.defaultSeverity ?? 'operational';
    this.rotationIntervalMs = config.rotationIntervalMs ?? 30000;

    const initial = config.initialNotices ?? buildDefaultSystemNotices(defaultSeverity, dismissible);

    this.state = {
      enabled,
      notices: this.sortNotices(initial),
      activeIndex: 0,
      dismissedIds: readPersistedDismissals(),
      paused: false,
      latencyMs: 42,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  private sortNotices(notices: SystemBannerNotice[]): SystemBannerNotice[] {
    return [...notices].sort((a, b) => SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity]);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SystemBannerState => this.state;

  getVisibleNotices(): SystemBannerNotice[] {
    if (!this.state.enabled) return [];
    const dismissed = new Set(this.state.dismissedIds);
    return this.state.notices.filter((notice) => !notice.dismissible || !dismissed.has(notice.id));
  }

  getActiveNotice(): SystemBannerNotice | null {
    const visible = this.getVisibleNotices();
    if (visible.length === 0) return null;
    const safeIndex = this.state.activeIndex % visible.length;
    return visible[safeIndex] ?? null;
  }

  startAutoRotation(): void {
    if (this.timerId !== null) return;
    this.timerId = setInterval(() => {
      if (!this.state.paused && this.getVisibleNotices().length > 1) {
        this.nextNotice();
      }
    }, this.rotationIntervalMs);
  }

  stopAutoRotation(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  setPaused(paused: boolean): void {
    if (this.state.paused === paused) return;
    this.state = { ...this.state, paused };
    this.emit();
  }

  nextNotice(): void {
    const visible = this.getVisibleNotices();
    if (visible.length <= 1) return;
    this.state = {
      ...this.state,
      activeIndex: (this.state.activeIndex + 1) % visible.length,
    };
    this.emit();
  }

  prevNotice(): void {
    const visible = this.getVisibleNotices();
    if (visible.length <= 1) return;
    this.state = {
      ...this.state,
      activeIndex: (this.state.activeIndex - 1 + visible.length) % visible.length,
    };
    this.emit();
  }

  pushNotice(notice: SystemBannerNotice): void {
    const withoutDup = this.state.notices.filter((item) => item.id !== notice.id);
    const dismissedIds = this.state.dismissedIds.filter((id) => id !== notice.id);
    writePersistedDismissals(dismissedIds);
    this.state = {
      ...this.state,
      notices: this.sortNotices([notice, ...withoutDup]),
      dismissedIds,
      activeIndex: 0,
      lastSyncedAt: new Date().toISOString(),
    };
    this.emit();
  }

  dismissNotice(id: string): void {
    const target = this.state.notices.find((n) => n.id === id);
    if (!target || !target.dismissible) return;
    if (this.state.dismissedIds.includes(id)) return;
    const dismissedIds = [...this.state.dismissedIds, id];
    writePersistedDismissals(dismissedIds);
    this.state = {
      ...this.state,
      dismissedIds,
      activeIndex: 0,
    };
    this.emit();
  }

  restoreDismissed(): void {
    writePersistedDismissals([]);
    this.state = {
      ...this.state,
      dismissedIds: [],
      activeIndex: 0,
    };
    this.emit();
  }

  refreshTelemetry(simulatedLatencyMs?: number): void {
    const latencyMs = simulatedLatencyMs ?? Math.floor(34 + Math.random() * 28);
    this.state = {
      ...this.state,
      latencyMs,
      lastSyncedAt: new Date().toISOString(),
    };
    this.emit();
  }
}

