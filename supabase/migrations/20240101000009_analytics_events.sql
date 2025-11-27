-- Analytics events for lightweight product metrics (views, submissions, saves)

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.profiles(id),
  form_id UUID REFERENCES public.signup_forms(id),
  list_id UUID REFERENCES public.recipient_lists(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('form_view','form_submit','form_submit_error','builder_save')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill organization_id automatically from form_id when present
CREATE OR REPLACE FUNCTION public.set_analytics_org_from_form()
RETURNS trigger AS $$
DECLARE
  org_id UUID;
BEGIN
  IF NEW.organization_id IS NULL AND NEW.form_id IS NOT NULL THEN
    SELECT organization_id INTO org_id FROM public.signup_forms WHERE id = NEW.form_id;
    NEW.organization_id = org_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_analytics_events_set_org ON public.analytics_events;
CREATE TRIGGER trg_analytics_events_set_org
BEFORE INSERT OR UPDATE ON public.analytics_events
FOR EACH ROW EXECUTE FUNCTION public.set_analytics_org_from_form();

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_analytics_events_org ON public.analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_form ON public.analytics_events(form_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (data is non-sensitive; org set via trigger)
DROP POLICY IF EXISTS analytics_events_insert_any ON public.analytics_events;
CREATE POLICY analytics_events_insert_any ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Allow org members to read their own events
DROP POLICY IF EXISTS analytics_events_select_org ON public.analytics_events;
CREATE POLICY analytics_events_select_org ON public.analytics_events
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
