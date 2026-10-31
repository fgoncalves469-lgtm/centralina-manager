ALTER TABLE public.jobs ADD COLUMN status text NOT NULL DEFAULT 'read';
ALTER TABLE public.job_files ADD COLUMN notes text;
ALTER TABLE public.job_files ADD COLUMN uploaded_by_email text DEFAULT (auth.jwt() ->> 'email');
CREATE POLICY "team update files" ON public.job_files FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.file_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.job_files(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  path text NOT NULL,
  size bigint,
  note text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  uploaded_by_email text DEFAULT (auth.jwt() ->> 'email'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_logs TO authenticated;
GRANT ALL ON public.file_logs TO service_role;
ALTER TABLE public.file_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read logs" ON public.file_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "team insert logs" ON public.file_logs FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "team update logs" ON public.file_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "team delete logs" ON public.file_logs FOR DELETE TO authenticated USING (true);