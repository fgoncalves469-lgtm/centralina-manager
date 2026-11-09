import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { JobForm } from "@/components/JobForm";
import { useQuery } from "@tanstack/react-query";
import { carQuery, myRoleQuery, type JobInsert } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/trabalhos/novo")({
  head: () => ({
    meta: [
      { title: "New job — Remap Garage" },
      { name: "description", content: "Add a new ECU tuning job." },
      { property: "og:title", content: "New job — Remap Garage" },
      { property: "og:description", content: "Add a new ECU tuning job." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { car?: string } => (typeof s["car"] === "string" ? { car: s["car"] } : {}),
  loader:async({context})=>{const role=await context.queryClient.ensureQueryData(myRoleQuery(context.user.id));if(role!=='admin')throw redirect({to:'/garage'});},
  component: NewJob,
});

function NewJob() {
  const { car: carId } = Route.useSearch();
  const { data: car, isLoading } = useQuery({ ...carQuery(carId ?? ""), enabled: !!carId });
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
      {carId && isLoading ? null : <JobForm key={car?.id ?? "new"} initial={car ? { car_id: car.id, brand: car.brand, model: car.model, engine: car.engine, year: car.year, plate: car.plate, ecu: car.ecu } : {}} submitLabel="Save job" busy={create.isPending} onSubmit={(v) => create.mutate(v)} />}
    </div>
  );
}
