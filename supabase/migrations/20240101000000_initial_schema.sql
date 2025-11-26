-- =====================================================
-- AWAREHUB - Complete Supabase Database Schema
-- Awareness-as-a-Service Platform
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- 1. Organizations (Customer Accounts)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT,
  size_band TEXT CHECK (size_band IN ('1-50', '51-200', '201-1000', '1001-5000', '5000+')),
  timezone TEXT DEFAULT 'America/New_York',
  is_active BOOLEAN DEFAULT TRUE,
  plan_tier TEXT DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'growth', 'enterprise')),
  billing_email TEXT,
  billing_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_is_active ON public.organizations(is_active) WHERE deleted_at IS NULL;

-- 2. Profiles (Application-level user profiles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('org_admin', 'campaign_admin', 'editor', 'viewer')),
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_profiles_organization_role ON public.profiles(organization_id, role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- =====================================================
-- BRAND & DESIGN
-- =====================================================

-- 3. Brand Kits
CREATE TABLE public.brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#FFFFFF',
  accent_color TEXT,
  font_family_heading TEXT DEFAULT 'Inter',
  font_family_body TEXT DEFAULT 'Inter',
  logo_url TEXT,
  additional_styles JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_brand_kits_organization_id ON public.brand_kits(organization_id);
CREATE UNIQUE INDEX idx_brand_kits_one_default_per_org ON public.brand_kits(organization_id)
  WHERE is_default = TRUE AND deleted_at IS NULL;

-- 4. Brand Assets
CREATE TABLE public.brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('logo', 'icon', 'photo', 'illustration', 'background')),
  file_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_brand_assets_organization_id ON public.brand_assets(organization_id);
CREATE INDEX idx_brand_assets_type ON public.brand_assets(organization_id, type);

-- =====================================================
-- AWARENESS CALENDAR & EVENTS
-- =====================================================

-- 5. Calendar Events
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('DEI', 'Wellness', 'Compliance', 'Sustainability', 'Fun', 'Heritage', 'Mental Health', 'Safety', 'Other')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_all_day BOOLEAN DEFAULT TRUE,
  scope TEXT NOT NULL DEFAULT 'organization' CHECK (scope IN ('global', 'organization')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX idx_calendar_events_organization_id ON public.calendar_events(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_calendar_events_category ON public.calendar_events(category);
CREATE INDEX idx_calendar_events_scope ON public.calendar_events(scope);

-- =====================================================
-- TEMPLATES & ASSETS
-- =====================================================

-- 6. Template Categories
CREATE TABLE public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_categories_slug ON public.template_categories(slug);

-- 7. Templates
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.template_categories(id),
  template_type TEXT NOT NULL CHECK (template_type IN ('poster', 'email', 'slack_card', 'teams_card', 'social_card', 'zoom_background', 'digital_signage')),
  base_layout JSONB DEFAULT '{}',
  sample_content JSONB DEFAULT '{}',
  is_global BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_templates_organization_id ON public.templates(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_templates_type ON public.templates(template_type);
CREATE INDEX idx_templates_category ON public.templates(category_id);
CREATE INDEX idx_templates_global ON public.templates(is_global) WHERE is_global = TRUE;

-- 8. Template Assets
CREATE TABLE public.template_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  asset_role TEXT CHECK (asset_role IN ('background', 'icon', 'photo', 'decoration')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_assets_template_id ON public.template_assets(template_id);

-- =====================================================
-- CAMPAIGNS & CHANNEL CONFIGURATION
-- =====================================================

-- 9. Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'archived')),
  awareness_event_id UUID REFERENCES public.calendar_events(id),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  primary_category TEXT CHECK (primary_category IN ('DEI', 'Wellness', 'Compliance', 'Sustainability', 'Fun', 'Heritage', 'Mental Health', 'Safety', 'Other')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_organization_id ON public.campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(organization_id, status);
CREATE INDEX idx_campaigns_start_at ON public.campaigns(organization_id, start_at);
CREATE INDEX idx_campaigns_created_by ON public.campaigns(created_by);
CREATE INDEX idx_campaigns_event ON public.campaigns(awareness_event_id);

-- 10. Campaign Assets
CREATE TABLE public.campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('poster', 'email', 'slack_card', 'teams_card', 'social_card', 'zoom_background', 'digital_signage')),
  file_url TEXT,
  data JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_campaign_assets_campaign_id ON public.campaign_assets(campaign_id);
CREATE INDEX idx_campaign_assets_organization_id ON public.campaign_assets(organization_id);

-- 11. Channels
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('slack', 'teams', 'email', 'intranet', 'tv_signage')),
  name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_channels_organization_id ON public.channels(organization_id);
CREATE INDEX idx_channels_type ON public.channels(organization_id, type);

-- 12. Campaign Channels (Join table)
CREATE TABLE public.campaign_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  message_payload JSONB DEFAULT '{}',
  target_segment TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, channel_id)
);

