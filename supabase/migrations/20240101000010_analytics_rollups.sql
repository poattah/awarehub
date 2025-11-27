-- Rollup views for analytics events

CREATE OR REPLACE VIEW public.analytics_form_rollups AS
SELECT
  form_id,
  organization_id,
  COUNT(*) FILTER (WHERE event_type = 'form_view') AS views,
  COUNT(*) FILTER (WHERE event_type = 'form_submit') AS submissions,
  COUNT(*) FILTER (WHERE event_type = 'form_submit_error') AS submit_errors,
  COUNT(*) FILTER (WHERE event_type = 'builder_save') AS builder_saves,
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'form_view') = 0 THEN NULL
    ELSE (COUNT(*) FILTER (WHERE event_type = 'form_submit')::numeric) /
         NULLIF(COUNT(*) FILTER (WHERE event_type = 'form_view'), 0)
  END AS conversion_rate
FROM public.analytics_events
GROUP BY form_id, organization_id;

CREATE OR REPLACE VIEW public.analytics_form_rollups_daily AS
SELECT
  form_id,
  organization_id,
  DATE(created_at) AS event_date,
  COUNT(*) FILTER (WHERE event_type = 'form_view') AS views,
  COUNT(*) FILTER (WHERE event_type = 'form_submit') AS submissions,
  COUNT(*) FILTER (WHERE event_type = 'form_submit_error') AS submit_errors,
  COUNT(*) FILTER (WHERE event_type = 'builder_save') AS builder_saves
FROM public.analytics_events
GROUP BY form_id, organization_id, DATE(created_at);
