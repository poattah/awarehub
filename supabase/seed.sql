-- =====================================================
-- AWAREHUB - Seed Data
-- Sample data for development and demo
-- =====================================================

-- Insert Template Categories
INSERT INTO public.template_categories (name, description, slug) VALUES
('DEI & Inclusion', 'Diversity, Equity, and Inclusion templates', 'dei-inclusion'),
('Wellness & Health', 'Employee wellness and health awareness', 'wellness-health'),
('Heritage Months', 'Cultural heritage celebration templates', 'heritage-months'),
('Sustainability', 'Environmental and sustainability awareness', 'sustainability'),
('Mental Health', 'Mental health awareness and support', 'mental-health'),
('Professional Development', 'Career growth and learning', 'professional-development');

-- Insert Global Calendar Events (organization_id NULL = global)
INSERT INTO public.calendar_events (organization_id, title, description, category, start_date, end_date, scope, tags) VALUES
-- January
(NULL, 'New Year''s Day', 'Start of the new year', 'Fun', '2024-01-01', '2024-01-01', 'global', ARRAY['holiday']),

-- February
(NULL, 'Black History Month', 'Annual observance celebrating the achievements of Black Americans', 'Heritage', '2024-02-01', '2024-02-29', 'global', ARRAY['dei', 'heritage', 'history']),
(NULL, 'Random Acts of Kindness Day', 'Encourage kindness in the workplace', 'Wellness', '2024-02-17', '2024-02-17', 'global', ARRAY['wellness', 'fun']),

-- March
(NULL, 'International Women''s Day', 'Celebrate women''s social, economic, cultural, and political achievements', 'DEI', '2024-03-08', '2024-03-08', 'global', ARRAY['dei', 'women', 'equality']),
(NULL, 'World Water Day', 'Focus on the importance of freshwater', 'Sustainability', '2024-03-22', '2024-03-22', 'global', ARRAY['sustainability', 'environment']),

-- April
(NULL, 'Earth Day', 'Demonstrate support for environmental protection', 'Sustainability', '2024-04-22', '2024-04-22', 'global', ARRAY['sustainability', 'environment', 'climate']),
(NULL, 'Autism Awareness Month', 'Increase understanding and acceptance of autism', 'Mental Health', '2024-04-01', '2024-04-30', 'global', ARRAY['mental-health', 'awareness', 'inclusion']),

-- May
(NULL, 'Mental Health Awareness Month', 'Raise awareness about mental health', 'Mental Health', '2024-05-01', '2024-05-31', 'global', ARRAY['mental-health', 'wellness', 'awareness']),
(NULL, 'Asian American and Pacific Islander Heritage Month', 'Recognize the contributions of Asian Americans and Pacific Islanders', 'Heritage', '2024-05-01', '2024-05-31', 'global', ARRAY['dei', 'heritage', 'aapi']),

-- June
(NULL, 'Pride Month', 'Celebrate LGBTQ+ pride and honor the impact of LGBTQ+ individuals', 'DEI', '2024-06-01', '2024-06-30', 'global', ARRAY['dei', 'lgbtq', 'pride', 'inclusion']),
(NULL, 'Juneteenth', 'Commemorate the emancipation of enslaved African Americans', 'Heritage', '2024-06-19', '2024-06-19', 'global', ARRAY['dei', 'heritage', 'freedom']),
(NULL, 'World Environment Day', 'Encourage awareness and action for environmental protection', 'Sustainability', '2024-06-05', '2024-06-05', 'global', ARRAY['sustainability', 'environment']),

-- July
(NULL, 'Disability Pride Month', 'Celebrate disability culture and raise awareness', 'DEI', '2024-07-01', '2024-07-31', 'global', ARRAY['dei', 'disability', 'inclusion', 'accessibility']),

-- August
(NULL, 'Women''s Equality Day', 'Commemorate the passage of the 19th Amendment', 'DEI', '2024-08-26', '2024-08-26', 'global', ARRAY['dei', 'women', 'equality']),

-- September
(NULL, 'Suicide Prevention Month', 'Raise awareness about suicide prevention', 'Mental Health', '2024-09-01', '2024-09-30', 'global', ARRAY['mental-health', 'awareness', 'prevention']),
(NULL, 'National Hispanic Heritage Month', 'Recognize contributions of Hispanic and Latino Americans', 'Heritage', '2024-09-15', '2024-10-15', 'global', ARRAY['dei', 'heritage', 'hispanic', 'latino']),

