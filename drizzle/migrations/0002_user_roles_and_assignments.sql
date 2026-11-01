CREATE TYPE public.app_role AS ENUM ('admin','contributor','viewer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "team read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.job_assignees (
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.job_assignees TO authenticated;
GRANT ALL ON public.job_assignees TO service_role;
ALTER TABLE public.job_assignees ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_edit_job(_job_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'contributor') AND (
      EXISTS (SELECT 1 FROM public.job_assignees WHERE job_id = _job_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND created_by = auth.uid())
    ))
$$;

CREATE OR REPLACE FUNCTION public.can_edit_file(_file_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_edit_job((SELECT job_id FROM public.job_files WHERE id = _file_id))
$$;

CREATE POLICY "team read assignees" ON public.job_assignees FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin add assignees" ON public.job_assignees FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin remove assignees" ON public.job_assignees FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Signup: profile + role (first user admin, others viewer)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN 'viewer'::public.app_role ELSE 'admin'::public.app_role END)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users: oldest becomes admin, rest contributor
INSERT INTO public.profiles (id, email) SELECT id, email FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT id, CASE WHEN row_number() OVER (ORDER BY created_at) = 1 THEN 'admin'::public.app_role ELSE 'contributor'::public.app_role END
FROM auth.users ON CONFLICT DO NOTHING;

-- Tighten write policies
DROP POLICY "team insert jobs" ON public.jobs;
DROP POLICY "team update jobs" ON public.jobs;
DROP POLICY "team delete jobs" ON public.jobs;
CREATE POLICY "editors insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor')));
CREATE POLICY "editors update jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.can_edit_job(id));
CREATE POLICY "admin delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY "team insert files" ON public.job_files;
DROP POLICY "team update files" ON public.job_files;
DROP POLICY "team delete files" ON public.job_files;
CREATE POLICY "editors insert files" ON public.job_files FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.can_edit_job(job_id));
CREATE POLICY "editors update files" ON public.job_files FOR UPDATE TO authenticated USING (public.can_edit_job(job_id));
CREATE POLICY "editors delete files" ON public.job_files FOR DELETE TO authenticated USING (public.can_edit_job(job_id));

DROP POLICY "team insert logs" ON public.file_logs;
DROP POLICY "team update logs" ON public.file_logs;
DROP POLICY "team delete logs" ON public.file_logs;
CREATE POLICY "editors insert logs" ON public.file_logs FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.can_edit_file(file_id));
CREATE POLICY "editors update logs" ON public.file_logs FOR UPDATE TO authenticated USING (public.can_edit_file(file_id));
CREATE POLICY "editors delete logs" ON public.file_logs FOR DELETE TO authenticated USING (public.can_edit_file(file_id));

DROP POLICY "team upload ecu" ON storage.objects;
DROP POLICY "team delete ecu" ON storage.objects;
CREATE POLICY "editors upload ecu" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ecu-files' AND public.can_edit_job(((storage.foldername(name))[1])::uuid));
CREATE POLICY "editors delete ecu" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ecu-files' AND public.can_edit_job(((storage.foldername(name))[1])::uuid));