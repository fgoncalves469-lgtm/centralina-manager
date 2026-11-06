import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CarForm } from "@/components/CarForm";
import type { CarInsert } from "@/lib/jobs";

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
  const create = useMutation({
    mutationFn: async (values: CarInsert) => {
      const { data, error } = await supabase.from("cars").insert({ ...values, owner_id: user.id }).select().single();
      if (error) throw error;
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
      <CarForm submitLabel="Save car" busy={create.isPending} onSubmit={(v) => create.mutate(v)} />
    </div>
  );
}
