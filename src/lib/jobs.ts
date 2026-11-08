import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];
export type JobFile = Database["public"]["Tables"]["job_files"]["Row"];

export type FileLog = Database["public"]["Tables"]["file_logs"]["Row"];

export const STAGES = ["Stage 1", "Stage 2", "Stage 3", "EGR/DPF off", "Custom"];
export const FILE_KINDS = { original: "Original read", modified: "Modified map" } as const;
export const STATUSES = {
  read: "Read · waiting for map",
  map_ready: "Map ready · to flash",
  testing: "Testing · logs needed",
  done: "Done",
} as const;
export type Status = keyof typeof STATUSES;

export const jobsQuery = () =>
  queryOptions({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const jobQuery = (id: string) =>
  queryOptions({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const jobFilesQuery = (id: string) =>
  queryOptions({
    queryKey: ["jobs", id, "files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_files")
        .select("*")
        .eq("job_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const fileLogsQuery = (jobId: string, fileIds: string[]) =>
  queryOptions({
    queryKey: ["jobs", jobId, "logs", fileIds],
    queryFn: async () => {
      if (fileIds.length === 0) return [] as FileLog[];
      const { data, error } = await supabase
        .from("file_logs")
        .select("*")
        .in("file_id", fileIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export function safeName(name: string) {
  return name.replace(/[^\w.\-]/g, "_");
}

/** Percentage gain between before and after (null if a value is missing). */
export function gainPercent(before: number | null, after: number | null): number | null {
  if (before == null || after == null || before <= 0) return null;
  return Math.round(((after - before) / before) * 100);
}

export type Role = Database["public"]["Enums"]["app_role"];
export const ROLES: Record<Role, string> = {
  admin: "Admin",
  contributor: "Client",
  viewer: "Client",
};

/** Can this user edit a job? Admin: always. Contributor: if assigned or creator. Viewer: never. */
export function canEditJob(role: Role | null | undefined, userId: string, job: { created_by: string }, assigneeIds: string[]) {
  if (role === "admin") return true;
  return false;
}

export const myRoleQuery = (userId: string) =>
  queryOptions({
    queryKey: ["role", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return (data?.role ?? "viewer") as Role;
    },
  });

export const teamQuery = () =>
  queryOptions({
    queryKey: ["team"],
    queryFn: async () => {
      const [{ data: profiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles?.find((r) => r.user_id === p.id)?.role ?? "viewer") as Role,
      }));
    },
  });

export const assigneesQuery = (jobId: string) =>
  queryOptions({
    queryKey: ["jobs", jobId, "assignees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_assignees").select("user_id").eq("job_id", jobId);
      if (error) throw error;
      return (data ?? []).map((a) => a.user_id);
    },
  });

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export const vehiclesQuery = () =>
  queryOptions({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("brand")
        .order("model")
        .order("engine");
      if (error) throw error;
      return data;
    },
  });

/** Text stored on a job for a vehicle row, e.g. "1.6 16V (TU5JP4)". */
export function engineLabel(v: Pick<Vehicle, "engine" | "engine_code">) {
  return v.engine_code ? `${v.engine} (${v.engine_code})` : v.engine;
}

/** Split a typed ECU list ("IAW 1AP / 48P2") into separate entries. */
export function parseEcus(text: string) {
  return text.split(/[\/,]/).map((s) => s.trim()).filter(Boolean);
}

/** Search a vehicle row by model, engine, engine code or ECU. */
export function matchesVehicle(v: Vehicle, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [v.brand, v.model, v.engine, v.engine_code ?? "", ...v.ecus].some((x) => x.toLowerCase().includes(s));
}

export type Car = Database["public"]["Tables"]["cars"]["Row"];
export type CarInsert = Database["public"]["Tables"]["cars"]["Insert"];

export const isEditorRole = (role: Role | null | undefined) => role === "admin";

/** Can delete a car: only admin and contributors (owners cannot). */
export const canDeleteCar = (role: Role | null | undefined) => isEditorRole(role);

/** Can edit a car's details: editors, or the car's owner. */
export function canEditCar(role: Role | null | undefined, userId: string, car: Pick<Car, "owner_id">) {
  return isEditorRole(role) || car.owner_id === userId;
}

/** Top navigation tabs. Add new sections here; `roles` limits who sees each one. */
export const NAV_TABS: { to: "/trabalhos" | "/garage" | "/ecu-database" | "/utilizadores"; label: string; roles: Role[] }[] = [
  { to: "/trabalhos", label: "Jobs", roles: ["admin"] },
  { to: "/garage", label: "My Garage", roles: ["admin", "contributor", "viewer"] },
  { to: "/ecu-database", label: "ECU Database", roles: ["admin"] },
  { to: "/utilizadores", label: "Users", roles: ["admin"] },
];
export const tabsFor = (role: Role) => NAV_TABS.filter((t) => t.roles.includes(role));

export const carsQuery = () =>
  queryOptions({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const carQuery = (id: string) =>
  queryOptions({
    queryKey: ["cars", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const carJobsQuery = (carId: string) =>
  queryOptions({
    queryKey: ["cars", carId, "jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, created_at, stage, status, hp_before, hp_after, nm_before, nm_after, ecu")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
