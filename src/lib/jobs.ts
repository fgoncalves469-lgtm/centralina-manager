import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];
export type JobFile = Database["public"]["Tables"]["job_files"]["Row"];

export const STAGES = ["Stage 1", "Stage 2", "Stage 3", "EGR/DPF off", "Personalizado"];
export const FILE_KINDS = { original: "Original", modified: "Modificado" } as const;

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

/** Ganho em percentagem entre valor antes e depois (null se faltar dado). */
export function gainPercent(before: number | null, after: number | null): number | null {
  if (before == null || after == null || before <= 0) return null;
  return Math.round(((after - before) / before) * 100);
}
