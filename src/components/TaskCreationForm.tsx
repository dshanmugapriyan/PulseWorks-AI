import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AlertCircle, Plus, ShieldCheck, Sparkles, X } from 'lucide-react';
import { appEnv } from '../config/env';
import {
  AGENT_PIPELINES,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  extractTaskFieldErrors,
  getTodayIsoDate,
  taskCreationSchema,
  taskTagSchema,
  type TaskCreationInput,
  type TaskFieldErrors,
  type TaskFormField,
  type ValidatedTaskPayload,
} from '../schemas/taskSchema';

interface TaskCreationFormProps {
  open: boolean;
  onClose: () => void;
  onCreateTask: (payload: ValidatedTaskPayload) => void;
}

const TOKEN_PRESETS = [4096, 16384, 32768, 65536, 128000] as const;

function createInitialDraft(): TaskCreationInput {
  return {
    title: '',
    description: '',
    priority: 'medium',
    category: 'automation',
    agentPipeline: 'Orchestrator',
    maxTokens: appEnv.VITE_DEFAULT_MAX_TOKENS,
    dueDate: getTodayIsoDate(),
    tags: [],
    requireHumanApproval: false,
  };
}

export function TaskCreationForm({ open, onClose, onCreateTask }: TaskCreationFormProps) {
  const [draft, setDraft] = useState<TaskCreationInput>(createInitialDraft);
  const [tagInput, setTagInput] = useState('');
  const [tagDraftError, setTagDraftError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<TaskFormField, boolean>>>({});
  const [errors, setErrors] = useState<TaskFieldErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const resetForm = () => {
    setDraft(createInitialDraft());
    setTagInput('');
    setTagDraftError(null);
    setTouched({});
    setErrors({});
    setSubmittedOnce(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const runValidation = (
    nextDraft: TaskCreationInput,
    nextTouched: Partial<Record<TaskFormField, boolean>> = touched,
    forceAll = submittedOnce,
  ) => {
    const parsed = taskCreationSchema.safeParse(nextDraft);
    if (parsed.success) {
      setErrors({});
      return parsed;
    }
    const allErrors = extractTaskFieldErrors(parsed.error);
    if (forceAll) {
      setErrors(allErrors);
    } else {
      const filtered: TaskFieldErrors = {};
      for (const [key, message] of Object.entries(allErrors) as Array<[TaskFormField, string]>) {
        if (nextTouched[key]) {
          filtered[key] = message;
        }
      }
      setErrors(filtered);
    }
    return parsed;
  };

  const updateField = <K extends TaskFormField>(field: K, value: TaskCreationInput[K]) => {
    const nextDraft = { ...draft, [field]: value };
    const nextTouched = { ...touched, [field]: true };
    setDraft(nextDraft);
    setTouched(nextTouched);
    runValidation(nextDraft, nextTouched);
  };

  const markTouched = (field: TaskFormField) => {
    const nextTouched = { ...touched, [field]: true };
    setTouched(nextTouched);
    runValidation(draft, nextTouched);
  };

  const handleAddTag = () => {
    const parsedTag = taskTagSchema.safeParse(tagInput);
    if (!parsedTag.success) {
      setTagDraftError(parsedTag.error.issues[0]?.message ?? 'Invalid tag.');
      return;
    }
    if (draft.tags.includes(parsedTag.data)) {
      setTagDraftError(`Tag "${parsedTag.data}" is already added.`);
      return;
    }
    if (draft.tags.length >= 5) {
      setTagDraftError('Maximum of 5 tags allowed per task.');
      return;
    }

    const nextTags = [...draft.tags, parsedTag.data];
    setTagInput('');
    setTagDraftError(null);
    updateField('tags', nextTags);
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = draft.tags.filter((tag) => tag !== tagToRemove);
    updateField('tags', nextTags);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedOnce(true);
    const result = runValidation(draft, touched, true);
    if (!result.success) {
      return;
    }
    onCreateTask(result.data);
    resetForm();
    onClose();
  };

  const requiresApprovalGuard =
    draft.priority === 'critical' || Number(draft.maxTokens) > 64000;
  const errorEntries = Object.entries(errors).filter(([, msg]) => Boolean(msg));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 id="create-task-title" className="text-base font-semibold text-white">
                Create Orchestrated AI Task
              </h2>
              <p className="text-xs text-slate-400">
                Validated strictly via client-side Zod schema before queue dispatch.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close task creation form"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
          {submittedOnce && errorEntries.length > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-3.5 text-xs text-rose-200"
            >
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Please fix {errorEntries.length} validation issue(s) before submitting:</span>
              </div>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-rose-200/90">
                {errorEntries.map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="task-title" className="text-sm font-medium text-slate-200">
                Task Title <span className="text-rose-400">*</span>
              </label>
              <span className="font-mono text-[11px] text-slate-400">
                {draft.title.trim().length}/80
              </span>
            </div>
            <input
              id="task-title"
              name="title"
              type="text"
              value={draft.title}
              onChange={(e) => updateField('title', e.target.value)}
              onBlur={() => markTouched('title')}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'task-title-error' : undefined}
              placeholder="e.g. Audit multi-agent tool fallback policies"
              className={`w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:outline-none ${
                errors.title
                  ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-800 focus:border-cyan-500/60 focus:ring-cyan-500/20'
              }`}
            />
            {errors.title && (
              <p id="task-title-error" className="mt-1.5 text-xs text-rose-400">
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="task-description" className="text-sm font-medium text-slate-200">
                Objective & Instructions <span className="text-rose-400">*</span>
              </label>
              <span className="font-mono text-[11px] text-slate-400">
                {draft.description.trim().length}/500
              </span>
            </div>
            <textarea
              id="task-description"
              name="description"
              rows={3}
              value={draft.description}
              onChange={(e) => updateField('description', e.target.value)}
              onBlur={() => markTouched('description')}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'task-description-error' : undefined}
              placeholder="Describe expected outputs, guardrails, and target dataset or repository..."
              className={`w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:outline-none ${
                errors.description
                  ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-800 focus:border-cyan-500/60 focus:ring-cyan-500/20'
              }`}
            />
            {errors.description && (
              <p id="task-description-error" className="mt-1.5 text-xs text-rose-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* Priority, Category, Pipeline */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="task-priority" className="mb-1.5 block text-sm font-medium text-slate-200">
                Priority
              </label>
              <select
                id="task-priority"
                name="priority"
                value={draft.priority}
                onChange={(e) =>
                  updateField('priority', e.target.value as TaskCreationInput['priority'])
                }
                aria-invalid={Boolean(errors.priority)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-white capitalize focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-category" className="mb-1.5 block text-sm font-medium text-slate-200">
                Category
              </label>
              <select
                id="task-category"
                name="category"
                value={draft.category}
                onChange={(e) =>
                  updateField('category', e.target.value as TaskCreationInput['category'])
                }
                aria-invalid={Boolean(errors.category)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-white capitalize focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-pipeline" className="mb-1.5 block text-sm font-medium text-slate-200">
                Agent Pipeline
              </label>
              <select
                id="task-pipeline"
                name="agentPipeline"
                value={draft.agentPipeline}
                onChange={(e) =>
                  updateField('agentPipeline', e.target.value as TaskCreationInput['agentPipeline'])
                }
                aria-invalid={Boolean(errors.agentPipeline)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              >
                {AGENT_PIPELINES.map((pipeline) => (
                  <option key={pipeline} value={pipeline}>
                    {pipeline}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Tokens & Due Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-tokens" className="mb-1.5 block text-sm font-medium text-slate-200">
                Max Token Budget <span className="text-rose-400">*</span>
              </label>
              <input
                id="task-tokens"
                name="maxTokens"
                type="number"
                min={256}
                max={128000}
                step={256}
                value={draft.maxTokens === undefined ? '' : String(draft.maxTokens)}
                onChange={(e) =>
                  updateField('maxTokens', e.target.value === '' ? ('' as unknown as number) : Number(e.target.value))
                }
                onBlur={() => markTouched('maxTokens')}
                aria-invalid={Boolean(errors.maxTokens)}
                aria-describedby={errors.maxTokens ? 'task-tokens-error' : undefined}
                className={`w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 font-mono text-sm text-white focus:ring-2 focus:outline-none ${
                  errors.maxTokens
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-cyan-500/60 focus:ring-cyan-500/20'
                }`}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TOKEN_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateField('maxTokens', preset)}
                    className={`rounded-md border px-2 py-0.5 font-mono text-[11px] transition ${
                      Number(draft.maxTokens) === preset
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset >= 1000 ? `${Math.round(preset / 1024)}k` : preset}
                  </button>
                ))}
              </div>
              {errors.maxTokens && (
                <p id="task-tokens-error" className="mt-1.5 text-xs text-rose-400">
                  {errors.maxTokens}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="task-due-date" className="mb-1.5 block text-sm font-medium text-slate-200">
                Target Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="task-due-date"
                name="dueDate"
                type="date"
                value={draft.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
                onBlur={() => markTouched('dueDate')}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={errors.dueDate ? 'task-due-date-error' : undefined}
                className={`w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 font-mono text-sm text-white focus:ring-2 focus:outline-none ${
                  errors.dueDate
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-cyan-500/60 focus:ring-cyan-500/20'
                }`}
              />
              {errors.dueDate && (
                <p id="task-due-date-error" className="mt-1.5 text-xs text-rose-400">
                  {errors.dueDate}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="task-tag-input" className="text-sm font-medium text-slate-200">
                Routing Tags (1–5) <span className="text-rose-400">*</span>
              </label>
              <span className="font-mono text-[11px] text-slate-400">{draft.tags.length}/5 tags</span>
            </div>
            <div className="flex gap-2">
              <input
                id="task-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  if (tagDraftError) setTagDraftError(null);
                }}
                onKeyDown={handleTagKeyDown}
                placeholder="e.g. telemetry-v2 (press Enter)"
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {tagDraftError && <p className="mt-1.5 text-xs text-amber-400">{tagDraftError}</p>}
            {errors.tags && (
              <p id="task-tags-error" className="mt-1.5 text-xs text-rose-400">
                {errors.tags}
              </p>
            )}

            {draft.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs text-cyan-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="rounded text-cyan-300/80 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Human Approval Gate */}
          <div
            className={`rounded-xl border p-3.5 transition ${
              errors.requireHumanApproval
                ? 'border-rose-500/50 bg-rose-950/30'
                : requiresApprovalGuard
                  ? 'border-violet-500/40 bg-violet-950/30'
                  : 'border-slate-800 bg-slate-950/50'
            }`}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                id="task-human-approval"
                type="checkbox"
                checked={draft.requireHumanApproval}
                onChange={(e) => updateField('requireHumanApproval', e.target.checked)}
                aria-invalid={Boolean(errors.requireHumanApproval)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-500"
              />
              <div className="flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <ShieldCheck className="h-4 w-4 text-violet-400" />
                  Require Human-in-the-Loop Approval Gate
                </span>
                <p className="mt-0.5 text-xs text-slate-400">
                  Mandated by Zod policy when priority is <span className="text-slate-200">Critical</span>{' '}
                  or token budget exceeds <span className="font-mono text-slate-200">64,000</span>.
                </p>
              </div>
            </label>
            {errors.requireHumanApproval && (
              <p className="mt-2 text-xs text-rose-400">{errors.requireHumanApproval}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-cyan-500/25 transition hover:bg-cyan-300"
            >
              <Plus className="h-4 w-4" />
              Dispatch Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

