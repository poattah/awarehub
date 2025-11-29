-- Automation (AI-generated drip campaigns) schema

CREATE TABLE IF NOT EXISTS public.automation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.automation_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  position JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.automation_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source UUID NOT NULL REFERENCES public.automation_nodes(id) ON DELETE CASCADE,
  target UUID NOT NULL REFERENCES public.automation_nodes(id) ON DELETE CASCADE,
  label TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.automation_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.automation_nodes(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  role TEXT CHECK (role IN ('image','attachment','audio','video','doc','other')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_projects_org ON public.automation_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_auto_nodes_project ON public.automation_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_auto_edges_project ON public.automation_edges(project_id);
CREATE INDEX IF NOT EXISTS idx_auto_assets_project ON public.automation_assets(project_id);

-- RLS
ALTER TABLE public.automation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_projects_select ON public.automation_projects;
DROP POLICY IF EXISTS automation_projects_modify ON public.automation_projects;
CREATE POLICY automation_projects_select ON public.automation_projects
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY automation_projects_modify ON public.automation_projects
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

DROP POLICY IF EXISTS automation_nodes_select ON public.automation_nodes;
DROP POLICY IF EXISTS automation_nodes_modify ON public.automation_nodes;
CREATE POLICY automation_nodes_select ON public.automation_nodes
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY automation_nodes_modify ON public.automation_nodes
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

DROP POLICY IF EXISTS automation_edges_select ON public.automation_edges;
DROP POLICY IF EXISTS automation_edges_modify ON public.automation_edges;
CREATE POLICY automation_edges_select ON public.automation_edges
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY automation_edges_modify ON public.automation_edges
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());

DROP POLICY IF EXISTS automation_assets_select ON public.automation_assets;
DROP POLICY IF EXISTS automation_assets_modify ON public.automation_assets;
CREATE POLICY automation_assets_select ON public.automation_assets
  FOR SELECT
  USING (organization_id = public.get_current_organization_id());
CREATE POLICY automation_assets_modify ON public.automation_assets
  FOR ALL
  USING (organization_id = public.get_current_organization_id())
  WITH CHECK (organization_id = public.get_current_organization_id());