-- October
(NULL, 'World Mental Health Day', 'Raise awareness of mental health issues worldwide', 'Mental Health', '2024-10-10', '2024-10-10', 'global', ARRAY['mental-health', 'wellness', 'awareness']),
(NULL, 'Breast Cancer Awareness Month', 'Increase awareness of breast cancer', 'Wellness', '2024-10-01', '2024-10-31', 'global', ARRAY['wellness', 'health', 'awareness']),
(NULL, 'Cybersecurity Awareness Month', 'Raise awareness about digital security', 'Compliance', '2024-10-01', '2024-10-31', 'global', ARRAY['security', 'compliance', 'technology']),

-- November
(NULL, 'Native American Heritage Month', 'Celebrate the culture and contributions of Native Americans', 'Heritage', '2024-11-01', '2024-11-30', 'global', ARRAY['dei', 'heritage', 'native-american']),
(NULL, 'International Men''s Day', 'Focus on men''s health and positive male role models', 'Wellness', '2024-11-19', '2024-11-19', 'global', ARRAY['wellness', 'health', 'men']),

-- December
(NULL, 'International Day of Persons with Disabilities', 'Promote understanding of disability issues', 'DEI', '2024-12-03', '2024-12-03', 'global', ARRAY['dei', 'disability', 'inclusion', 'accessibility']),
(NULL, 'Human Rights Day', 'Commemorate the adoption of the Universal Declaration of Human Rights', 'DEI', '2024-12-10', '2024-12-10', 'global', ARRAY['dei', 'rights', 'equality']);

-- Additional important dates throughout the year
INSERT INTO public.calendar_events (organization_id, title, description, category, start_date, scope, tags) VALUES
(NULL, 'International Day of Happiness', 'Promote happiness and well-being', 'Wellness', '2024-03-20', 'global', ARRAY['wellness', 'happiness']),
(NULL, 'World Health Day', 'Focus on global health awareness', 'Wellness', '2024-04-07', 'global', ARRAY['wellness', 'health']),
(NULL, 'World No Tobacco Day', 'Raise awareness of health risks of tobacco', 'Wellness', '2024-05-31', 'global', ARRAY['wellness', 'health']),
(NULL, 'World Refugee Day', 'Honor the courage of refugees worldwide', 'DEI', '2024-06-20', 'global', ARRAY['dei', 'refugees', 'humanitarian']),
(NULL, 'International Day of Friendship', 'Promote friendship and understanding', 'Fun', '2024-07-30', 'global', ARRAY['fun', 'friendship', 'culture']),
(NULL, 'International Literacy Day', 'Highlight importance of literacy', 'Other', '2024-09-08', 'global', ARRAY['education', 'literacy']),
(NULL, 'World Teachers'' Day', 'Celebrate teachers and their contributions', 'Other', '2024-10-05', 'global', ARRAY['education', 'teachers']),
(NULL, 'International Volunteer Day', 'Recognize volunteers and their efforts', 'Other', '2024-12-05', 'global', ARRAY['volunteering', 'community']);

-- Sample Global Templates (is_global = TRUE, organization_id = NULL)
INSERT INTO public.templates (organization_id, name, description, template_type, base_layout, sample_content, is_global, is_locked, tags) VALUES
-- Email Templates
(NULL, 'Pride Month Celebration Email', 'Colorful email template for Pride Month announcements', 'email',
 '{"components": [{"type": "header", "content": "Happy Pride Month!"}, {"type": "body"}, {"type": "cta"}]}'::jsonb,
 '{"headline": "Celebrating Pride Month", "body": "Join us in celebrating the LGBTQ+ community..."}'::jsonb,
 TRUE, TRUE, ARRAY['pride', 'dei', 'lgbtq']),

(NULL, 'Mental Health Resources Email', 'Professional template for mental health awareness', 'email',
 '{"components": [{"type": "header"}, {"type": "resources-list"}, {"type": "support-contact"}]}'::jsonb,
 '{"headline": "Mental Health Resources", "resources": ["Employee Assistance Program", "Counseling Services"]}'::jsonb,
 TRUE, TRUE, ARRAY['mental-health', 'wellness', 'resources']),

