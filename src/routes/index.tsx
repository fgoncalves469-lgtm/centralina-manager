import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, FileCode2, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Remap Garage — ECU tuning manager" },
      {
        name: "description",
        content: "Store reads, maps, notes and logs for every car — shared between the reader and the tuner.",
      },
      { property: "og:title", content: "Remap Garage — ECU tuning manager" },
      {
        property: "og:description",
        content: "Store reads, maps, notes and logs for every car — shared between the reader and the tuner.",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Car, title: "Car & client", text: "Make, model, engine, plate and contact." },
  { icon: Gauge, title: "Map versions", text: "Every map revision with notes on what changed." },
  { icon: FileCode2, title: "Logs", text: "Attach logs to each map so the tuner can review them." },
];

function Index() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">ECU tuning workflow</p>
      <h1 className="text-6xl leading-none sm:text-8xl">
        Every map,<br />
        <span className="text-primary">every log.</span>
      </h1>
      <p className="mt-5 max-w-lg text-lg text-muted-foreground">
        You read and flash the car, your tuner edits the map. Keep every file, note and log in one place — on phone or desktop.
      </p>
      <div className="mt-8">
        <Button asChild size="lg" className="shadow-glow">
          <Link to="/trabalhos">Open the app</Link>
        </Button>
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-5">
            <f.icon className="mb-3 size-6 text-primary" />
            <h3 className="text-2xl">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
