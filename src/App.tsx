import { useMemo, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SystemBanner } from './components/SystemBanner';
import { TaskCard } from './components/TaskCard';
import { TaskCreationForm } from './components/TaskCreationForm';
import { appEnv } from './config/env';
import { INITIAL_TASKS } from './data/initialTasks';
import { SystemBannerEngine } from './lib/systemBannerEngine';
import type { ValidatedTaskPayload } from './schemas/taskSchema';
import type { SidebarFilter, TaskItem } from './types/task';

export function App() {
  const [bannerEngine] = useState(
    () =>
      new SystemBannerEngine({
        enabled: appEnv.VITE_SYSTEM_BANNER_ENABLED,
        defaultSeverity: appEnv.VITE_SYSTEM_BANNER_DEFAULT_LEVEL,
        dismissible: appEnv.VITE_SYSTEM_BANNER_DISMISSIBLE,
        rotationIntervalMs: appEnv.VITE_SYSTEM_BANNER_POLL_INTERVAL_MS,
      }),
  );
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      running: tasks.filter((task) => task.status === 'running').length,
      queued: tasks.filter((task) => task.status === 'queued').length,
      review: tasks.filter((task) => task.status === 'review').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }),
    [tasks],
  );

  const visibleTasks = tasks.filter(
    (task) => activeFilter === 'all' || task.status === activeFilter,
  );

  const handleCreateTask = (payload: ValidatedTaskPayload) => {
    const newTask: TaskItem = {
      id: `PW-${1042 + tasks.length}`,
      ...payload,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
    bannerEngine.pushNotice({
      id: `task-created-${newTask.id}`,
      severity: 'info',
      title: 'Task added to queue',
      message: `${newTask.title} is ready for ${newTask.agentPipeline}.`,
      dismissible: true,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SystemBanner engine={bannerEngine} />
      <Navbar
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onOpenCreateModal={() => setCreateModalOpen(true)}
      />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl">
        <Sidebar
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          counts={counts}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mb-6">
            <p className="text-sm font-medium text-cyan-400">Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              AI tasks
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Create and keep track of your AI tasks.
            </p>
          </div>

          <section aria-label="Task list">
            {visibleTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 px-6 py-12 text-center">
                <h2 className="font-medium text-white">No tasks here yet</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Create a task to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Create task
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <TaskCreationForm
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}

export default App;
