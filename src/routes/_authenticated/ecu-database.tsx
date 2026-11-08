import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchesVehicle, myRoleQuery, parseEcus, vehiclesQuery, type Vehicle } from "@/lib/jobs";

const TITLE = "PSA ECU Database — Remap Garage";
const DESC = "Peugeot and Citroën engines with engine codes, displacement, power and ECUs.";

export const Route = createFileRoute("/_authenticated/ecu-database")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    const role=await context.queryClient.ensureQueryData(myRoleQuery(context.user.id));
    if(role!=='admin') throw redirect({to:'/garage'});
    await context.queryClient.ensureQueryData(vehiclesQuery());
  },
  component: EcuDatabase,
});

const ALL = "__all";

function EcuDatabase() {
  const { user } = Route.useRouteContext();
  const { data: role } = useSuspenseQuery(myRoleQuery(user.id));
  const { data: vehicles } = useSuspenseQuery(vehiclesQuery());
  const qc = useQueryClient();
  const canEdit = role === "admin";

  const [brand, setBrand] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Vehicle> | null>(null);

  const brands = [...new Set(vehicles.map((v) => v.brand))];
  const models = [...new Set(vehicles.filter((v) => v.brand === brand).map((v) => v.model))];
  const rows = vehicles.filter(
    (v) => (brand === ALL || v.brand === brand) && (model === ALL || v.model === model) && matchesVehicle(v, q),
  );

  async function remove(v: Vehicle) {
    if (!confirm(`Delete ${v.brand} ${v.model} ${v.engine}?`)) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", v.id);
    if (error) return void toast.error("Could not delete");
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  }

  return (
    <div>
      <Link to="/trabalhos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Jobs
      </Link>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="text-5xl">PSA ECU Database</h1>
        {canEdit && (
          <Button onClick={() => setEditing({ brand: brand !== ALL ? brand : "", model: model !== ALL ? model : "" })}>
            <Plus /> Add
          </Button>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select value={brand} onValueChange={(b) => { setBrand(b); setModel(ALL); }}>
          <SelectTrigger aria-label="Make"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All makes</SelectItem>
            {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={model} onValueChange={setModel} disabled={brand === ALL}>
          <SelectTrigger aria-label="Model"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All models</SelectItem>
            {models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Model, engine, code or ECU" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              {brand === ALL && <th className="p-3">Make</th>}
              {model === ALL && <th className="p-3">Model</th>}
              <th className="p-3">Engine</th>
              <th className="p-3">Engine code</th>
              <th className="p-3">cc</th>
              <th className="p-3">hp</th>
              <th className="p-3">ECU</th>
              {canEdit && <th className="p-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                {brand === ALL && <td className="p-3">{v.brand}</td>}
                {model === ALL && <td className="p-3 font-medium">{v.model}</td>}
                <td className="p-3">{v.engine}</td>
                <td className="p-3 font-mono">{v.engine_code}</td>
                <td className="p-3">{v.displacement}</td>
                <td className="p-3">{v.power_hp}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {v.ecus.map((e) => <span key={e} className="rounded bg-secondary px-1.5 py-0.5 text-xs">{e}</span>)}
                  </div>
                </td>
                {canEdit && (
                  <td className="whitespace-nowrap p-3 text-right">
                    <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(v)}><Pencil /></Button>
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(v)}><Trash2 /></Button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nothing found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <VehicleDialog initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function VehicleDialog({ initial, onClose }: { initial: Partial<Vehicle>; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    brand: initial.brand ?? "",
    model: initial.model ?? "",
    engine: initial.engine ?? "",
    engine_code: initial.engine_code ?? "",
    displacement: initial.displacement?.toString() ?? "",
    power_hp: initial.power_hp?.toString() ?? "",
    ecus: (initial.ecus ?? []).join(" / "),
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const int = (s: string) => (s.trim() ? parseInt(s, 10) : null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const row = {
      brand: f.brand.trim(),
      model: f.model.trim(),
      engine: f.engine.trim(),
      engine_code: f.engine_code.trim() || null,
      displacement: int(f.displacement),
      power_hp: int(f.power_hp),
      ecus: parseEcus(f.ecus),
    };
    const { error } = initial.id
      ? await supabase.from("vehicles").update(row).eq("id", initial.id)
      : await supabase.from("vehicles").insert(row);
    setBusy(false);
    if (error) return void toast.error("Could not save");
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    onClose();
  }

  const fld = (k: keyof typeof f, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`v-${k}`}>{label}</Label>
      <Input id={`v-${k}`} value={f[k]} onChange={set(k)} {...props} />
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial.id ? "Edit engine" : "Add engine"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {fld("brand", "Make", { required: true, placeholder: "Peugeot" })}
          {fld("model", "Model", { required: true, placeholder: "206" })}
          {fld("engine", "Engine", { required: true, placeholder: "1.6 16V" })}
          {fld("engine_code", "Engine code", { placeholder: "TU5JP4" })}
          {fld("displacement", "Displacement (cc)", { inputMode: "numeric" })}
          {fld("power_hp", "Power (hp)", { inputMode: "numeric" })}
          <div className="sm:col-span-2">{fld("ecus", "ECU (separate several with /)", { placeholder: "IAW 1AP / IAW 48P2" })}</div>
          <Button type="submit" className="sm:col-span-2" disabled={busy}>Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
