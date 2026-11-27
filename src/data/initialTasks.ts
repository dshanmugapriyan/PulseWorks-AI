import type { TaskItem } from '../types/task';

function addDaysIso(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'PW-1042',
    title: 'Synthesize multi-region telemetry digest',
    description:
      'Aggregate hourly inference latency traces across us-east and eu-central workers and emit anomaly scores.',
    priority: 'high',
    status: 'running',
    category: 'pipeline',
    agentPipeline: 'DataPulse',
    maxTokens: 32768,
    dueDate: addDaysIso(1),
    tags: ['telemetry', 'anomaly-scan', 'hourly'],
    requireHumanApproval: false,
    progress: 68,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'PW-1043',
    title: 'Audit production prompt-injection guardrails',
    description:
      'Run adversarial policy suite against customer-facing tool routers before release sign-off.',
    priority: 'critical',
    status: 'review',
    category: 'audit',
    agentPipeline: 'SentinelQA',
    maxTokens: 65536,
    dueDate: addDaysIso(0),
    tags: ['security', 'guardrails', 'release'],
    requireHumanApproval: true,
    progress: 92,
    createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
  },
  {
    id: 'PW-1044',
    title: 'Generate SDK migration codemod for v2 endpoints',
    description:
      'Produce deterministic AST transforms and unit test fixtures for legacy REST webhook consumers.',
    priority: 'medium',
    status: 'queued',
    category: 'automation',
    agentPipeline: 'CodeSynth',
    maxTokens: 16384,
    dueDate: addDaysIso(3),
    tags: ['codemod', 'sdk', 'typescript'],
    requireHumanApproval: false,
    progress: 10,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'PW-1045',
    title: 'Benchmark sparse retrieval reranker accuracy',
    description:
      'Evaluate hybrid BM25 + dense vector scoring across 2,500 curated support transcripts.',
    priority: 'low',
    status: 'completed',
    category: 'research',
    agentPipeline: 'Orchestrator',
    maxTokens: 24576,
    dueDate: addDaysIso(5),
    tags: ['retrieval', 'evals'],
    requireHumanApproval: false,
    progress: 100,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

