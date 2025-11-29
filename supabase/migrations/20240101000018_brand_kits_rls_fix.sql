-- Relax brand_kits modify to allow explicit org_id when current org is null (e.g., during asset uploads)

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_kits_select ON public.brand_kits;
DROP POLICY IF EXISTS brand_kits_modify ON public.brand_kits;

-- Select stays scoped to current org
CREATE POLICY brand_kits_select ON public.brand_kits
  FOR SELECT
  USING (
    organization_id = public.get_current_organization_id()
  );

-- Modify allows when org matches current org, or when current org is null but org_id is provided
CREATE POLICY brand_kits_modify ON public.brand_kits
  FOR ALL
  USING (
    organization_id = public.get_current_organization_id()
    OR public.get_current_organization_id() IS NULL
  )
  WITH CHECK (
    organization_id = public.get_current_organization_id()
    OR public.get_current_organization_id() IS NULL
  );
