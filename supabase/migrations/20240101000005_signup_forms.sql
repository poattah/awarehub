-- Signup forms and submissions
CREATE TABLE IF NOT EXISTS public.signup_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_list_id UUID REFERENCES public.recipient_lists(id) ON DELETE SET NULL,
  fields JSONB NOT NULL DEFAULT jsonb_build_object(
    'email', jsonb_build_object('enabled', true, 'required', true),
    'first_name', jsonb_build_object('enabled', true, 'required', false),
    'last_name', jsonb_build_object('enabled', true, 'required', false),
    'phone', jsonb_build_object('enabled', true, 'required', false)
  ),
  settings JSONB NOT NULL DEFAULT jsonb_build_object(
    'double_opt_in', false,
    'allow_duplicates', false
  ),
  success_config JSONB NOT NULL DEFAULT jsonb_build_object(
    'message', 'Thanks for signing up!',
    'redirect_url', null
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signup_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.signup_forms(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.recipient_contacts(id) ON DELETE SET NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','blocked')),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signup_forms_org ON public.signup_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_signup_forms_target_list ON public.signup_forms(target_list_id);
CREATE INDEX IF NOT EXISTS idx_signup_form_submissions_form ON public.signup_form_submissions(form_id);

-- Simple updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_signup_forms_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signup_forms_updated_at ON public.signup_forms;
CREATE TRIGGER trg_signup_forms_updated_at
BEFORE UPDATE ON public.signup_forms
FOR EACH ROW EXECUTE FUNCTION public.touch_signup_forms_updated_at();
