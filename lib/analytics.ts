import { supabase } from '@/lib/supabase'

type AnalyticsEvent = {
  event_type: 'form_view' | 'form_submit' | 'form_submit_error' | 'builder_save'
  form_id?: string
  list_id?: string
  organization_id?: string | null
  metadata?: Record<string, any>
}

export async function logAnalyticsEvent(event: AnalyticsEvent) {
  const payload = {
    event_type: event.event_type,
    form_id: event.form_id || null,
    list_id: event.list_id || null,
    organization_id: event.organization_id || null,
    metadata: event.metadata || {},
  }
  try {
    await supabase.from('analytics_events').insert(payload)
  } catch {
    // swallow analytics errors
  }
}