(NULL, 'Earth Day Challenge Email', 'Engaging template for sustainability initiatives', 'email',
 '{"components": [{"type": "hero-image"}, {"type": "challenge-details"}, {"type": "cta"}]}'::jsonb,
 '{"headline": "Take the Earth Day Challenge", "challenge": "Reduce your carbon footprint"}'::jsonb,
 TRUE, TRUE, ARRAY['sustainability', 'earth-day', 'challenge']),

-- Slack Card Templates
(NULL, 'DEI Announcement Slack Card', 'Modern Slack card for DEI announcements', 'slack_card',
 '{"blocks": [{"type": "header"}, {"type": "section"}, {"type": "actions"}]}'::jsonb,
 '{"title": "DEI Initiative", "message": "Learn about our latest diversity initiative"}'::jsonb,
 TRUE, TRUE, ARRAY['dei', 'slack', 'announcement']),

(NULL, 'Wellness Tips Slack Card', 'Interactive card for wellness tips', 'slack_card',
 '{"blocks": [{"type": "image"}, {"type": "section"}, {"type": "context"}]}'::jsonb,
 '{"title": "Daily Wellness Tip", "tip": "Take regular breaks throughout your workday"}'::jsonb,
 TRUE, TRUE, ARRAY['wellness', 'slack', 'tips']),

-- Poster Templates
(NULL, 'Heritage Month Celebration Poster', 'Bold poster design for heritage months', 'poster',
 '{"layout": "full-bleed", "zones": [{"type": "hero"}, {"type": "title"}, {"type": "details"}]}'::jsonb,
 '{"title": "Celebrate Heritage Month", "subtitle": "Join us in honoring our diverse cultures"}'::jsonb,
 TRUE, TRUE, ARRAY['heritage', 'poster', 'celebration']),

(NULL, 'Mental Health Awareness Poster', 'Calming design for mental health awareness', 'poster',
 '{"layout": "centered", "zones": [{"type": "title"}, {"type": "quote"}, {"type": "resources"}]}'::jsonb,
 '{"title": "Mental Health Matters", "quote": "It''s okay to not be okay"}'::jsonb,
 TRUE, TRUE, ARRAY['mental-health', 'poster', 'awareness']),

-- Social Card Templates
(NULL, 'Pride Social Share Card', 'Shareable graphic for Pride Month', 'social_card',
 '{"dimensions": "1200x630", "zones": [{"type": "background"}, {"type": "message"}, {"type": "logo"}]}'::jsonb,
 '{"message": "Love is Love", "hashtags": ["Pride2024", "LoveWins"]}'::jsonb,
 TRUE, TRUE, ARRAY['pride', 'social', 'lgbtq']);

-- =====================================================
-- Sample Organization for Demo (Optional)
-- =====================================================

-- You can uncomment this to create a demo organization
/*
INSERT INTO public.organizations (name, slug, industry, size_band, plan_tier) VALUES
('Acme Corporation', 'acme-corp', 'Technology', '201-1000', 'growth');

-- Note: To create profiles and other org-specific data, you'd need actual user IDs from auth.users
*/

-- =====================================================
-- Helper Views (Optional)
-- =====================================================

-- View for upcoming events
CREATE OR REPLACE VIEW public.upcoming_events AS
SELECT
  id,
  organization_id,
  title,
  description,
  category,
  start_date,
  end_date,
  tags
FROM public.calendar_events
WHERE start_date >= CURRENT_DATE
  AND deleted_at IS NULL
ORDER BY start_date ASC;

-- View for active campaigns
CREATE OR REPLACE VIEW public.active_campaigns AS
SELECT
  c.id,
  c.organization_id,
  c.name,
  c.description,
  c.status,
  c.start_at,
  c.end_at,
  c.primary_category,
  p.full_name as created_by_name
FROM public.campaigns c
LEFT JOIN public.profiles p ON c.created_by = p.id
WHERE c.status IN ('active', 'scheduled')
  AND c.deleted_at IS NULL
ORDER BY c.start_at DESC;

COMMENT ON VIEW public.upcoming_events IS 'Upcoming awareness events for calendar display';
COMMENT ON VIEW public.active_campaigns IS 'Active and scheduled campaigns with creator info';