CREATE INDEX idx_campaign_channels_campaign_id ON public.campaign_channels(campaign_id);
CREATE INDEX idx_campaign_channels_channel_id ON public.campaign_channels(channel_id);
CREATE INDEX idx_campaign_channels_status ON public.campaign_channels(status, scheduled_at);

-- =====================================================
-- SCHEDULING & NOTIFICATIONS
-- =====================================================

-- 13. Scheduled Jobs
CREATE TABLE public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('campaign_send', 'reminder', 'report', 'cleanup')),
  campaign_channel_id UUID REFERENCES public.campaign_channels(id) ON DELETE SET NULL,
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  last_error TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_jobs_status_run_at ON public.scheduled_jobs(status, run_at);
CREATE INDEX idx_scheduled_jobs_organization_id ON public.scheduled_jobs(organization_id);

-- 14. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL CHECK (type IN ('system', 'campaign_update', 'approval_request', 'engagement')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_profile_id, is_read);
CREATE INDEX idx_notifications_organization_id ON public.notifications(organization_id);

-- =====================================================
-- ENGAGEMENT & ANALYTICS
-- =====================================================

-- 15. Engagement Events
CREATE TABLE public.engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  campaign_channel_id UUID REFERENCES public.campaign_channels(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'reaction', 'quiz_start', 'quiz_complete', 'survey_start', 'survey_complete', 'pledge_signed', 'share')),
  event_value TEXT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_engagement_events_campaign_id ON public.engagement_events(campaign_id);
CREATE INDEX idx_engagement_events_organization_id ON public.engagement_events(organization_id);
CREATE INDEX idx_engagement_events_type ON public.engagement_events(campaign_id, event_type);
CREATE INDEX idx_engagement_events_profile ON public.engagement_events(profile_id, campaign_id);
CREATE INDEX idx_engagement_events_occurred_at ON public.engagement_events(occurred_at);

-- =====================================================
-- QUIZZES & SURVEYS (Phase 2 Ready)
-- =====================================================

-- 16. Quiz Questions
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'free_text')),
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_quiz_questions_campaign_id ON public.quiz_questions(campaign_id);

-- 17. Quiz Options
CREATE TABLE public.quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_options_question_id ON public.quiz_options(question_id);

-- 18. Quiz Responses
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option_ids UUID[],
  free_text_answer TEXT,
  is_correct BOOLEAN,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_responses_campaign_id ON public.quiz_responses(campaign_id);
CREATE INDEX idx_quiz_responses_profile_id ON public.quiz_responses(profile_id);

-- 19. Surveys
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_surveys_campaign_id ON public.surveys(campaign_id);

-- 20. Survey Questions
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('rating', 'single_choice', 'multiple_choice', 'free_text')),
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_survey_questions_survey_id ON public.survey_questions(survey_id);

-- 21. Survey Responses
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_profile_id ON public.survey_responses(profile_id);

-- =====================================================
-- HELPER FUNCTIONS (after tables are created)
-- =====================================================

-- Function to get current organization from authenticated user
CREATE OR REPLACE FUNCTION public.get_current_organization_id()
RETURNS UUID AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_brand_assets_updated_at
  BEFORE UPDATE ON public.brand_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_template_categories_updated_at
  BEFORE UPDATE ON public.template_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_template_assets_updated_at
  BEFORE UPDATE ON public.template_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_campaign_assets_updated_at
  BEFORE UPDATE ON public.campaign_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_campaign_channels_updated_at
  BEFORE UPDATE ON public.campaign_channels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_scheduled_jobs_updated_at
  BEFORE UPDATE ON public.scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_quiz_options_updated_at
  BEFORE UPDATE ON public.quiz_options
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_survey_questions_updated_at
  BEFORE UPDATE ON public.survey_questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all multi-tenant tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Organizations
-- =====================================================

CREATE POLICY "org_select_own" ON public.organizations
  FOR SELECT
  USING (id = public.get_current_organization_id());

