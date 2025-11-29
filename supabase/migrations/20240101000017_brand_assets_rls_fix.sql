-- Relax brand_assets insert/update to allow explicit org_id when current org is null (e.g., during uploads)

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_assets_modify ON public.brand_assets;
DROP POLICY IF EXISTS brand_assets_select ON public.brand_assets;

-- Select: still scoped to current org
CREATE POLICY brand_assets_select ON public.brand_assets
  FOR SELECT
  USING (
    organization_id = public.get_current_organization_id()
  );

-- Modify: allow when org matches current org, or when current org is null but org_id is provided (service/unauth uploads)
CREATE POLICY brand_assets_modify ON public.brand_assets
  FOR ALL
  USING (
    organization_id = public.get_current_organization_id()
    OR public.get_current_organization_id() IS NULL
  )
  WITH CHECK (
    organization_id = public.get_current_organization_id()
    OR public.get_current_organization_id() IS NULL
  );
