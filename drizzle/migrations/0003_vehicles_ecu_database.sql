CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  engine text NOT NULL,
  engine_code text,
  displacement integer,
  power_hp integer,
  ecus text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "editors insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor'));
CREATE POLICY "editors update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor'));
CREATE POLICY "editors delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor'));
CREATE INDEX vehicles_brand_model_idx ON public.vehicles (brand, model);
INSERT INTO public.vehicles (brand, model, engine, engine_code, displacement, power_hp, ecus) VALUES
('Peugeot','106','1.1 8V','TU1JP',1124,NULL,ARRAY['M7.4.4']::text[]),
('Peugeot','106','1.4 8V','KFX/KFW',1360,NULL,ARRAY['IAW 1AP']::text[]),
('Peugeot','106','1.6 8V','TU5JP',1587,NULL,ARRAY['M7.4.4']::text[]),
('Peugeot','106 GTI','1.6 16V','TU5J4',1587,120,ARRAY['IAW 1AP.41','IAW 48P2.80']::text[]),
('Peugeot','206','1.1 8V','TU1JP',1124,NULL,ARRAY['IAW 48P2']::text[]),
('Peugeot','206','1.4 8V','TU3',1360,NULL,ARRAY['IAW 1AP','IAW 48P2']::text[]),
('Peugeot','206','1.4 16V','ET3J4',1360,NULL,ARRAY['IAW 6LP']::text[]),
('Peugeot','206','1.6 16V','TU5JP4 / NFU',1587,110,ARRAY['Bosch ME7.4.4','Bosch ME7.4.5']::text[]),
('Peugeot','206 GTI','2.0 16V','EW10J4',1997,NULL,ARRAY['IAW 48P2']::text[]),
('Peugeot','306','1.4','TU3',1360,NULL,ARRAY['IAW 1AP.40']::text[]),
('Peugeot','306','1.6','TU5JP',1587,NULL,ARRAY['M7.4.4']::text[]),
('Peugeot','306','1.6 16V','TU5JP4',1587,NULL,ARRAY['ME7.4.4']::text[]),
('Peugeot','307','1.6 16V','TU5JP4',1587,110,ARRAY['ME7.4.4']::text[]),
('Peugeot','1007','1.6 16V','TU5JP4',1587,NULL,ARRAY['ME7.4.4']::text[]),
('Peugeot','Partner','1.4','TU3JP',1360,NULL,ARRAY['IAW 1AP.40']::text[]),
('Peugeot','Partner','1.6 16V','TU5JP4',1587,NULL,ARRAY['ME7.4.4']::text[]),
('Citroën','Saxo','1.1 8V','TU1JP',1124,NULL,ARRAY['M7.4.4']::text[]),
('Citroën','Saxo','1.4 8V','TU3JP',1360,NULL,ARRAY['IAW 1AP.40','IAW 1AP.81']::text[]),
('Citroën','Saxo','1.4 automatic','TU3',1360,NULL,ARRAY['IAW 1AP.50']::text[]),
('Citroën','Saxo','1.6 8V','TU5JP',1587,NULL,ARRAY['M7.4.4']::text[]),
('Citroën','Saxo VTS','1.6 16V','TU5J4',1587,120,ARRAY['IAW 1AP.41','IAW 48P2.80']::text[]),
('Citroën','ZX','1.4','TU3',1360,NULL,ARRAY['IAW 1AP.40']::text[]),
('Citroën','Xsara','1.4','TU3JP',1360,NULL,ARRAY['IAW 1AP.40']::text[]),
('Citroën','Xsara','1.6 16V','TU5JP4',1587,NULL,ARRAY['ME7.4.4']::text[]),
('Citroën','Xsara','1.8','XU7',1761,NULL,ARRAY['IAW 1AP.20']::text[]),
('Citroën','Xsara Picasso','1.6','NFV',1587,NULL,ARRAY['M7.4.4']::text[]),
('Citroën','Xsara Picasso','2.0','RFN',1997,NULL,ARRAY['MM48P']::text[]),
('Citroën','C2','1.1','TU1',1124,NULL,ARRAY['IAW 48P2.72']::text[]),
('Citroën','C2','1.6','TU5',1587,NULL,ARRAY['ME7.4.4']::text[]),
('Citroën','C3','1.1','TU1',1124,NULL,ARRAY['IAW 48P2.72']::text[]),
('Citroën','C3','1.6 16V','TU5JP4',1587,NULL,ARRAY['ME7.4.4']::text[]),
('Citroën','Berlingo','1.4','TU3JP',1360,NULL,ARRAY['IAW 1AP.40']::text[]),
('Citroën','Berlingo','1.6 16V','TU5JP4',1587,NULL,ARRAY['ME7.4.4']::text[]);