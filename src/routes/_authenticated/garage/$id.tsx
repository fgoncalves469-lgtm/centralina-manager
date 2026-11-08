import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CarForm } from "@/components/CarForm";
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { saveVehiclePhoto } from '@/lib/photos.functions';
import { VehiclePhoto } from '@/components/VehiclePhoto';
import { ClientProgress } from '@/components/ClientProgress';
import { carProgressQuery } from '@/lib/progress';
import {
  canDeleteCar, canEditCar, carJobsQuery, carQuery, gainPercent, isEditorRole, myRoleQuery, STATUSES, teamQuery,
  type CarInsert, type Status,
} from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/garage/$id")({
  head: () => ({
    meta: [
      { title: "Car — Remap Garage" },
      { name: "description", content: "Car details and tuning history." },
      { property: "og:title", content: "Car — Remap Garage" },
      { property: "og:description", content: "Car details and tuning history." },
    ],
  }),
  loader: async ({ context, params }) => {
    const car = await context.queryClient.ensureQueryData(carQuery(params.id));
    if (!car) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(myRoleQuery(context.user.id)),
      context.queryClient.ensureQueryData(teamQuery()),
    ]);
  },
  component: CarDetail,
});

const NONE = "__none";

function CarDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const { data: car } = useSuspenseQuery(carQuery(id));
  const { data: role } = useSuspenseQuery(myRoleQuery(user.id));
  const { data: jobs=[] } = useQuery({...carJobsQuery(id),enabled:role==='admin'});
  const { data:publicProgress=[] }=useQuery(carProgressQuery(id));
  const savePhoto=useServerFn(saveVehiclePhoto);
  const { data: team } = useSuspenseQuery(teamQuery());
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  async function saveCar(values:CarInsert,photo?:Blob|null){await update.mutateAsync(values);if(photo!==undefined){let base64:string|null=null;if(photo){const bytes=new Uint8Array(await photo.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);base64=btoa(binary);}try{await savePhoto({data:{carId:id,base64}});qc.invalidateQueries({queryKey:['cars']});}catch{toast.error('Car saved, but photo could not be updated');}}}

  const update = useMutation({
    mutationFn: async (values: Partial<CarInsert>) => {
      const { error } = await supabase.from("cars").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cars"] });
      setEditing(false);
      toast.success("Saved");
    },
    onError: () => toast.error("Could not save"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cars").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cars"] });
      toast.success("Car deleted");
      navigate({ to: "/garage" });
    },
    onError: () => toast.error("Could not delete"),
  });

  if (!car) return null;
  const editor = isEditorRole(role);
  const details: [string, string | number | null][] = [
    ["Engine", car.engine], ["ECU", car.ecu], ["Year", car.year], ["Plate", car.plate], ["VIN", car.vin],
    ["Mileage", car.mileage != null ? `${car.mileage} km` : null], ["Fuel", car.fuel], ["Gearbox", car.gearbox], ["Colour", car.color],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/garage" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Garage
      </Link>

      {editing ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-5xl">Edit car</h1>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
          <CarForm initial={car} submitLabel="Save changes" busy={update.isPending} onSubmit={saveCar} />
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-5xl leading-none">{car.brand} {car.model}</h1>
            <div className="flex gap-2">
              {canEditCar(role, user.id, car) && (
                <Button variant="outline" size="icon" onClick={() => setEditing(true)} aria-label="Edit"><Pencil /></Button>
              )}
              {canDeleteCar(role) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Delete"><Trash2 /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this car?</AlertDialogTitle>
                      <AlertDialogDescription>Its jobs are kept, but no longer linked to this car.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate()}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <VehiclePhoto path={car.photo_path} name={`${car.brand} ${car.model}`}/>
          <section className="mb-6 grid grid-cols-2 gap-3 border-y py-5 sm:grid-cols-3">
            {details.map(([k, val]) => (
              <div key={k}>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{k}</div>
                <div>{val ?? "—"}</div>
              </div>
            ))}
            {car.notes && <p className="col-span-full whitespace-pre-wrap text-sm text-muted-foreground">{car.notes}</p>}
          </section>

          {role === "admin" && (
            <section className="mb-6 rounded-xl border bg-card p-5">
              <Label className="mb-2 block">Owner (who can see this car)</Label>
              <Select value={car.owner_id ?? NONE} onValueChange={(o) => update.mutate({ owner_id: o === NONE ? null : o })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not assigned</SelectItem>
                  {team.map((p) => <SelectItem key={p.id} value={p.id}>{p.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </section>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-3xl">{editor?'Tuning history':'Work progress'}</h2>
            {editor && (
              <Button asChild size="sm"><Link to="/trabalhos/novo" search={{ car: car.id }}><Plus /> New job</Link></Button>
            )}
          </div>
          {!editor ? (publicProgress.length?publicProgress.map(p=><ClientProgress key={p.job_id} progress={p}/>):<p className="py-6 text-sm text-muted-foreground">No published updates yet.</p>) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No jobs on this car yet.</div>
          ) : (
            <ul className="space-y-2">
              {jobs.map((j) => {
                const gain = gainPercent(j.hp_before, j.hp_after);
                const body = (
                  <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{j.stage}</Badge>
                        <Badge variant={j.status === "done" ? "outline" : "default"}>{STATUSES[j.status as Status] ?? j.status}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{new Date(j.created_at).toLocaleDateString()}</div>
                    </div>
                    {j.hp_after != null && (
                      <div className="text-right">
                        <div className="stat-num text-2xl">{j.hp_before ?? "?"}→<span className="text-primary">{j.hp_after}</span> hp</div>
                        {j.nm_after != null && <div className="text-xs text-muted-foreground">{j.nm_before ?? "?"}→{j.nm_after} Nm</div>}
                        {gain != null && <div className="text-xs text-success">+{gain}%</div>}
                      </div>
                    )}
                  </div>
                );
                return (
                  <li key={j.id}>
                    {editor ? <Link to="/trabalhos/$id" params={{ id: j.id }} className="block hover:[&>div]:border-primary">{body}</Link> : body}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
