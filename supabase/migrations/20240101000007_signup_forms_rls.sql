-- Secure signup forms to the creator's organization and scope submissions
-- 1) Backfill and enforce organization_id on signup_forms
-- 2) Add organization_id + trigger on signup_form_submissions
-- 3) Enable RLS + policies so each org sees only its own data

-- Ensure signup_forms has an organization_id defaulted to the current org
ALTER TABLE public.signup_forms
  ALTER COLUMN organization_id SET DEFAULT public.get_current_organization_id();

-- Backfill existing forms using their target list's organization_id when available
UPDATE public.signup_forms sf
SET organization_id = rl.organization_id
FROM public.recipient_lists rl
WHERE sf.organization_id IS NULL
  AND sf.target_list_id = rl.id;

-- Fallback: if any rows remain null, pin them to the first organization to satisfy NOT NULL
UPDATE public.signup_forms sf
SET organization_id = org.id
FROM (
  SELECT id FROM public.organizations ORDER BY created_at ASC LIMIT 1
) org
WHERE sf.organization_id IS NULL;

-- Enforce presence
ALTER TABLE public.signup_forms
  ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to submissions and backfill from parent form
ALTER TABLE public.signup_form_submissions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

UPDATE public.signup_form_submissions sfs
SET organization_id = sf.organization_id
FROM public.signup_forms sf
WHERE sfs.organization_id IS NULL
  AND sfs.form_id = sf.id;

ALTER TABLE public.signup_form_submissions
  ALTER COLUMN organization_id SET NOT NULL;

-- Keep submission org in sync with form org
CREATE OR REPLACE FUNCTION public.set_signup_form_submission_org()
RETURNS trigger AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id FROM public.signup_forms WHERE id = NEW.form_id;
  NEW.organization_id = org_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_signup_form_submissions_set_org ON public.signup_form_submissions;
CREATE TRIGGER trg_signup_form_submissions_set_org
BEFORE INSERT OR UPDATE ON public.signup_form_submissions
FOR EACH ROW EXECUTE FUNCTION public.set_signup_form_submission_org();

-- Enable RLS
ALTER TABLE public.signup_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_form_submissions ENABLE ROW LEVEL SECURITY;

-- Policies: only current org can read/write its forms
DROP POLICY IF EXISTS signup_forms_select ON public.signup_forms;
DROP POLICY IF EXISTS signup_forms_modify ON public.signup_forms;
CREATE POLICY signup_forms_select ON public.signup_forms
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY signup_forms_modify ON public.signup_forms
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- Policies: submissions scoped to the form's organization
DROP POLICY IF EXISTS signup_form_submissions_select ON public.signup_form_submissions;
DROP POLICY IF EXISTS signup_form_submissions_modify ON public.signup_form_submissions;
CREATE POLICY signup_form_submissions_select ON public.signup_form_submissions
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY signup_form_submissions_modify ON public.signup_form_submissions
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- Helpful indexes for scoping
CREATE INDEX IF NOT EXISTS idx_signup_form_submissions_org ON public.signup_form_submissions(organization_id);
