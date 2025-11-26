-- Create signup forms table for growth tool
CREATE TABLE IF NOT EXISTS signup_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_list_id UUID REFERENCES recipient_lists(id) ON DELETE SET NULL,

  -- Form field configuration
  fields JSONB NOT NULL DEFAULT '{
    "email": {"enabled": true, "required": true, "label": "Email", "placeholder": "your@email.com"},
    "first_name": {"enabled": true, "required": true, "label": "First Name", "placeholder": "John"},
    "last_name": {"enabled": true, "required": true, "label": "Last Name", "placeholder": "Doe"},
    "phone": {"enabled": false, "required": false, "label": "Phone", "placeholder": "+1 (555) 000-0000"},
    "title": {"enabled": false, "required": false, "label": "Job Title", "placeholder": "Software Engineer"},
    "location": {"enabled": false, "required": false, "label": "Location", "placeholder": "San Francisco, CA"},
    "department": {"enabled": false, "required": false, "label": "Department", "placeholder": "Engineering"}
  }'::jsonb,

  -- Branding and styling
  branding JSONB NOT NULL DEFAULT '{
    "primary_color": "#f59e0b",
    "button_text": "Subscribe",
    "logo_url": null,
    "background_style": "gradient"
  }'::jsonb,

  -- Consent and compliance
  consent_options JSONB NOT NULL DEFAULT '{
    "gdpr_enabled": true,
    "gdpr_text": "I consent to receiving communications and understand I can unsubscribe at any time.",
    "terms_enabled": false,
    "terms_url": null,
    "privacy_enabled": true,
    "privacy_url": null
  }'::jsonb,

  -- Success configuration
  success_config JSONB NOT NULL DEFAULT '{
    "message": "Thanks for subscribing! Check your email for confirmation.",
    "redirect_url": null
  }'::jsonb,

  -- Form settings
  settings JSONB NOT NULL DEFAULT '{
    "double_opt_in": true,
    "send_welcome_email": true,
    "allow_duplicates": false,
    "rate_limit": 10
  }'::jsonb,

  -- Stats
  submission_count INTEGER DEFAULT 0,
  last_submission_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX idx_signup_forms_org ON signup_forms(organization_id);
CREATE INDEX idx_signup_forms_status ON signup_forms(status);
CREATE INDEX idx_signup_forms_target_list ON signup_forms(target_list_id);

-- Create signup form submissions table
CREATE TABLE IF NOT EXISTS signup_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES signup_forms(id) ON DELETE CASCADE,

  -- Submission data
  data JSONB NOT NULL,

  -- Tracking
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'spam')),

  -- Link to created contact
  contact_id UUID REFERENCES recipient_contacts(id) ON DELETE SET NULL,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_signup_submissions_form ON signup_form_submissions(form_id);
CREATE INDEX idx_signup_submissions_status ON signup_form_submissions(status);
CREATE INDEX idx_signup_submissions_contact ON signup_form_submissions(contact_id);
CREATE INDEX idx_signup_submissions_date ON signup_form_submissions(submitted_at DESC);

-- Create function to update submission count
CREATE OR REPLACE FUNCTION update_form_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE signup_forms
    SET
      submission_count = submission_count + 1,
      last_submission_at = NEW.submitted_at
    WHERE id = NEW.form_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_form_submission_count
AFTER INSERT ON signup_form_submissions
FOR EACH ROW
EXECUTE FUNCTION update_form_submission_count();

-- Add RLS policies
ALTER TABLE signup_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view forms from their organization
CREATE POLICY signup_forms_select_policy ON signup_forms
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert forms for their organization
CREATE POLICY signup_forms_insert_policy ON signup_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update forms from their organization
CREATE POLICY signup_forms_update_policy ON signup_forms
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete forms from their organization
CREATE POLICY signup_forms_delete_policy ON signup_forms
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can view submissions for their organization's forms
CREATE POLICY signup_submissions_select_policy ON signup_form_submissions
  FOR SELECT
  TO authenticated
  USING (
    form_id IN (
      SELECT id FROM signup_forms WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Allow public to submit forms (anon users)
CREATE POLICY signup_submissions_insert_policy ON signup_form_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
