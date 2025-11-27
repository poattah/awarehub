-- Enable RLS and add org-scoped policies for recipient tables

ALTER TABLE public.recipient_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_contact_memberships ENABLE ROW LEVEL SECURITY;

-- Recipient lists: org members only
DROP POLICY IF EXISTS recipient_lists_select ON public.recipient_lists;
DROP POLICY IF EXISTS recipient_lists_modify ON public.recipient_lists;
CREATE POLICY recipient_lists_select ON public.recipient_lists
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY recipient_lists_modify ON public.recipient_lists
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- Recipient contacts: org members only
DROP POLICY IF EXISTS recipient_contacts_select ON public.recipient_contacts;
DROP POLICY IF EXISTS recipient_contacts_modify ON public.recipient_contacts;
CREATE POLICY recipient_contacts_select ON public.recipient_contacts
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY recipient_contacts_modify ON public.recipient_contacts
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- Contact memberships: ensure list belongs to current org
DROP POLICY IF EXISTS recipient_memberships_select ON public.recipient_contact_memberships;
DROP POLICY IF EXISTS recipient_memberships_modify ON public.recipient_contact_memberships;
CREATE POLICY recipient_memberships_select ON public.recipient_contact_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipient_lists rl
      WHERE rl.id = list_id AND rl.organization_id = public.get_current_organization_id()
    )
  );
CREATE POLICY recipient_memberships_modify ON public.recipient_contact_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.recipient_lists rl
      WHERE rl.id = list_id AND rl.organization_id = public.get_current_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipient_lists rl
      WHERE rl.id = list_id AND rl.organization_id = public.get_current_organization_id()
    )
  );
