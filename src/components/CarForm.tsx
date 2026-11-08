import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PickOrType } from "@/components/PickOrType";
import { engineLabel, vehiclesQuery, type Car, type CarInsert } from "@/lib/jobs";
import { processPhoto } from '@/lib/photos';
import { VehiclePhoto } from './VehiclePhoto';
import { toast } from 'sonner';

type Props = { initial?: Partial<Car>; submitLabel: string; busy?: boolean; onSubmit: (v: CarInsert, photo?: Blob | null) => void };

export function CarForm({ initial = {}, submitLabel, busy, onSubmit }: Props) {
  const s = (x: string | number | null | undefined) => (x == null ? "" : String(x));
  const [photo,setPhoto]=useState<Blob|null|undefined>();
  const [processing,setProcessing]=useState(false);
  const [v, setV] = useState({
    brand: s(initial.brand), model: s(initial.model), engine: s(initial.engine), year: s(initial.year),
    plate: s(initial.plate), vin: s(initial.vin), ecu: s(initial.ecu), gearbox: s(initial.gearbox),
    fuel: s(initial.fuel), color: s(initial.color), mileage: s(initial.mileage), notes: s(initial.notes),
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV({ ...v, [k]: e.target.value });

  const { data: vehicles = [] } = useQuery(vehiclesQuery());
  const uniq = (a: string[]) => [...new Set(a)];
  const brands = uniq(vehicles.map((x) => x.brand));
  const models = uniq(vehicles.filter((x) => x.brand === v.brand).map((x) => x.model));
  const inModel = vehicles.filter((x) => x.brand === v.brand && x.model === v.model);
  const engines = uniq(inModel.map(engineLabel));
  const chosen = inModel.find((x) => engineLabel(x) === v.engine);
  const ecus = chosen?.ecus ?? uniq(inModel.flatMap((x) => x.ecus));

  const n = (x: string) => (x.trim() ? Number(x.replace(/\D/g, "")) : null);
  const t = (x: string) => x.trim() || null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      brand: v.brand.trim(), model: v.model.trim(), engine: t(v.engine), year: n(v.year),
      plate: v.plate ? v.plate.toUpperCase() : null, vin: v.vin ? v.vin.toUpperCase() : null,
      ecu: t(v.ecu), gearbox: t(v.gearbox), fuel: t(v.fuel), color: t(v.color), mileage: n(v.mileage), notes: t(v.notes),
    }, photo);
  }

  const field = (k: keyof typeof v, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={v[k]} onChange={set(k)} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="space-y-3 border-b pb-5">
        <Label htmlFor="vehicle-photo">Vehicle photo</Label>
        {photo===undefined && initial.photo_path && <VehiclePhoto path={initial.photo_path} name={`${v.brand} ${v.model}`} compact/>}
        <Input id="vehicle-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;setProcessing(true);try{setPhoto(await processPhoto(f));}catch(err){toast.error(err instanceof Error?err.message:'Could not process photo');}finally{setProcessing(false);}}}/>
        {photo && <p className="text-sm text-muted-foreground">Photo ready · {Math.round(photo.size/1024)} KB</p>}
        {(photo || initial.photo_path) && <Button type="button" variant="outline" onClick={()=>setPhoto(null)}>Remove photo</Button>}
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-2xl">Car</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <PickOrType id="brand" label="Make" required value={v.brand} options={brands}
            onChange={(b) => setV({ ...v, brand: b, model: "", engine: "", ecu: "" })} />
          <PickOrType id="model" label="Model" required value={v.model} options={models}
            onChange={(m) => setV({ ...v, model: m, engine: "", ecu: "" })} />
          <PickOrType id="engine" label="Engine" value={v.engine} options={engines}
            onChange={(en) => {
              const row = inModel.find((x) => engineLabel(x) === en);
              setV({ ...v, engine: en, ecu: row?.ecus.length === 1 ? (row.ecus[0] ?? "") : v.ecu });
            }} />
          <PickOrType id="ecu" label="ECU" value={v.ecu} options={ecus} onChange={(x) => setV({ ...v, ecu: x })} />
          {field("year", "Year", { inputMode: "numeric", placeholder: "2018" })}
          {field("plate", "Plate", { placeholder: "AA-00-BB" })}
          {field("vin", "VIN", { placeholder: "VF3…" })}
          {field("mileage", "Mileage (km)", { inputMode: "numeric" })}
          {field("fuel", "Fuel", { placeholder: "Petrol / Diesel" })}
          {field("gearbox", "Gearbox", { placeholder: "Manual / Automatic" })}
          {field("color", "Colour")}
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} value={v.notes} onChange={set("notes")} placeholder="Mods, history, anything useful…" />
        </div>
      </section>
      <Button type="submit" disabled={busy || processing} className="w-full shadow-glow">{submitLabel}</Button>
    </form>
  );
}
