import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { myRoleQuery, ROLES, teamQuery, type Role } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/utilizadores")({
  head: () => ({
    meta: [
      { title: "Users — Remap Garage" },
      { name: "description", content: "Manage team members and their permissions." },
      { property: "og:title", content: "Users — Remap Garage" },
      { property: "og:description", content: "Manage team members and their permissions." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(teamQuery()),
      context.queryClient.ensureQueryData(myRoleQuery(context.user.id)),
    ]);
  },
  component: UsersPage,
});

function UsersPage() {
  const { user } = Route.useRouteContext();
  const { data: myRole } = useSuspenseQuery(myRoleQuery(user.id));
  const { data: team } = useSuspenseQuery(teamQuery());
  const qc = useQueryClient();
  const isAdmin = myRole === "admin";

  async function setRole(userId: string, role: Role) {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id" });
    if (error) return void toast.error("Could not change permission");
    toast.success("Permission updated");
    qc.invalidateQueries({ queryKey: ["team"] });
    qc.invalidateQueries({ queryKey: ["role"] });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/trabalhos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Jobs
      </Link>
      <h1 className="text-5xl">Users</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        New accounts start as <b>Client</b>.
      </p>
      <ul className="space-y-2">
        {team.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <span className="min-w-0 flex-1 truncate">
              {m.email} {m.id === user.id && <span className="text-xs text-muted-foreground">(you)</span>}
            </span>
            {isAdmin && m.id !== user.id ? (
              <Select value={m.role} onValueChange={(r) => setRole(m.id, r as Role)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['admin','viewer'] as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLES[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">{ROLES[m.role]}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
