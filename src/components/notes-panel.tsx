"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import { createNote, deleteNote, updateNote } from "@/app/actions/productivity";
import type { Note } from "@/lib/database.types";

export function NotesPanel({ notes }: { notes: Note[] }) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  function openEditor(note?: Note) {
    setEditing(note ?? null);
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setFeedback("");
    setEditorOpen(true);
  }

  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = editing
        ? await updateNote({ id: editing.id, title: title.trim(), content })
        : await createNote({ title: title.trim(), content });
      if (!result.ok) {
        setFeedback(result.error);
        return;
      }
      setEditorOpen(false);
      setFeedback(editing ? "Note updated." : "Note saved.");
      router.refresh();
    });
  }

  function removeNote(note: Note) {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (!result.ok) setFeedback(result.error);
      else {
        setFeedback("Note deleted.");
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Personal notes</p>
          <h2 className="mt-2 font-[Manrope] text-2xl font-bold">A space to think</h2>
        </div>
        <button onClick={() => openEditor()} className="gold-button flex items-center gap-2 px-4 py-2.5 text-sm"><Plus size={16} /> New note</button>
      </div>

      {feedback && <p className="text-sm text-[#E8D58A]" role="status">{feedback}</p>}
      {editorOpen && (
        <form onSubmit={saveNote} className="premium-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Edit note" : "New note"}</h3>
            <button type="button" onClick={() => setEditorOpen(false)} aria-label="Close note form" className="text-[#888]"><X size={18} /></button>
          </div>
          <label className="block text-xs text-[#999]">Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} autoFocus className="form-input mt-1.5" />
          </label>
          <label className="mt-4 block text-xs text-[#999]">Note
            <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={10000} rows={6} className="form-input mt-1.5 resize-y" />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditorOpen(false)} className="rounded-lg border border-[#343434] px-4 py-2 text-sm text-[#AAA]">Cancel</button>
            <button disabled={isPending} className="gold-button px-4 py-2 text-sm">{isPending ? "Saving..." : "Save note"}</button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="premium-card px-5 py-12 text-center">
          <FileText className="mx-auto text-[#806C35]" size={24} />
          <p className="mt-3 text-sm font-medium">No notes yet</p>
          <p className="mt-1 text-xs text-[#777]">Capture an idea, reflection, or detail worth keeping.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <article key={note.id} className="premium-card flex min-h-48 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">{note.title}</h3>
                  <time className="mt-1 block text-xs text-[#777]" dateTime={note.updated_at}>{formatDate(note.updated_at)}</time>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => openEditor(note)} aria-label={`Edit ${note.title}`} className="icon-button"><Pencil size={15} /></button>
                  <button type="button" onClick={() => removeNote(note)} disabled={isPending} aria-label={`Delete ${note.title}`} className="icon-button hover:text-[#E4A08B]"><Trash2 size={15} /></button>
                </div>
              </div>
              <p className="mt-4 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#AAA]">{note.content || "Empty note"}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}