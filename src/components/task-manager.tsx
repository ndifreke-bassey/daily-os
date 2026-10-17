"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock3, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { createCategory, createTask, deleteTask, setTaskCompleted, updateTask } from "@/app/actions/productivity";
import type { Category, Task } from "@/lib/database.types";

type TaskManagerProps = {
  tasks: Task[];
  categories: Category[];
  compact: boolean;
  view: "overview" | "tasks";
};

type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
  priority: Task["priority"];
  categoryId: string;
};

const emptyTask: TaskForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
  categoryId: "",
};

const priorityRank = { high: 0, medium: 1, low: 2 };

export function TaskManager({ tasks, categories, compact, view }: TaskManagerProps) {
  const router = useRouter();
  const [today, setToday] = useState("");
  const [status, setStatus] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [sort, setSort] = useState("due");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyTask);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setToday(getLocalDate()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const overdueCount = today
    ? tasks.filter((task) => !task.is_completed && task.due_date && task.due_date < today).length
    : 0;

  let visibleTasks = tasks.filter((task) => {
    if (view === "overview" && today && task.is_completed) return false;
    if (view === "overview" && today && task.due_date && task.due_date !== today) return false;
    if (status === "open" && task.is_completed) return false;
    if (status === "completed" && !task.is_completed) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (dueFilter === "today" && today && task.due_date !== today) return false;
    if (dueFilter === "upcoming" && (!task.due_date || !today || task.due_date <= today)) return false;
    if (dueFilter === "overdue" && (!task.due_date || !today || task.due_date >= today || task.is_completed)) return false;
    const query = search.trim().toLowerCase();
    const categoryName = categories.find((category) => category.id === task.category_id)?.name ?? "";
    return !query || `${task.title} ${task.description} ${categoryName}`.toLowerCase().includes(query);
  });

  visibleTasks = [...visibleTasks].sort((left, right) => {
    if (sort === "priority") return priorityRank[left.priority] - priorityRank[right.priority];
    if (sort === "created") return right.created_at.localeCompare(left.created_at);
    return (left.due_date ?? "9999-12-31").localeCompare(right.due_date ?? "9999-12-31");
  });

  function openNewTask() {
    setEditingTask(null);
    setForm(emptyTask);
    setFeedback("");
    setEditorOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      dueDate: task.due_date ?? "",
      priority: task.priority,
      categoryId: task.category_id ?? "",
    });
    setFeedback("");
    setEditorOpen(true);
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { ...form, title: form.title.trim() };
    startTransition(async () => {
      setFeedback("");
      const result = editingTask
        ? await updateTask({ ...values, id: editingTask.id })
        : await createTask(values);
      if (!result.ok) {
        setFeedback(result.error);
        return;
      }
      setEditorOpen(false);
      setFeedback(editingTask ? "Task updated." : "Task added.");
      router.refresh();
    });
  }

  function toggleTask(task: Task) {
    startTransition(async () => {
      setFeedback("");
      const result = await setTaskCompleted(task.id, !task.is_completed);
      if (!result.ok) setFeedback(result.error);
      else router.refresh();
    });
  }

  function removeTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      setFeedback("");
      const result = await deleteTask(task.id);
      if (!result.ok) setFeedback(result.error);
      else {
        setFeedback("Task deleted.");
        router.refresh();
      }
    });
  }

  function submitCategory() {
    startTransition(async () => {
      const result = await createCategory(categoryDraft);
      if (!result.ok) setFeedback(result.error);
      else {
        setCategoryDraft("");
        setCategoryFormOpen(false);
        setFeedback("Category created.");
        router.refresh();
      }
    });
  }

  return (
    <section className="premium-card p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{view === "overview" ? "Today's priorities" : "My tasks"}</h2>
          <p className="mt-1 text-xs text-[#777]">
            {view === "overview" ? "A clear view of what is due today." : "Search, sort, and shape your task list."}
          </p>
        </div>
        <button onClick={openNewTask} className="gold-button flex items-center gap-2 px-4 py-2.5 text-sm">
          <Plus size={16} /> Add task
        </button>
      </div>

      {view === "tasks" && (
        <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <label className="relative sm:col-span-2 xl:col-span-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" className="form-input pl-9" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className="form-input">
            <option value="all">Any status</option><option value="open">Pending</option><option value="completed">Completed</option>
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filter by priority" className="form-input">
            <option value="all">Any priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={dueFilter} onChange={(event) => setDueFilter(event.target.value)} aria-label="Filter by due date" className="form-input">
            <option value="all">Any due date</option><option value="today">Due today</option><option value="upcoming">Upcoming</option><option value="overdue">Overdue</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort tasks" className="form-input">
            <option value="due">Sort: due date</option><option value="priority">Sort: priority</option><option value="created">Sort: newest</option>
          </select>
        </div>
      )}

      {overdueCount > 0 && view === "overview" && (
        <p className="mb-4 rounded-lg border border-[#6D4135] bg-[#211512] px-3 py-2 text-sm text-[#E4A08B]">
          {overdueCount} {overdueCount === 1 ? "task is" : "tasks are"} overdue. Review the full task list.
        </p>
      )}
      {feedback && <p className="mb-4 text-sm text-[#E8D58A]" role="status">{feedback}</p>}

      {editorOpen && (
        <form onSubmit={submitTask} className="mb-5 rounded-xl border border-[#3A3421] bg-[#10100D] p-4" aria-label={editingTask ? "Edit task" : "New task"}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editingTask ? "Edit task" : "New task"}</h3>
            <button type="button" onClick={() => setEditorOpen(false)} aria-label="Close task form" className="text-[#888]"><X size={18} /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[#999] sm:col-span-2">Task title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={160} required autoFocus className="form-input mt-1.5" />
            </label>
            <label className="text-xs text-[#999] sm:col-span-2">Description
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={2000} rows={2} className="form-input mt-1.5 resize-y" />
            </label>
            <label className="text-xs text-[#999]">Due date
              <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} className="form-input mt-1.5" />
            </label>
            <label className="text-xs text-[#999]">Priority
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Task["priority"] })} className="form-input mt-1.5">
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </label>
            <label className="text-xs text-[#999]">Category
              <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="form-input mt-1.5">
                <option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              {categoryFormOpen ? (
                <div className="flex w-full gap-2">
                  <input value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submitCategory(); } }} maxLength={48} aria-label="New category name" placeholder="Category name" className="form-input" />
                  <button type="button" disabled={isPending || !categoryDraft.trim()} onClick={submitCategory} className="gold-button px-3 text-sm">Save</button>
                </div>
              ) : (
                <button type="button" onClick={() => setCategoryFormOpen(true)} className="text-xs text-[#D4AF37] hover:text-white">+ Create category</button>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditorOpen(false)} className="rounded-lg border border-[#343434] px-4 py-2 text-sm text-[#AAA]">Cancel</button>
            <button disabled={isPending} className="gold-button px-4 py-2 text-sm">{isPending ? "Saving..." : editingTask ? "Save changes" : "Create task"}</button>
          </div>
        </form>
      )}

      {visibleTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#333] px-5 py-10 text-center">
          <CalendarDays className="mx-auto text-[#806C35]" size={22} />
          <p className="mt-3 text-sm font-medium">{view === "overview" ? "Nothing due today" : tasks.length ? "No tasks match these filters" : "Your task list is clear"}</p>
          <p className="mt-1 text-xs text-[#777]">{view === "overview" ? "Add a task or check upcoming deadlines in Calendar." : "Create a task or adjust your search and filters."}</p>
          {view === "overview" && <button onClick={openNewTask} className="mt-4 text-sm font-semibold text-[#E8D58A]">Add a task</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTasks.map((task) => {
            const category = categories.find((item) => item.id === task.category_id);
            const overdue = Boolean(today && task.due_date && task.due_date < today && !task.is_completed);
            return (
              <article key={task.id} className={`flex items-start gap-3 rounded-xl border border-[#262626] bg-[#101010] ${compact ? "p-3" : "p-4"}`}>
                <button type="button" onClick={() => toggleTask(task)} disabled={isPending} aria-label={task.is_completed ? `Mark ${task.title} pending` : `Complete ${task.title}`} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${task.is_completed ? "border-[#D4AF37] bg-[#D4AF37] text-black" : "border-[#555] hover:border-[#D4AF37]"}`}>
                  {task.is_completed && <Check size={13} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`break-words text-sm ${task.is_completed ? "text-[#666] line-through" : "text-[#EEE]"}`}>{task.title}</p>
                  {!compact && task.description && <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#888]">{task.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#777]">
                    {task.due_date && <span className={overdue ? "text-[#E4A08B]" : ""}><Clock3 className="mr-1 inline" size={12} />{formatDate(task.due_date)}{overdue ? " · overdue" : ""}</span>}
                    {category && <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</span>}
                    <span className={`capitalize ${task.priority === "high" ? "text-[#E4A08B]" : task.priority === "medium" ? "text-[#D4AF37]" : "text-[#888]"}`}>{task.priority}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => openEditTask(task)} disabled={isPending} aria-label={`Edit ${task.title}`} title="Edit task" className="icon-button"><Pencil size={15} /></button>
                  <button type="button" onClick={() => removeTask(task)} disabled={isPending} aria-label={`Delete ${task.title}`} title="Delete task" className="icon-button hover:text-[#E4A08B]"><Trash2 size={15} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function getLocalDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}