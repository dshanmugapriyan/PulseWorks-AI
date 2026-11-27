import { z } from 'zod';

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const TASK_CATEGORIES = ['automation', 'inference', 'pipeline', 'audit', 'research'] as const;
export const AGENT_PIPELINES = ['Orchestrator', 'CodeSynth', 'DataPulse', 'SentinelQA'] as const;

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidIsoCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const taskTagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Each tag must be at least 2 characters.')
  .max(20, 'Each tag must be 20 characters or fewer.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Tags may only use lowercase letters, numbers, and single hyphens.');

export const taskCreationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Task title must be at least 3 characters.')
      .max(80, 'Task title cannot exceed 80 characters.')
      .regex(/^[a-zA-Z0-9]/, 'Task title must start with a letter or number.'),
    description: z
      .string()
      .trim()
      .min(10, 'Provide at least 10 characters describing the task objective.')
      .max(500, 'Description cannot exceed 500 characters.'),
    priority: z.enum(TASK_PRIORITIES, {
      errorMap: () => ({ message: 'Select a valid priority level.' }),
    }),
    category: z.enum(TASK_CATEGORIES, {
      errorMap: () => ({ message: 'Select a valid workload category.' }),
    }),
    agentPipeline: z.enum(AGENT_PIPELINES, {
      errorMap: () => ({ message: 'Select a valid AI agent pipeline.' }),
    }),
    maxTokens: z.coerce
      .number({
        invalid_type_error: 'Max token budget must be a valid number.',
      })
      .int('Max token budget must be a whole integer.')
      .min(256, 'Minimum token budget is 256 tokens.')
      .max(128000, 'Maximum token budget is 128,000 tokens.'),
    dueDate: z
      .string()
      .trim()
      .refine(isValidIsoCalendarDate, 'Enter a valid date in YYYY-MM-DD format.')
      .refine((dateStr) => dateStr >= getTodayIsoDate(), 'Due date cannot be in the past.'),
    tags: z
      .array(taskTagSchema)
      .min(1, 'Add at least 1 tag for task routing.')
      .max(5, 'You can attach up to 5 tags per task.')
      .refine((tags) => new Set(tags).size === tags.length, 'Duplicate tags are not allowed.'),
    requireHumanApproval: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.priority === 'critical' && !data.requireHumanApproval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requireHumanApproval'],
        message: 'Critical priority tasks must enforce human-in-the-loop approval.',
      });
    }
    if (data.maxTokens > 64000 && !data.requireHumanApproval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requireHumanApproval'],
        message: 'Tasks exceeding 64,000 tokens require human-in-the-loop approval.',
      });
    }
  });

export type TaskCreationInput = z.input<typeof taskCreationSchema>;
export type ValidatedTaskPayload = z.output<typeof taskCreationSchema>;
export type TaskFormField = keyof ValidatedTaskPayload;
export type TaskFieldErrors = Partial<Record<TaskFormField, string>>;

export function extractTaskFieldErrors(error: z.ZodError<ValidatedTaskPayload>): TaskFieldErrors {
  const fieldErrors: TaskFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as TaskFormField | undefined;
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

