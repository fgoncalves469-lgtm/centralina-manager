CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_name text NOT NULL DEFAULT '',
  client_phone text,
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  engine text,
  year int,
  plate text,
  ecu text,
  stage text NOT NULL DEFAULT 'Stage 1',
  hp_before numeric,
  hp_after numeric,
  nm_before numeric,
  nm_after numeric,
  notes text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "team insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "team update jobs" ON public.jobs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "team delete jobs" ON public.jobs FOR DELETE TO authenticated USING (true);

CREATE TABLE public.job_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'original',
  file_name text NOT NULL,
  path text NOT NULL,
  size bigint,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_files TO authenticated;
GRANT ALL ON public.job_files TO service_role;
ALTER TABLE public.job_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read files" ON public.job_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "team insert files" ON public.job_files FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "team delete files" ON public.job_files FOR DELETE TO authenticated USING (true);

CREATE POLICY "team read ecu" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ecu-files');
CREATE POLICY "team upload ecu" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ecu-files');
CREATE POLICY "team delete ecu" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ecu-files');