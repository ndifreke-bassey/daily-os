"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

const taskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(2000),
  dueDate: z.preprocess(
    (value) => value === "" ? null : value,
    z.iso.date().nullable()
  ),
  priority: z.enum(["low", "medium", "high"]),
  categoryId: z.preprocess(
    (value) => value === "" ? null : value,
    z.string().uuid().nullable()
  ),
});

const noteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().max(10000),
});

async function getUserClient() {
  try {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (error || typeof userId !== "string") return null;

    return { supabase, userId };
  } catch {
    return null;
  }
}

async function execute<T extends { error: unknown; count?: number | null }>(
  operation: () => PromiseLike<T>
): Promise<T | null> {
  try {
    return await operation();
  } catch {
    return null;
  }
}

function failure(): ActionResult {
  return { ok: false, error: "Could not save your changes. Please try again." };
}

export async function createTask(input: unknown): Promise<ActionResult> {
  const user = await getUserClient();
  const parsed = taskSchema.safeParse(input);
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsed.success) return { ok: false, error: "Check the task details and try again." };

  const result = await execute(() => user.supabase.from("tasks").insert({
    user_id: user.userId,
    title: parsed.data.title,
    description: parsed.data.description,
    due_date: parsed.data.dueDate,
    priority: parsed.data.priority,
    category_id: parsed.data.categoryId,
  }));
  if (!result || result.error) return failure();

  revalidatePath("/");
  return { ok: true };
}

export async function updateTask(input: unknown): Promise<ActionResult> {
  const parsed = taskSchema.extend({ id: z.string().uuid() }).safeParse(input);
  const user = await getUserClient();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsed.success) return { ok: false, error: "Check the task details and try again." };

  const { id, ...task } = parsed.data;
  const result = await execute(() => user.supabase
    .from("tasks")
    .update({
      title: task.title,
      description: task.description,
      due_date: task.dueDate,
      priority: task.priority,
      category_id: task.categoryId,
    }, { count: "exact" })
    .eq("id", id)
    .eq("user_id", user.userId));
  if (!result || result.error || result.count !== 1) return failure();

  revalidatePath("/");
  return { ok: true };
}

export async function setTaskCompleted(id: string, isCompleted: boolean): Promise<ActionResult> {
  const parsedId = z.string().uuid().safeParse(id);
  const user = await getUserClient();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsedId.success || typeof isCompleted !== "boolean") return { ok: false, error: "Invalid task." };

  const result = await execute(() => user.supabase
    .from("tasks")
    .update({ is_completed: isCompleted }, { count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.userId));
  if (!result || result.error || result.count !== 1) return failure();

  revalidatePath("/");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const parsedId = z.string().uuid().safeParse(id);
  const user = await getUserClient();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsedId.success) return { ok: false, error: "Invalid task." };

  const result = await execute(() => user.supabase
    .from("tasks")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.userId));
  if (!result || result.error || result.count !== 1) return failure();

  revalidatePath("/");
  return { ok: true };
}

export async function createCategory(name: string): Promise<ActionResult> {
  const parsed = z.string().trim().min(1).max(48).safeParse(name);
  const user = await getUserClient();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsed.success) return { ok: false, error: "Category names must be 1 to 48 characters." };

  const result = await execute(() => user.supabase.from("categories").insert({
    user_id: user.userId,
    name: parsed.data,
  }));
  if (!result || result.error) return { ok: false, error: "Could not create that category. It may already exist." };

  revalidatePath("/");
  return { ok: true };
}

export async function createNote(input: unknown): Promise<ActionResult> {
  const parsed = noteSchema.safeParse(input);
  const user = await getUserClient();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsed.success) return { ok: false, error: "Add a title of up to 120 characters." };

  const result = await execute(() => user.supabase.from("notes").insert({
    user_id: user.userId,
    title: parsed.data.title,
    content: parsed.data.content,
  }));
  if (!result || result.error) return failure();

  revalidatePath("/");
  return { ok: true };
}

export async function updateNote(input: unknown): Promise<ActionResult> {
  const parsed = noteSchema.extend({ id: z.string().uuid() }).safeParse(input);
  const user = await getUserClient();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsed.success) return { ok: false, error: "Check the note details and try again." };

  const { id, ...note } = parsed.data;
  const result = await execute(() => user.supabase
    .from("notes")
    .update(note, { count: "exact" })
    .eq("id", id)
    .eq("user_id", user.userId));
  if (!result || result.error || result.count !== 1) return failure();

  revalidatePath("/");
  return { ok: true };
}

export async function deleteNote(id: string): Promise<ActionResult> {
  const parsedId = z.string().uuid().safeParse(id);
  const user = await getUserClient();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsedId.success) return { ok: false, error: "Invalid note." };

  const result = await execute(() => user.supabase
    .from("notes")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.userId));
  if (!result || result.error || result.count !== 1) return failure();

  revalidatePath("/");
  return { ok: true };
}

export async function updatePreferences(input: {
  compactTasks: boolean;
  dateFormat: "long" | "short";
}): Promise<ActionResult> {
  const parsed = z.object({
    compactTasks: z.boolean(),
    dateFormat: z.enum(["long", "short"]),
  }).safeParse(input);
  const user = await getUserClient();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!parsed.success) return { ok: false, error: "Invalid preference." };

  const result = await execute(() => user.supabase.from("user_preferences").upsert({
    user_id: user.userId,
    compact_tasks: parsed.data.compactTasks,
    date_format: parsed.data.dateFormat,
  }));
  if (!result || result.error) return failure();

  revalidatePath("/");
  return { ok: true };
}