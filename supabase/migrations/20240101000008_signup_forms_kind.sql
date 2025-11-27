-- Add kind to differentiate signup vs waitlist forms
ALTER TABLE public.signup_forms
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'signup' CHECK (kind IN ('signup','waitlist'));

-- Backfill any nulls (should be none after NOT NULL default)
UPDATE public.signup_forms SET kind = 'signup' WHERE kind IS NULL;

-- Helpful filter index
CREATE INDEX IF NOT EXISTS idx_signup_forms_kind ON public.signup_forms(kind);
