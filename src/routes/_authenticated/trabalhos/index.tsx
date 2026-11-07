import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { gainPercent, jobsQuery, myRoleQuery, STATUSES, type Status } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/trabalhos/")({
  head: () => ({
    meta: [
      { title: "Jobs — Remap Garage" },
      { name: "description", content: "All ECU tuning jobs." },
      { property: "og:title", content: "Jobs — Remap Garage" },
      { property: "og:description", content: "All ECU tuning jobs." },
    ],
  }),
  loader: async ({ context }) => {
    const role = await context.queryClient.ensureQueryData(myRoleQuery(context.user.id));
    if (role === "viewer") throw redirect({ to: "/garage" });
    await context.queryClient.ensureQueryData(jobsQuery());
  },
  component: JobsList,
});

function JobsList() {
  const { data: jobs } = useSuspenseQuery(jobsQuery());
  const { user } = Route.useRouteContext();
  const { data: role } = useSuspenseQuery(myRoleQuery(user.id));
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return jobs;
    return jobs.filter((j) =>
      [j.brand, j.model, j.plate, j.client_name, j.engine, j.ecu].some((x) => x?.toLowerCase().includes(s)),
    );
  }, [jobs, q]);

  const totalHp = jobs.reduce((acc, j) => acc + (j.hp_after && j.hp_before ? j.hp_after - j.hp_before : 0), 0);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {jobs.length} cars · +{Math.round(totalHp)} hp gained in total
          </p>
        </div>
        {role !== "viewer" && (
          <Button asChild className="shadow-glow">
            <Link to="/trabalhos/novo"><Plus /> New</Link>
          </Button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search plate, car or client…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {jobs.length === 0 ? "No jobs yet. Add your first car!" : "Nothing found."}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((j) => {
            const gain = gainPercent(j.hp_before, j.hp_after);
            return (
              <li key={j.id}>
                <Link
                  to="/trabalhos/$id"
                  params={{ id: j.id }}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{j.brand} {j.model}</span>
                      <Badge variant="secondary">{j.stage}</Badge>
                      <Badge variant={j.status === "done" ? "outline" : "default"}>{STATUSES[j.status as Status] ?? j.status}</Badge>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {[j.plate, j.engine, j.client_name].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {j.hp_after != null && (
                    <div className="text-right">
                      <div className="stat-num text-2xl">{j.hp_before ?? "?"}→<span className="text-primary">{j.hp_after}</span></div>
                      {gain != null && <div className="text-xs text-success">+{gain}%</div>}
                    </div>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
