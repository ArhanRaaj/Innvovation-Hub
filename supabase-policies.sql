-- ============================================================================
-- THE INNOVATION HUB — SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================================

-- 1. Ensure projects table has required columns
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  board TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  summary TEXT,
  estimated_build_time TEXT,
  science_domain TEXT,
  science_concept TEXT,
  hardware_specs JSONB DEFAULT '{}'::jsonb,
  components JSONB DEFAULT '[]'::jsonb,
  wiring JSONB DEFAULT '[]'::jsonb,
  circuit_nodes JSONB DEFAULT '[]'::jsonb,
  firmware TEXT DEFAULT '',
  assembly_steps JSONB DEFAULT '[]'::jsonb,
  equations JSONB DEFAULT '[]'::jsonb,
  libraries JSONB DEFAULT '[]'::jsonb,
  troubleshooting JSONB DEFAULT '[]'::jsonb,
  is_curated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Read for Curated Projects
-- Anyone (visitors and engineers) can view the 12 curated lab schematics
DROP POLICY IF EXISTS "Public can view curated projects" ON public.projects;
CREATE POLICY "Public can view curated projects"
ON public.projects
FOR SELECT
USING (is_curated = true);

-- 4. Policy: User Project Access
-- Engineers can read, insert, update, and delete their own custom projects and chat sessions
DROP POLICY IF EXISTS "Users can read own projects" ON public.projects;
CREATE POLICY "Users can read own projects"
ON public.projects
FOR SELECT
USING (
  hardware_specs->>'userId' IS NOT NULL
  OR is_curated = true
);

DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
CREATE POLICY "Users can insert projects"
ON public.projects
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
ON public.projects
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
ON public.projects
FOR DELETE
USING (is_curated = false);

-- 5. Create index for fast user project lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects ((hardware_specs->>'userId'));
CREATE INDEX IF NOT EXISTS idx_projects_curated ON public.projects (is_curated);
