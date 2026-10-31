import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, FileCode2, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Remap Garage — Gestão de acertos de centralina" },
      {
        name: "description",
        content: "Regista carros, clientes, ganhos de potência e ficheiros de centralina num só lugar.",
      },
      { property: "og:title", content: "Remap Garage — Gestão de acertos de centralina" },
      {
        property: "og:description",
        content: "Regista carros, clientes, ganhos de potência e ficheiros de centralina num só lugar.",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Car, title: "Carro e cliente", text: "Marca, modelo, motor, matrícula e contacto." },
  { icon: Gauge, title: "Antes e depois", text: "cv e Nm com o ganho calculado." },
  { icon: FileCode2, title: "Ficheiros", text: "Original e modificado guardados com segurança." },
];

function Index() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Oficina de reprogramação</p>
      <h1 className="text-6xl leading-none sm:text-8xl">
        Cada acerto,<br />
        <span className="text-primary">bem registado.</span>
      </h1>
      <p className="mt-5 max-w-lg text-lg text-muted-foreground">
        Gere os acertos de centralina de todos os carros que fazes — com a tua equipa, no telemóvel ou no computador.
      </p>
      <div className="mt-8">
        <Button asChild size="lg" className="shadow-glow">
          <Link to="/trabalhos">Abrir a app</Link>
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
