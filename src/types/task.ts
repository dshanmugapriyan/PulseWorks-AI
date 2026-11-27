export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'queued' | 'running' | 'review' | 'completed';
export type TaskCategory = 'automation' | 'inference' | 'pipeline' | 'audit' | 'research';
export type AgentPipeline = 'Orchestrator' | 'CodeSynth' | 'DataPulse' | 'SentinelQA';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  agentPipeline: AgentPipeline;
  maxTokens: number;
  dueDate: string;
  tags: string[];
  requireHumanApproval: boolean;
  progress: number;
  createdAt: string;
}

export type SystemSeverity = 'operational' | 'info' | 'degraded' | 'maintenance' | 'incident';

export interface SystemBannerNotice {
  id: string;
  severity: SystemSeverity;
  title: string;
  message: string;
  metricLabel?: string;
  actionLabel?: string;
  dismissible: boolean;
  updatedAt: string;
}

export type SidebarFilter = 'all' | TaskStatus;
export type WorkspacePage = 'tasks' | 'analytics' | 'settings';

