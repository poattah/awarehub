-- Harden analytics_events policies to be org-scoped and form-consistent

-- Drop permissive insert
DROP POLICY IF EXISTS analytics_events_insert_any ON public.analytics_events;

-- Insert allowed when org_id is present and matches the form's org (if any).
CREATE POLICY analytics_events_insert_scoped ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      organization_id = public.get_current_organization_id()
      OR public.get_current_organization_id() IS NULL -- allow unauthenticated form submissions when org is supplied
    )
    AND (
      form_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.signup_forms sf
        WHERE sf.id = form_id AND sf.organization_id = organization_id
      )
    )
  );

-- Select limited to current org
DROP POLICY IF EXISTS analytics_events_select_org ON public.analytics_events;
CREATE POLICY analytics_events_select_org ON public.analytics_events
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
