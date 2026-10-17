"use client";

import { useEffect, useState, useTransition } from "react";
import { Activity, CalendarDays, CheckCircle2, ChevronRight, Clock3, FileText, LayoutDashboard, ListTodo, LogOut, Menu, Settings2, Target, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { updatePreferences } from "@/app/actions/productivity";
import { CalendarView } from "@/components/calendar-view";
import { NotesPanel } from "@/components/notes-panel";
import { TaskManager } from "@/components/task-manager";
import type { Category, Note, Task, UserPreferences } from "@/lib/database.types";

type View = "Overview" | "My tasks" | "Calendar" | "Habits" | "Goals" | "Notes";

type DashboardProps = {
  email: string;
  tasks: Task[];
  categories: Category[];
  notes: Note[];
  preferences: UserPreferences;
  dataError: string;
};

const navigation: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My tasks", icon: ListTodo },
  { label: "Calendar", icon: CalendarDays },
  { label: "Habits", icon: Activity },
  { label: "Goals", icon: Target },
  { label: "Notes", icon: FileText },
];

export function DayOSDashboard({ email, tasks, categories, notes, preferences, dataError }: DashboardProps) {
  const [activeView, setActiveView] = useState<View>("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [today, setToday] = useState("");
  const [compactTasks, setCompactTasks] = useState(preferences.compact_tasks);
  const [dateFormat, setDateFormat] = useState<UserPreferences["date_format"]>(preferences.date_format);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [isSavingPreference, startPreferenceTransition] = useTransition();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setToday(getLocalDate()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const completed = tasks.filter((task) => task.is_completed).length;
  const pending = tasks.length - completed;
  const overdue = today
    ? tasks.filter((task) => !task.is_completed && task.due_date && task.due_date < today).length
    : 0;
  const upcoming = today
    ? tasks.filter((task) => !task.is_completed && task.due_date && task.due_date >= today).length
    : 0;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  function savePreferences(nextCompact: boolean, nextDateFormat: UserPreferences["date_format"]) {
    setCompactTasks(nextCompact);
    setDateFormat(nextDateFormat);
    setPreferenceMessage("");
    startPreferenceTransition(async () => {
      const result = await updatePreferences({ compactTasks: nextCompact, dateFormat: nextDateFormat });
      setPreferenceMessage(result.ok ? "Preferences saved." : result.error);
    });
  }

  return (
    <div className="min-h-screen bg-[#090909] text-[#F3F0E8]">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#292929] bg-[#101010] p-6 transition-transform md:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37] text-black"><Activity size={24} /></div>
          <div>
            <p className="font-[Manrope] text-xl font-extrabold">DayOS</p>
            <p className="text-[10px] tracking-[0.2em] text-[#D4AF37]">YOUR DAY. YOUR DIRECTION.</p>
          </div>
          <button className="ml-auto text-[#999] md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#666]">Workspace</p>
        <nav aria-label="Main navigation" className="space-y-2">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => { setActiveView(label); setMenuOpen(false); }} aria-current={activeView === label ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${activeView === label ? "border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#E8D58A]" : "text-[#999] hover:bg-[#1C1C1C] hover:text-white"}`}>
              <Icon size={18} />{label}{activeView === label && <ChevronRight size={15} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-[#302B1E] bg-[#18160F] p-4">
          <p className="text-xs font-semibold text-[#E8D58A]">A little reminder</p>
          <p className="mt-2 text-sm leading-6 text-[#B6B0A0]">Small steps, taken consistently, create remarkable change.</p>
        </div>
        <p className="mt-5 truncate text-center text-[10px] tracking-widest text-[#555]" title={email}>{email}</p>
      </aside>

      {menuOpen && <button className="fixed inset-0 z-20 bg-black/70 md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" />}

      <main className="min-h-screen md:ml-64">
        <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-[#222] px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button className="text-[#999] md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
            <div>
              <p className="text-xs text-[#777]">{today ? formatToday(today, dateFormat) : ""}</p>
              <p className="mt-1 text-sm font-semibold">{activeView}</p>
            </div>
          </div>
          <form action={signOut}>
            <button className="flex items-center gap-2 rounded-lg border border-[#292929] px-3 py-2 text-xs text-[#AAA] transition hover:border-[#514522] hover:text-white" title="Sign out">
              <LogOut size={15} /><span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8 lg:p-12">
          {dataError && <p className="rounded-lg border border-[#75453A] bg-[#251612] px-4 py-3 text-sm text-[#F0B5A5]" role="alert">{dataError}</p>}

          {activeView === "Overview" && (
            <>
              <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Your personal command centre</p>
                  <h1 className="font-[Manrope] text-3xl font-bold sm:text-4xl">Make today <span className="text-[#D4AF37]">count.</span></h1>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-[#929292]">Stay intentional. Focus on what matters. Build a life you are proud of, one day at a time.</p>
                </div>
                <button onClick={() => setActiveView("My tasks")} className="gold-button flex items-center justify-center gap-2 px-5 py-3 text-sm"><ListTodo size={16} /> Manage tasks</button>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Task statistics">
                <StatCard label="Total tasks" value={tasks.length} note="Saved to your account" icon={ListTodo} />
                <StatCard label="Completed" value={completed} note="Tasks finished" icon={CheckCircle2} />
                <StatCard label="Pending" value={pending} note={`${progress}% complete`} icon={Activity} />
                <StatCard label="Overdue" value={overdue} note={`${upcoming} upcoming`} icon={Target} alert={overdue > 0} />
              </section>

              <section className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
                <TaskManager tasks={tasks} categories={categories} compact={compactTasks} view="overview" />
                <div className="space-y-6">
                  <div className="premium-card p-6">
                    <div className="mb-5 flex items-center gap-2"><CalendarDays className="text-[#D4AF37]" size={19} /><h2 className="font-bold">Upcoming deadlines</h2></div>
                    {tasks.filter((task) => !task.is_completed && task.due_date && (!today || task.due_date >= today)).sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")).slice(0, 4).length === 0 ? (
                      <p className="text-sm text-[#777]">No upcoming deadlines. Add a due date to a task to see it here.</p>
                    ) : (
                      <div className="space-y-3">
                        {tasks.filter((task) => !task.is_completed && task.due_date && (!today || task.due_date >= today)).sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")).slice(0, 4).map((task) => (
                          <div key={task.id} className="flex items-start gap-3 border-b border-[#292929] pb-3 last:border-0 last:pb-0">
                            <Clock3 size={15} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                            <div className="min-w-0"><p className="break-words text-sm">{task.title}</p><p className="mt-1 text-xs text-[#777]">{task.due_date && formatToday(task.due_date, "short")}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#292929]" aria-label={`Task progress ${progress}%`}>
                      <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="premium-card p-6">
                    <div className="mb-4 flex items-center gap-2"><Settings2 size={17} className="text-[#D4AF37]" /><h2 className="font-bold">Preferences</h2></div>
                    <label className="flex items-center justify-between gap-4 py-2 text-sm text-[#AAA]">
                      Compact task rows
                      <input type="checkbox" checked={compactTasks} disabled={isSavingPreference} onChange={(event) => savePreferences(event.target.checked, dateFormat)} className="h-4 w-4 accent-[#D4AF37]" />
                    </label>
                    <label className="mt-2 flex items-center justify-between gap-4 text-sm text-[#AAA]">
                      Date style
                      <select value={dateFormat} disabled={isSavingPreference} onChange={(event) => savePreferences(compactTasks, event.target.value as UserPreferences["date_format"])} className="rounded-lg border border-[#343434] bg-[#0C0C0C] px-2 py-1.5 text-xs text-[#DDD]">
                        <option value="long">Long</option><option value="short">Short</option>
                      </select>
                    </label>
                    {preferenceMessage && <p className="mt-3 text-xs text-[#E8D58A]" role="status">{preferenceMessage}</p>}
                  </div>

                  <div className="rounded-2xl border border-[#44391A] bg-gradient-to-br from-[#211B0C] to-[#11100D] p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">The daily intention</p>
                    <p className="mt-4 font-[Manrope] text-xl font-semibold leading-8">Progress over perfection.</p>
                    <p className="mt-3 text-sm leading-6 text-[#AAA18B]">You do not have to do everything today. Start with what matters most.</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeView === "My tasks" && <TaskManager tasks={tasks} categories={categories} compact={compactTasks} view="tasks" />}
          {activeView === "Calendar" && <CalendarView tasks={tasks} categories={categories} />}
          {activeView === "Notes" && <NotesPanel notes={notes} />}
          {(activeView === "Habits" || activeView === "Goals") && (
            <section className="premium-card px-6 py-12 text-center">
              {activeView === "Habits" ? <Activity className="mx-auto text-[#806C35]" size={24} /> : <Target className="mx-auto text-[#806C35]" size={24} />}
              <h2 className="mt-4 font-[Manrope] text-xl font-bold">{activeView} are not available yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#888]">This workspace keeps your saved tasks, calendar, and notes ready while this section remains unimplemented.</p>
              <button onClick={() => setActiveView("Overview")} className="mt-5 text-sm font-semibold text-[#E8D58A]">Return to overview</button>
            </section>
          )}

          <footer className="border-t border-[#222] pt-5 text-center text-xs text-[#555]">Built with intention. Make every day count.</footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, alert = false }: { label: string; value: number; note: string; icon: typeof Activity; alert?: boolean }) {
  return (
    <div className="premium-card p-5 transition-colors hover:border-[#514522]">
      <div className="flex items-center justify-between"><p className="text-xs text-[#888]">{label}</p><Icon size={18} className={alert ? "text-[#E4A08B]" : "text-[#D4AF37]"} /></div>
      <p className="mt-5 font-[Manrope] text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-[#777]">{note}</p>
    </div>
  );
}

function formatToday(value: string, style: UserPreferences["date_format"]) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: style === "long" ? "long" : undefined,
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: style === "long" ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

function getLocalDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}