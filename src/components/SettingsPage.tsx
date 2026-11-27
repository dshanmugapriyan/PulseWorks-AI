import { appEnv } from '../config/env';

export function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-400">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Review the configuration currently applied to this workspace.
        </p>
      </div>

      <section aria-labelledby="workspace-settings-heading" className="space-y-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h2 id="workspace-settings-heading" className="font-semibold text-white">
            Workspace defaults
          </h2>
          <dl className="mt-5 divide-y divide-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 py-4 first:pt-0">
              <dt className="text-sm text-slate-300">Workspace name</dt>
              <dd className="text-sm text-slate-400">{appEnv.VITE_APP_NAME}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-4">
              <dt className="text-sm text-slate-300">Default maximum tokens per task</dt>
              <dd className="font-mono text-sm text-slate-400">
                {appEnv.VITE_DEFAULT_MAX_TOKENS.toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-4 last:pb-0">
              <dt className="text-sm text-slate-300">System status notices</dt>
              <dd className="text-sm text-slate-400">
                {appEnv.VITE_SYSTEM_BANNER_ENABLED ? 'Enabled' : 'Disabled'}
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">
            Workspace defaults are managed through the application environment configuration.
          </p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h2 className="font-semibold text-white">External data</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Analytics reads public repository metadata over HTTPS from GitHub. The request is
            read-only, uses no access token, and validates the response before displaying it.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            No task descriptions, routing tags, or other workspace data are sent to GitHub.
          </p>
        </article>
      </section>
    </div>
  );
}
