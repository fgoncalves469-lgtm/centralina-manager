import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { JobForm } from "@/components/JobForm";
import type { JobInsert } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/trabalhos/novo")({
  head: () => ({
    meta: [
      { title: "New job — Remap Garage" },
      { name: "description", content: "Add a new ECU tuning job." },
      { property: "og:title", content: "New job — Remap Garage" },
      { property: "og:description", content: "Add a new ECU tuning job." },
    ],
  }),
  component: NewJob,
});

function NewJob() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (values: JobInsert) => {
      const { data, error } = await supabase.from("jobs").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job saved");
      navigate({ to: "/trabalhos/$id", params: { id: job.id } });
    },
    onError: () => toast.error("Could not save"),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/trabalhos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Jobs
      </Link>
      <h1 className="mb-6 text-5xl">New job</h1>
      <JobForm submitLabel="Save job" busy={create.isPending} onSubmit={(v) => create.mutate(v)} />
    </div>
  );
}
