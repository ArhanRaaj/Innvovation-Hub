import pg from 'pg';
import { readFileSync } from 'fs';

const connectionString = 'postgresql://postgres:8jYTdYd3nETYV5T8@db.pzitspclrudmaothdzzx.supabase.co:5432/postgres';

const schemaSQL = `
-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  board TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  summary TEXT NOT NULL,
  estimated_build_time TEXT,
  science_domain TEXT,
  science_concept TEXT,
  equations JSONB DEFAULT '[]'::jsonb,
  hardware_specs JSONB DEFAULT '{}'::jsonb,
  components JSONB DEFAULT '[]'::jsonb,
  wiring JSONB DEFAULT '[]'::jsonb,
  circuit_nodes JSONB DEFAULT '[]'::jsonb,
  firmware TEXT,
  libraries JSONB DEFAULT '[]'::jsonb,
  assembly_steps JSONB DEFAULT '[]'::jsonb,
  troubleshooting JSONB DEFAULT '[]'::jsonb,
  is_curated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hardware components repository table
CREATE TABLE IF NOT EXISTS public.hardware_components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pin_count INT,
  pins JSONB DEFAULT '[]'::jsonb,
  operating_voltage TEXT,
  description TEXT,
  svg_render_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user bookmarks table
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, client_id)
);

-- Create AI prompt generations history table
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id BIGSERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  model TEXT,
  effort TEXT,
  project_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and grant read/write access to public anon & service_role
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- Allow public reads and writes for seamless client app sync
DROP POLICY IF EXISTS "Public full access to projects" ON public.projects;
CREATE POLICY "Public full access to projects" ON public.projects FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to hardware_components" ON public.hardware_components;
CREATE POLICY "Public full access to hardware_components" ON public.hardware_components FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to user_bookmarks" ON public.user_bookmarks;
CREATE POLICY "Public full access to user_bookmarks" ON public.user_bookmarks FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to ai_generations" ON public.ai_generations;
CREATE POLICY "Public full access to ai_generations" ON public.ai_generations FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- Enable Realtime publication for live collaboration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
END $$;
`;

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected! Creating tables and security policies...');
    await client.query(schemaSQL);
    console.log('Schema migration completed successfully!');
  } catch (err) {
    console.error('Schema creation failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
