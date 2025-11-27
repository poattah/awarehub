-- Events and registrations for event signup (Eventbrite-style)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  timezone TEXT,
  location TEXT,
  virtual_url TEXT,
  capacity INTEGER,
  cover_url TEXT,
  list_id UUID REFERENCES public.recipient_lists(id),
  brand_kit_id UUID REFERENCES public.brand_kits(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  list_id UUID REFERENCES public.recipient_lists(id),
  attendee_name TEXT,
  attendee_email TEXT,
  attendee_company TEXT,
  attendee_role TEXT,
  attendee_phone TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','waitlisted','cancelled')),
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_org ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_regs_org ON public.event_registrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_regs_event ON public.event_registrations(event_id);

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select_org ON public.events;
DROP POLICY IF EXISTS events_modify_org ON public.events;
CREATE POLICY events_select_org ON public.events
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY events_modify_org ON public.events
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

DROP POLICY IF EXISTS event_regs_select_org ON public.event_registrations;
DROP POLICY IF EXISTS event_regs_modify_org ON public.event_registrations;
CREATE POLICY event_regs_select_org ON public.event_registrations
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY event_regs_modify_org ON public.event_registrations
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());
