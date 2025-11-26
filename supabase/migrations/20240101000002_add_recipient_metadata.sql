-- Adds metadata column to recipient_contacts for custom fields
ALTER TABLE public.recipient_contacts
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.recipient_contacts.metadata IS 'Custom key/value fields for contacts';
