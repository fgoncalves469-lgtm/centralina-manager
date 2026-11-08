import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CarForm } from "@/components/CarForm";
import type { CarInsert } from "@/lib/jobs";
import { useServerFn } from '@tanstack/react-start';
import { saveVehiclePhoto } from '@/lib/photos.functions';

export const Route = createFileRoute("/_authenticated/garage/novo")({
  head: () => ({
    meta: [
      { title: "Add car — Remap Garage" },
      { name: "description", content: "Add a car to your garage." },
      { property: "og:title", content: "Add car — Remap Garage" },
      { property: "og:description", content: "Add a car to your garage." },
    ],
  }),
  component: NewCar,
});

function NewCar() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const savePhoto=useServerFn(saveVehiclePhoto);
  const create = useMutation({
    mutationFn: async ({values,photo}: {values:CarInsert;photo?:Blob|null}) => {
      const { data, error } = await supabase.from("cars").insert({ ...values, owner_id: user.id }).select().single();
      if (error) throw error;
      if(photo) { const bytes=new Uint8Array(await photo.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);try{await savePhoto({data:{carId:data.id,base64:btoa(binary)}});}catch{toast.error('Car saved, but photo failed. You can retry in Edit car.');} }
      return data;
    },
    onSuccess: (car) => {
      qc.invalidateQueries({ queryKey: ["cars"] });
      toast.success("Car added");
      navigate({ to: "/garage/$id", params: { id: car.id } });
    },
    onError: () => toast.error("Could not save"),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/garage" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Garage
      </Link>
      <h1 className="mb-6 text-5xl">Add car</h1>
      <CarForm submitLabel="Save car" busy={create.isPending} onSubmit={(values,photo) => create.mutate({values,photo})} />
    </div>
  );
}
