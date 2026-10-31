import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft, Download, FileCode2, Pencil, Phone, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { JobForm } from "@/components/JobForm";
import { FILE_KINDS, gainPercent, jobFilesQuery, jobQuery, type JobFile, type JobInsert } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/trabalhos/$id")({
  head: () => ({
    meta: [
      { title: "Trabalho — Remap Garage" },
      { name: "description", content: "Detalhes do acerto de centralina." },
      { property: "og:title", content: "Trabalho — Remap Garage" },
      { property: "og:description", content: "Detalhes do acerto de centralina." },
    ],
  }),
  loader: async ({ context, params }) => {
    const job = await context.queryClient.ensureQueryData(jobQuery(params.id));
    if (!job) throw notFound();
    await context.queryClient.ensureQueryData(jobFilesQuery(params.id));
  },
  component: JobDetail,
});

function Stat({ label, before, after, unit }: { label: string; before: number | null; after: number | null; unit: string }) {
  const gain = gainPercent(before, after);
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="stat-num mt-2 text-5xl">
        {before ?? "—"} <span className="text-muted-foreground">→</span>{" "}
        <span className="text-primary">{after ?? "—"}</span>
        <span className="ml-1 text-xl text-muted-foreground">{unit}</span>
      </div>
      {gain != null && <div className="mt-1 text-sm text-success">+{after! - before!} {unit} (+{gain}%)</div>}
    </div>
  );
}

function JobDetail() {
  const { id } = Route.useParams();
  const { data: job } = useSuspenseQuery(jobQuery(id));
  const { data: files } = useSuspenseQuery(jobFilesQuery(id));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const update = useMutation({
    mutationFn: async (values: JobInsert) => {
      const { error } = await supabase.from("jobs").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      setEditing(false);
      toast.success("Alterações guardadas");
    },
    onError: () => toast.error("Não foi possível guardar"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (files.length) await supabase.storage.from("ecu-files").remove(files.map((f) => f.path));
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Trabalho apagado");
      navigate({ to: "/trabalhos" });
    },
  });

  if (!job) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/trabalhos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Trabalhos
      </Link>

      {editing ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-5xl">Editar</h1>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
          <JobForm initial={job} submitLabel="Guardar alterações" busy={update.isPending} onSubmit={(v) => update.mutate(v)} />
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-2">{job.stage}</Badge>
              <h1 className="text-5xl leading-none">{job.brand} {job.model}</h1>
              <p className="mt-1 text-muted-foreground">
                {[job.engine, job.year, job.ecu].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setEditing(true)} aria-label="Editar"><Pencil /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Apagar"><Trash2 /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar este trabalho?</AlertDialogTitle>
                    <AlertDialogDescription>Os ficheiros associados também serão apagados.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove.mutate()}>Apagar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Stat label="Potência" before={job.hp_before} after={job.hp_after} unit="cv" />
            <Stat label="Binário" before={job.nm_before} after={job.nm_after} unit="Nm" />
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cliente</div>
              <div className="mt-2 font-semibold">{job.client_name}</div>
              {job.client_phone && (
                <a href={`tel:${job.client_phone}`} className="mt-1 inline-flex items-center gap-1 text-sm text-primary">
                  <Phone className="size-3.5" /> {job.client_phone}
                </a>
              )}
              {job.plate && <div className="mt-2 inline-block rounded border px-2 py-0.5 font-mono text-sm">{job.plate}</div>}
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notas</div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{job.notes || <span className="text-muted-foreground">Sem notas</span>}</p>
              <p className="mt-3 text-xs text-muted-foreground">Registado a {new Date(job.created_at).toLocaleDateString("pt-PT")}</p>
            </div>
          </div>

          <FilesSection jobId={id} files={files} />
        </>
      )}
    </div>
  );
}

function FilesSection({ jobId, files }: { jobId: string; files: JobFile[] }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<keyof typeof FILE_KINDS>("original");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const path = `${jobId}/${kind}-${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const up = await supabase.storage.from("ecu-files").upload(path, file);
    if (up.error) {
      toast.error("Falha no envio do ficheiro");
    } else {
      const { error } = await supabase.from("job_files").insert({ job_id: jobId, kind, file_name: file.name, path, size: file.size });
      if (error) toast.error("Falha ao registar ficheiro");
      else toast.success("Ficheiro guardado");
      qc.invalidateQueries({ queryKey: ["jobs", jobId, "files"] });
    }
    setUploading(false);
  }

  async function download(f: JobFile) {
    const { data, error } = await supabase.storage.from("ecu-files").download(f.path);
    if (error || !data) return toast.error("Não foi possível descarregar");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.file_name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function del(f: JobFile) {
    await supabase.storage.from("ecu-files").remove([f.path]);
    await supabase.from("job_files").delete().eq("id", f.id);
    qc.invalidateQueries({ queryKey: ["jobs", jobId, "files"] });
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl">Ficheiros da centralina</h2>
        <div className="flex gap-2">
          {(Object.keys(FILE_KINDS) as (keyof typeof FILE_KINDS)[]).map((k) => (
            <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>
              {FILE_KINDS[k]}
            </Button>
          ))}
          <Button size="sm" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Upload /> {uploading ? "A enviar…" : "Enviar"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda sem ficheiros. Escolhe o tipo e envia o ficheiro (até 50 MB).</p>
      ) : (
        <ul className="divide-y">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-3">
              <FileCode2 className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {FILE_KINDS[f.kind as keyof typeof FILE_KINDS] ?? f.kind}
                  {f.size ? ` · ${(f.size / 1024).toFixed(0)} KB` : ""} · {new Date(f.created_at).toLocaleDateString("pt-PT")}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => download(f)} aria-label="Descarregar"><Download /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(f)} aria-label="Apagar ficheiro"><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
