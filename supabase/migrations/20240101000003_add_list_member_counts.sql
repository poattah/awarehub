-- Add cached member_count to recipient_lists and trigger to maintain it
ALTER TABLE public.recipient_lists
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_recipient_list_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.recipient_lists rl
    SET member_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT list_id, COUNT(*) AS cnt
    FROM public.recipient_contact_memberships
    WHERE list_id = COALESCE(NEW.list_id, OLD.list_id)
    GROUP BY list_id
  ) sub
  WHERE rl.id = sub.list_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recipient_contact_memberships_count ON public.recipient_contact_memberships;
CREATE TRIGGER trg_recipient_contact_memberships_count
AFTER INSERT OR DELETE ON public.recipient_contact_memberships
FOR EACH ROW EXECUTE FUNCTION public.update_recipient_list_count();
