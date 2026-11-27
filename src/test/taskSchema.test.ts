import { describe, expect, it } from 'vitest';
import {
  extractTaskFieldErrors,
  getTodayIsoDate,
  taskCreationSchema,
  taskTagSchema,
} from '../schemas/taskSchema';

describe('taskCreationSchema', () => {
  const validPayload = {
    title: 'Synthesize weekly compliance audit',
    description: 'Scan all production agent tool calls and output signed compliance summary.',
    priority: 'medium' as const,
    category: 'audit' as const,
    agentPipeline: 'SentinelQA' as const,
    maxTokens: 16384,
    dueDate: getTodayIsoDate(),
    tags: ['compliance', 'weekly-scan'],
    requireHumanApproval: false,
  };

  it('accepts a valid task payload and trims strings', () => {
    const result = taskCreationSchema.safeParse({
      ...validPayload,
      title: '  Synthesize weekly compliance audit  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Synthesize weekly compliance audit');
    }
  });

  it('rejects critical tasks without human-in-the-loop approval', () => {
    const result = taskCreationSchema.safeParse({
      ...validPayload,
      priority: 'critical',
      requireHumanApproval: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = extractTaskFieldErrors(result.error);
      expect(errors.requireHumanApproval).toContain('Critical priority tasks');
    }
  });

  it('rejects tasks over 64,000 tokens without human-in-the-loop approval', () => {
    const result = taskCreationSchema.safeParse({
      ...validPayload,
      maxTokens: 65536,
      requireHumanApproval: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = extractTaskFieldErrors(result.error);
      expect(errors.requireHumanApproval).toContain('64,000 tokens');
    }
  });

  it('rejects past due dates and invalid tags', () => {
    const result = taskCreationSchema.safeParse({
      ...validPayload,
      dueDate: '2020-01-01',
      tags: ['bad tag!'],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = extractTaskFieldErrors(result.error);
      expect(errors.dueDate).toContain('past');
      expect(errors.tags).toBeTruthy();
    }
  });

  it('validates individual tags strictly', () => {
    expect(taskTagSchema.safeParse('agent-v2').success).toBe(true);
    expect(taskTagSchema.safeParse('a').success).toBe(false);
    expect(taskTagSchema.safeParse('bad--tag').success).toBe(false);
  });
});

