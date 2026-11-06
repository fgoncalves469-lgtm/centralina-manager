CREATE OR REPLACE FUNCTION public.is_editor(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') OR public.has_role(_user_id,'contributor')
$$;

CREATE TABLE public.cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  engine text,
  year integer,
  plate text,
  vin text,
  ecu text,
  gearbox text,
  fuel text,
  color text,
  mileage integer,
  notes text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT ALL ON public.cars TO service_role;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or editor cars" ON public.cars FOR SELECT TO authenticated
  USING (public.is_editor(auth.uid()) OR owner_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "create own car" ON public.cars FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (owner_id = auth.uid() OR public.is_editor(auth.uid())));
CREATE POLICY "owner or editor update car" ON public.cars FOR UPDATE TO authenticated
  USING (public.is_editor(auth.uid()) OR owner_id = auth.uid())
  WITH CHECK (public.is_editor(auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "editors delete car" ON public.cars FOR DELETE TO authenticated
  USING (public.is_editor(auth.uid()));

CREATE OR REPLACE FUNCTION public.protect_car_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admin can change the car owner';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cars_protect_owner BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.protect_car_owner();

ALTER TABLE public.jobs ADD COLUMN car_id uuid REFERENCES public.cars(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.owns_job(_job_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs j JOIN public.cars c ON c.id = j.car_id
    WHERE j.id = _job_id AND c.owner_id = auth.uid())
$$;

DROP POLICY "team read jobs" ON public.jobs;
CREATE POLICY "editors or owner read jobs" ON public.jobs FOR SELECT TO authenticated
  USING (public.is_editor(auth.uid()) OR public.owns_job(id));
DROP POLICY "team read files" ON public.job_files;
CREATE POLICY "editors read files" ON public.job_files FOR SELECT TO authenticated
  USING (public.is_editor(auth.uid()));
DROP POLICY "team read logs" ON public.file_logs;
CREATE POLICY "editors read logs" ON public.file_logs FOR SELECT TO authenticated
  USING (public.is_editor(auth.uid()));
DROP POLICY "team read ecu" ON storage.objects;
CREATE POLICY "editors read ecu" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ecu-files' AND public.is_editor(auth.uid()));