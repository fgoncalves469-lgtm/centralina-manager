import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { carsQuery, isEditorRole, myRoleQuery, teamQuery } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/garage/")({
  head: () => ({
    meta: [
      { title: "My Garage — Remap Garage" },
      { name: "description", content: "Your cars and their tuning history." },
      { property: "og:title", content: "My Garage — Remap Garage" },
      { property: "og:description", content: "Your cars and their tuning history." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(carsQuery()),
      context.queryClient.ensureQueryData(myRoleQuery(context.user.id)),
      context.queryClient.ensureQueryData(teamQuery()),
    ]),
  component: Garage,
});

function Garage() {
  const { user } = Route.useRouteContext();
  const { data: cars } = useSuspenseQuery(carsQuery());
  const { data: role } = useSuspenseQuery(myRoleQuery(user.id));
  const { data: team } = useSuspenseQuery(teamQuery());
  const editor = isEditorRole(role);
  const email = (id: string | null) => team.find((p) => p.id === id)?.email;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">{editor ? "Garage" : "My Garage"}</h1>
          <p className="text-sm text-muted-foreground">
            {editor ? `${cars.length} client cars` : "Your cars and their tuning history"}
          </p>
        </div>
        <Button asChild className="shadow-glow">
          <Link to="/garage/novo"><Plus /> Add car</Link>
        </Button>
      </div>

      {cars.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No cars yet. Add your car to get started!
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {cars.map((c) => (
            <li key={c.id}>
              <Link to="/garage/$id" params={{ id: c.id }}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{c.brand} {c.model}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {[c.plate, c.engine, c.year].filter(Boolean).join(" · ")}
                  </div>
                  {editor && (
                    <div className="truncate text-xs text-muted-foreground">
                      Owner: {email(c.owner_id) ?? "not assigned"}
                    </div>
                  )}
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
