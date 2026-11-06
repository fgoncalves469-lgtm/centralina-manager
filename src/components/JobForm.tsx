import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { PickOrType } from "@/components/PickOrType";
import { engineLabel, STAGES, vehiclesQuery, type Job, type JobInsert } from "@/lib/jobs";

type Props = {
  initial?: Partial<Job>;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (values: JobInsert) => void;
};

const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

export function JobForm({ initial = {}, submitLabel, busy, onSubmit }: Props) {
  const [v, setV] = useState({
    client_name: initial.client_name ?? "",
    client_phone: initial.client_phone ?? "",
    brand: initial.brand ?? "",
    model: initial.model ?? "",
    engine: initial.engine ?? "",
    year: initial.year?.toString() ?? "",
    plate: initial.plate ?? "",
    ecu: initial.ecu ?? "",
    stage: initial.stage ?? "Stage 1",
    hp_before: initial.hp_before?.toString() ?? "",
    hp_after: initial.hp_after?.toString() ?? "",
    nm_before: initial.nm_before?.toString() ?? "",
    nm_after: initial.nm_after?.toString() ?? "",
    notes: initial.notes ?? "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV({ ...v, [k]: e.target.value });

  const { data: vehicles = [] } = useQuery(vehiclesQuery());
  const uniq = (a: string[]) => [...new Set(a)];
  const brands = uniq(vehicles.map((x) => x.brand));
  const inModel = vehicles.filter((x) => x.brand === v.brand && x.model === v.model);
  const models = uniq(vehicles.filter((x) => x.brand === v.brand).map((x) => x.model));
  const engines = uniq(inModel.map(engineLabel));
  const chosen = inModel.find((x) => engineLabel(x) === v.engine);
  const ecus = chosen?.ecus ?? uniq(inModel.flatMap((x) => x.ecus));

  function pickEngine(label: string) {
    const row = inModel.find((x) => engineLabel(x) === label);
    setV({ ...v, engine: label, ecu: row && row.ecus.length === 1 ? (row.ecus[0] ?? "") : row ? "" : v.ecu });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      client_name: v.client_name.trim(),
      client_phone: v.client_phone || null,
      brand: v.brand.trim(),
      model: v.model.trim(),
      engine: v.engine || null,
      year: v.year ? Number(v.year) : null,
      plate: v.plate ? v.plate.toUpperCase() : null,
      ecu: v.ecu || null,
      stage: v.stage,
      hp_before: num(v.hp_before),
      hp_after: num(v.hp_after),
      nm_before: num(v.nm_before),
      nm_after: num(v.nm_after),
      notes: v.notes || null,
    });
  }

  const field = (k: keyof typeof v, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={v[k]} onChange={set(k)} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-2xl">Car</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <PickOrType id="brand" label="Make" required value={v.brand} options={brands}
            onChange={(b) => setV({ ...v, brand: b, model: "", engine: "", ecu: "" })} />
          <PickOrType id="model" label="Model" required value={v.model} options={models}
            onChange={(m) => setV({ ...v, model: m, engine: "", ecu: "" })} />
          <PickOrType id="engine" label="Engine" value={v.engine} options={engines} onChange={pickEngine} />
          {field("year", "Year", { inputMode: "numeric", placeholder: "2018" })}
          {field("plate", "Plate", { placeholder: "AA-00-BB" })}
          <PickOrType id="ecu" label="ECU" value={v.ecu} options={ecus} onChange={(e) => setV({ ...v, ecu: e })} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-2xl">Client</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("client_name", "Name", { required: true })}
          {field("client_phone", "Phone", { type: "tel" })}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-2xl">Tune</h2>
        <div className="mb-4 space-y-1.5">
          <Label>Type</Label>
          <Select value={v.stage} onValueChange={(s) => setV({ ...v, stage: s })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field("hp_before", "hp before", { inputMode: "decimal" })}
          {field("hp_after", "hp after", { inputMode: "decimal" })}
          {field("nm_before", "Nm before", { inputMode: "decimal" })}
          {field("nm_after", "Nm after", { inputMode: "decimal" })}
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} value={v.notes} onChange={set("notes")} />
        </div>
      </section>

      <Button type="submit" size="lg" className="w-full shadow-glow" disabled={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
