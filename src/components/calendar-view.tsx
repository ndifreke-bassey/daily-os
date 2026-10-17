import { CalendarDays, Clock3 } from "lucide-react";
import type { Category, Task } from "@/lib/database.types";

export function CalendarView({ tasks, categories }: { tasks: Task[]; categories: Category[] }) {
  const datedTasks = [...tasks]
    .filter((task) => task.due_date)
    .sort((left, right) => (left.due_date ?? "").localeCompare(right.due_date ?? ""));
  const groups = new Map<string, Task[]>();

  for (const task of datedTasks) {
    const date = task.due_date ?? "";
    groups.set(date, [...(groups.get(date) ?? []), task]);
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Your schedule</p>
        <h2 className="mt-2 font-[Manrope] text-2xl font-bold">Upcoming deadlines</h2>
        <p className="mt-2 text-sm text-[#888]">Tasks with a due date, grouped into a simple agenda.</p>
      </div>

      {groups.size === 0 ? (
        <div className="premium-card px-5 py-12 text-center">
          <CalendarDays className="mx-auto text-[#806C35]" size={24} />
          <p className="mt-3 text-sm font-medium">No dates on your calendar</p>
          <p className="mt-1 text-xs text-[#777]">Add a due date to a task and it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...groups.entries()].map(([date, dateTasks]) => (
            <section key={date} className="premium-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#E8D58A]">
                <CalendarDays size={16} />
                <time dateTime={date}>{formatDate(date)}</time>
              </h3>
              <div className="space-y-2">
                {dateTasks.map((task) => {
                  const category = categories.find((item) => item.id === task.category_id);
                  return (
                    <div key={task.id} className="flex items-start gap-3 border-t border-[#292929] py-3 first:border-0 first:pt-0 last:pb-0">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${task.is_completed ? "bg-[#555]" : task.priority === "high" ? "bg-[#E4A08B]" : "bg-[#D4AF37]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`break-words text-sm ${task.is_completed ? "text-[#666] line-through" : "text-[#EEE]"}`}>{task.title}</p>
                        {task.description && <p className="mt-1 text-xs leading-5 text-[#777]">{task.description}</p>}
                      </div>
                      <div className="shrink-0 text-right text-xs text-[#777]">
                        <span className="inline-flex items-center gap-1 capitalize"><Clock3 size={12} />{task.priority}</span>
                        {category && <p className="mt-1">{category.name}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}