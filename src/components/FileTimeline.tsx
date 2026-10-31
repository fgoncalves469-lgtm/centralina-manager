import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileCode2, FileText, Paperclip, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { FILE_KINDS, fileLogsQuery, safeName, type FileLog, type JobFile } from "@/lib/jobs";

const BUCKET = "ecu-files";
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const fmtSize = (n: number | null) => (n ? `${(n / 1024).toFixed(0)} KB` : "");
const who = (email: string | null) => (email ? email.split("@")[0] : "someone");

async function downloadPath(path: string, name: string) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    toast.error("Could not download");
    return;
  }
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Dialog: pick a file + write a note, then call onSubmit. */
function UploadDialog({
  title, trigger, notePlaceholder, kinds, onSubmit,
}: {
  title: string;
  trigger: React.ReactNode;
  notePlaceholder: string;
  kinds?: boolean;
  onSubmit: (file: File, note: string, kind: keyof typeof FILE_KINDS) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<keyof typeof FILE_KINDS>("modified");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!file) return;
    setBusy(true);
    const ok = await onSubmit(file, note, kind);
    setBusy(false);
    if (ok) {
      setOpen(false);
      setFile(null);
      setNote("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-3xl tracking-wide">{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {kinds && (
            <div className="flex gap-2">
              {(Object.keys(FILE_KINDS) as (keyof typeof FILE_KINDS)[]).map((k) => (
                <Button key={k} type="button" size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>
                  {FILE_KINDS[k]}
                </Button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed p-4 text-left text-sm hover:border-primary"
          >
            <Upload className="size-5 text-primary" />
            <span className="truncate">{file ? `${file.name} · ${fmtSize(file.size)}` : "Choose file (max 50 MB)"}</span>
          </button>
          <input ref={ref} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder={notePlaceholder} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!file || busy}>{busy ? "Uploading…" : "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FileCard({ jobId, file, version, logs }: { jobId: string; file: JobFile; version: number; logs: FileLog[] }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(file.notes ?? "");
  const refresh = () => qc.invalidateQueries({ queryKey: ["jobs", jobId] });

  async function saveNotes() {
    const { error } = await supabase.from("job_files").update({ notes: notes || null }).eq("id", file.id);
    if (error) return void toast.error("Could not save notes");
    setEditing(false);
    refresh();
  }

  async function deleteFile() {
    if (!confirm("Delete this file and its logs?")) return;
    await supabase.storage.from(BUCKET).remove([file.path, ...logs.map((l) => l.path)]);
    await supabase.from("job_files").delete().eq("id", file.id);
    refresh();
  }

  async function addLog(f: File, note: string) {
    const path = `${jobId}/logs/${file.id}/${Date.now()}-${safeName(f.name)}`;
    const up = await supabase.storage.from(BUCKET).upload(path, f);
    if (up.error) {
      toast.error("Upload failed");
      return false;
    }
    const { error } = await supabase.from("file_logs").insert({ file_id: file.id, file_name: f.name, path, size: f.size, note: note || null });
    if (error) {
      toast.error("Could not save log");
      return false;
    }
    toast.success("Log added");
    refresh();
    return true;
  }

  async function deleteLog(l: FileLog) {
    await supabase.storage.from(BUCKET).remove([l.path]);
    await supabase.from("file_logs").delete().eq("id", l.id);
    refresh();
  }

  const isMap = file.kind === "modified";

  return (
    <li className="relative pl-8">
      <span className={`absolute left-0 top-5 flex size-6 items-center justify-center rounded-full text-xs font-bold ${isMap ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
        {version}
      </span>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start gap-3">
          <FileCode2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium">{file.file_name}</span>
              <Badge variant={isMap ? "default" : "secondary"}>{FILE_KINDS[file.kind as keyof typeof FILE_KINDS] ?? file.kind}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {who(file.uploaded_by_email)} · {fmtDate(file.created_at)} {file.size ? `· ${fmtSize(file.size)}` : ""}
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={() => downloadPath(file.path, file.file_name)} aria-label="Download"><Download /></Button>
          <Button size="icon" variant="ghost" onClick={deleteFile} aria-label="Delete file"><Trash2 /></Button>
        </div>

        <div className="mt-3 rounded-lg bg-muted p-3">
          {editing ? (
            <div className="space-y-2">
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={saveNotes}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="flex-1 whitespace-pre-wrap text-sm">
                {file.notes || <span className="text-muted-foreground">No notes on this version yet.</span>}
              </p>
              <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground" aria-label="Edit notes">
                <Pencil className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Logs ({logs.length})</span>
            <UploadDialog
              title="Add log"
              notePlaceholder="e.g. 3rd gear pull, boost overshoot at 3200 rpm, EGT ok"
              onSubmit={(f, n) => addLog(f, n)}
              trigger={<Button size="sm" variant="outline"><Paperclip /> Add log</Button>}
            />
          </div>
          {logs.length > 0 && (
            <ul className="space-y-2">
              {logs.map((l) => (
                <li key={l.id} className="flex items-start gap-2 rounded-lg border p-2.5">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{l.file_name}</div>
                    <div className="text-xs text-muted-foreground">{who(l.uploaded_by_email)} · {fmtDate(l.created_at)}</div>
                    {l.note && <p className="mt-1 whitespace-pre-wrap text-sm">{l.note}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => downloadPath(l.path, l.file_name)} aria-label="Download log"><Download /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteLog(l)} aria-label="Delete log"><Trash2 /></Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export function FileTimeline({ jobId, files }: { jobId: string; files: JobFile[] }) {
  const qc = useQueryClient();
  const ids = files.map((f) => f.id);
  const { data: logs = [] } = useQuery(fileLogsQuery(jobId, ids));
  // oldest first → version numbers; display newest on top
  const ordered = [...files].sort((a, b) => a.created_at.localeCompare(b.created_at));

  async function addFile(f: File, note: string, kind: keyof typeof FILE_KINDS) {
    const path = `${jobId}/${kind}-${Date.now()}-${safeName(f.name)}`;
    const up = await supabase.storage.from(BUCKET).upload(path, f);
    if (up.error) {
      toast.error("Upload failed");
      return false;
    }
    const { error } = await supabase.from("job_files").insert({ job_id: jobId, kind, file_name: f.name, path, size: f.size, notes: note || null });
    if (error) {
      toast.error("Could not save file");
      return false;
    }
    toast.success("File uploaded");
    qc.invalidateQueries({ queryKey: ["jobs", jobId] });
    return true;
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-3xl">Files & versions</h2>
        <UploadDialog
          title="Upload file"
          kinds
          notePlaceholder="What changed? e.g. v3: boost +0.1 bar mid-range, SOI advanced 1°, torque limiter raised"
          onSubmit={addFile}
          trigger={<Button className="shadow-glow"><Upload /> Upload</Button>}
        />
      </div>
      {files.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No files yet. Start by uploading the original read.
        </p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:bottom-0 before:left-3 before:top-0 before:w-px before:bg-border">
          {ordered.map((f, i) => ({ f, v: i + 1 })).reverse().map(({ f, v }) => (
            <FileCard key={f.id} jobId={jobId} file={f} version={v} logs={logs.filter((l) => l.file_id === f.id)} />
          ))}
        </ol>
      )}
    </section>
  );
}
