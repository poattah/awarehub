-- Harden RLS for calendar_events to keep events tenant-scoped

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_select_org ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_modify_org ON public.calendar_events;

CREATE POLICY calendar_events_select_org ON public.calendar_events
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY calendar_events_modify_org ON public.calendar_events
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());
