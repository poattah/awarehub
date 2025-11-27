-- Broaden calendar_events category check to align with UI options
ALTER TABLE public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_category_check;

ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_category_check CHECK (
    category IN (
      'DEI','Heritage','Mental Health','Wellness','Sustainability','Compliance','Safety','Finance',
      'Engagement','Corporate Events','Religious Events','National Events','Social Events','Casual Events',
      'Custom Events','Fun','Other'
    )
  );
