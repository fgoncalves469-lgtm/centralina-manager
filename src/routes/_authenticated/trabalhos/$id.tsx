import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { JobForm } from "@/components/JobForm";
import { FileTimeline } from "@/components/FileTimeline";
import { assigneesQuery, canEditJob, gainPercent, jobFilesQuery, jobQuery, myRoleQuery, ROLES, STATUSES, teamQuery, type JobInsert, type Status } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/trabalhos/$id")({
  head: () => ({
    meta: [
      { title: "Job — Remap Garage" },
      { name: "description", content: "ECU tuning job: files, versions, notes and logs." },
      { property: "og:title", content: "Job — Remap Garage" },
      { property: "og:description", content: "ECU tuning job: files, versions, notes and logs." },
    ],
  }),
  loader: async ({ context, params }) => {
    const job = await context.queryClient.ensureQueryData(jobQuery(params.id));
    if (!job) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(jobFilesQuery(params.id)),
      context.queryClient.ensureQueryData(assigneesQuery(params.id)),
      context.queryClient.ensureQueryData(myRoleQuery(context.user.id)),
      context.queryClient.ensureQueryData(teamQuery()),
    ]);
  },
  component: JobDetail,
});

function Stat({ label, before, after, unit }: { label: string; before: number | null; after: number | null; unit: string }) {
  const gain = gainPercent(before, after);
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="stat-num mt-2 text-4xl">
        {before ?? "—"} <span className="text-muted-foreground">→</span> <span className="text-primary">{after ?? "—"}</span>
        <span className="ml-1 text-lg text-muted-foreground">{unit}</span>
      </div>
      {gain != null && <div className="mt-1 text-sm text-success">+{after! - before!} {unit} (+{gain}%)</div>}
    </div>
  );
}

function JobDetail() {
  const { id } = Route.useParams();
  const { data: job } = useSuspenseQuery(jobQuery(id));
  const { data: files } = useSuspenseQuery(jobFilesQuery(id));
  const { user } = Route.useRouteContext();
  const { data: role } = useSuspenseQuery(myRoleQuery(user.id));
  const { data: assignees } = useSuspenseQuery(assigneesQuery(id));
  const { data: team } = useSuspenseQuery(teamQuery());
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const update = useMutation({
    mutationFn: async (values: Partial<JobInsert>) => {
      const { error } = await supabase.from("jobs").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      setEditing(false);
      toast.success("Saved");
    },
    onError: () => toast.error("Could not save"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { data: logs } = await supabase.from("file_logs").select("path").in("file_id", files.map((f) => f.id));
      const paths = [...files.map((f) => f.path), ...(logs ?? []).map((l) => l.path)];
      if (paths.length) await supabase.storage.from("ecu-files").remove(paths);
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted");
      navigate({ to: "/trabalhos" });
    },
  });

  if (!job) return null;
  const canEdit = canEditJob(role, user.id, job, assignees);
  const isAdmin = role === "admin";

  async function toggleAssignee(userId: string, on: boolean) {
    const { error } = on
      ? await supabase.from("job_assignees").insert({ job_id: id, user_id: userId })
      : await supabase.from("job_assignees").delete().eq("job_id", id).eq("user_id", userId);
    if (error) return void toast.error("Could not update assignment");
    qc.invalidateQueries({ queryKey: ["jobs", id, "assignees"] });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/trabalhos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Jobs
      </Link>

      {editing ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-5xl">Edit job</h1>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
          <JobForm initial={job} submitLabel="Save changes" busy={update.isPending} onSubmit={(v) => update.mutate(v)} />
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge variant="secondary" className="mb-2">{job.stage}</Badge>
              <h1 className="text-5xl leading-none">{job.brand} {job.model}</h1>
              <p className="mt-1 text-muted-foreground">{[job.engine, job.year, job.ecu].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="flex gap-2">
              {canEdit && <Button variant="outline" size="icon" onClick={() => setEditing(true)} aria-label="Edit"><Pencil /></Button>}
              {isAdmin && <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Delete"><Trash2 /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                    <AlertDialogDescription>All files and logs for this car will be deleted too.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove.mutate()}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>}
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-primary/40 bg-card p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</div>
            <Select disabled={!canEdit} value={job.status} onValueChange={(s) => update.mutate({ status: s })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUSES) as Status[]).map((s) => <SelectItem key={s} value={s}>{STATUSES[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-6 rounded-xl border bg-card p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assigned contributors</div>
            {isAdmin ? (
              <div className="flex flex-wrap gap-2">
                {team.filter((m) => m.role !== "viewer").map((m) => {
                  const on = assignees.includes(m.id);
                  return (
                    <Button key={m.id} size="sm" variant={on ? "default" : "outline"} onClick={() => toggleAssignee(m.id, !on)}>
                      {m.email} <span className="text-xs opacity-70">· {ROLES[m.role]}</span>
                    </Button>
                  );
                })}
                {team.every((m) => m.role === "viewer") && <span className="text-sm text-muted-foreground">No contributors yet — set permissions on the Users page.</span>}
              </div>
            ) : (
              <p className="text-sm">
                {assignees.length ? team.filter((m) => assignees.includes(m.id)).map((m) => m.email).join(", ") : <span className="text-muted-foreground">Nobody assigned</span>}
              </p>
            )}
            {!canEdit && <p className="mt-2 text-xs text-muted-foreground">You can view this job but not change it.</p>}
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <Stat label="Power" before={job.hp_before} after={job.hp_after} unit="hp" />
            <Stat label="Torque" before={job.nm_before} after={job.nm_after} unit="Nm" />
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Client</div>
              <div className="mt-2 font-semibold">{job.client_name}</div>
              {job.client_phone && (
                <a href={`tel:${job.client_phone}`} className="mt-1 inline-flex items-center gap-1 text-sm text-primary">
                  <Phone className="size-3.5" /> {job.client_phone}
                </a>
              )}
              {job.plate && <div className="mt-2 inline-block rounded border px-2 py-0.5 font-mono text-sm">{job.plate}</div>}
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Job notes</div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{job.notes || <span className="text-muted-foreground">No notes</span>}</p>
              <p className="mt-3 text-xs text-muted-foreground">Created {new Date(job.created_at).toLocaleDateString("en-GB")}</p>
            </div>
          </div>

          <FileTimeline jobId={id} files={files} canEdit={canEdit} />
        </>
      )}
    </div>
  );
}
