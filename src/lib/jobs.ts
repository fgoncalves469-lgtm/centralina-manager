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
  contributor: "Contributor",
  viewer: "View only",
};

/** Can this user edit a job? Admin: always. Contributor: if assigned or creator. Viewer: never. */
export function canEditJob(role: Role | null | undefined, userId: string, job: { created_by: string }, assigneeIds: string[]) {
  if (role === "admin") return true;
  if (role === "contributor") return job.created_by === userId || assigneeIds.includes(userId);
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
