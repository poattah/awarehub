-- Extend brand_kits with background/text/button and custom font fields
ALTER TABLE public.brand_kits
  ADD COLUMN IF NOT EXISTS background_color TEXT,
  ADD COLUMN IF NOT EXISTS text_color TEXT,
  ADD COLUMN IF NOT EXISTS button_style JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS font_custom_url TEXT,
  ADD COLUMN IF NOT EXISTS font_custom_name TEXT;