CREATE POLICY "org_update_own" ON public.organizations
  FOR UPDATE
  USING (id = public.get_current_organization_id())
  WITH CHECK (id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Profiles
-- =====================================================

CREATE POLICY "profiles_select_own_org" ON public.profiles
  FOR SELECT
  USING (organization_id = public.get_current_organization_id() OR id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================================
-- RLS POLICIES - Brand Kits
-- =====================================================

CREATE POLICY "brand_kits_select" ON public.brand_kits
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "brand_kits_modify" ON public.brand_kits
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Brand Assets
-- =====================================================

CREATE POLICY "brand_assets_select" ON public.brand_assets
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "brand_assets_modify" ON public.brand_assets
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Calendar Events
-- =====================================================

CREATE POLICY "calendar_events_select" ON public.calendar_events
  FOR SELECT
  USING (
    scope = 'global'
    OR organization_id = public.get_current_organization_id()
  );

CREATE POLICY "calendar_events_modify" ON public.calendar_events
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Templates
-- =====================================================

CREATE POLICY "templates_select" ON public.templates
  FOR SELECT
  USING (
    is_global = TRUE
    OR organization_id = public.get_current_organization_id()
  );

CREATE POLICY "templates_modify" ON public.templates
  FOR ALL
  USING (
    organization_id = public.get_current_organization_id()
    AND is_locked = FALSE
  )
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Campaigns
-- =====================================================

CREATE POLICY "campaigns_select" ON public.campaigns
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "campaigns_modify" ON public.campaigns
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Campaign Assets
-- =====================================================

CREATE POLICY "campaign_assets_select" ON public.campaign_assets
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "campaign_assets_modify" ON public.campaign_assets
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Channels
-- =====================================================

CREATE POLICY "channels_select" ON public.channels
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "channels_modify" ON public.channels
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Campaign Channels
-- =====================================================

CREATE POLICY "campaign_channels_select" ON public.campaign_channels
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "campaign_channels_modify" ON public.campaign_channels
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Engagement Events
-- =====================================================

CREATE POLICY "engagement_events_select" ON public.engagement_events
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "engagement_events_insert" ON public.engagement_events
  FOR INSERT
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- RLS POLICIES - Notifications
-- =====================================================

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (recipient_profile_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (recipient_profile_id = auth.uid())
  WITH CHECK (recipient_profile_id = auth.uid());

-- =====================================================
-- RLS POLICIES - Quizzes & Surveys
-- =====================================================

CREATE POLICY "quiz_questions_select" ON public.quiz_questions
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "quiz_questions_modify" ON public.quiz_questions
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

CREATE POLICY "quiz_responses_select" ON public.quiz_responses
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "quiz_responses_insert" ON public.quiz_responses
  FOR INSERT
  WITH CHECK (organization_id = public.get_current_organization_id());

CREATE POLICY "surveys_select" ON public.surveys
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "surveys_modify" ON public.surveys
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

CREATE POLICY "survey_responses_select" ON public.survey_responses
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());

CREATE POLICY "survey_responses_insert" ON public.survey_responses
  FOR INSERT
  WITH CHECK (organization_id = public.get_current_organization_id());

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.organizations IS 'Customer accounts (tenants)';
COMMENT ON TABLE public.profiles IS 'Application user profiles linked to Supabase auth';
COMMENT ON TABLE public.brand_kits IS 'Corporate branding configurations';
COMMENT ON TABLE public.calendar_events IS 'Awareness dates - global and organization-specific';
COMMENT ON TABLE public.templates IS 'Design templates for campaigns';
COMMENT ON TABLE public.campaigns IS 'Awareness campaigns';
COMMENT ON TABLE public.channels IS 'Distribution channels (Slack, Teams, Email, etc.)';
COMMENT ON TABLE public.engagement_events IS 'User engagement tracking';

-- =====================================================
-- RECIPIENTS & LISTS (lightweight)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recipient_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'List' CHECK (type IN ('List', 'Segment')),
  tags TEXT[] DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipient_lists_org ON public.recipient_lists(organization_id);

CREATE TABLE IF NOT EXISTS public.recipient_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  location TEXT,
  tags TEXT[] DEFAULT '{}',
  channels TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipient_contacts_email_org ON public.recipient_contacts(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_recipient_contacts_org ON public.recipient_contacts(organization_id);

CREATE TABLE IF NOT EXISTS public.recipient_contact_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.recipient_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.recipient_contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipient_contact_memberships_unique ON public.recipient_contact_memberships(list_id, contact_id);
