import { createClient } from '@supabase/supabase-js';
import { ScienceProject } from '../types.ts';

const SUPABASE_URL = 'https://pzitspclrudmaothdzzx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aXRzcGNscnVkbWFvdGhkenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTkwOTksImV4cCI6MjEwNzczNTA5OX0.ESP_2bMrC2djbfgyLx_YHRYTbQLXJeRtQ7waPOBvAGU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client identifier for bookmark isolation
function getClientId(): string {
  let id = localStorage.getItem('omnilab_client_id');
  if (!id) {
    id = 'client_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('omnilab_client_id', id);
  }
  return id;
}

// Fetch community & AI generated projects from Supabase
export async function fetchSupabaseProjects(): Promise<ScienceProject[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch projects from Supabase:', error);
      return [];
    }

    return data.map((row: any): ScienceProject => ({
      id: row.id,
      title: row.title,
      shortDesc: row.summary || '',
      board: row.board === 'ESP32' ? 'ESP32' : 'Arduino Uno',
      category: row.category || 'Robotics & Automation',
      difficulty: row.difficulty || 'Intermediate',
      estimatedTime: row.estimated_build_time || '2 Hours',
      rating: 5.0,
      featured: row.is_curated || false,
      tags: row.hardware_specs?.tags || ['AI Architect', row.board],
      components: row.components || [],
      workingPrinciple: row.science_concept || 'Sensor signal processing and actuator feedback control loop.',
      wiringTable: row.wiring || [],
      circuitDiagram: {
        boardType: row.board === 'ESP32' ? 'esp32' : 'arduino-uno',
        modules: row.circuit_nodes || []
      },
      code: row.firmware || '',
      assemblySteps: row.assembly_steps || [],
      scientificApplications: row.science_domain || 'Robotics & Embedded Systems'
    }));
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return [];
  }
}

// Save newly generated AI project to Supabase
export async function saveProjectToSupabase(project: ScienceProject): Promise<boolean> {
  try {
    const { error } = await supabase.from('projects').upsert({
      id: project.id,
      title: project.title,
      board: project.board,
      category: project.category,
      difficulty: project.difficulty,
      summary: project.shortDesc,
      estimated_build_time: project.estimatedTime,
      science_domain: project.scientificApplications,
      science_concept: project.workingPrinciple,
      hardware_specs: { tags: project.tags },
      components: project.components,
      wiring: project.wiringTable,
      circuit_nodes: project.circuitDiagram?.modules || [],
      firmware: project.code,
      assembly_steps: project.assemblySteps,
      is_curated: false,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Failed to save project to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save error:', err);
    return false;
  }
}

// Sync bookmarks to Supabase
export async function syncBookmarkToSupabase(projectId: string, isBookmarked: boolean): Promise<void> {
  const clientId = getClientId();
  try {
    if (isBookmarked) {
      await supabase.from('user_bookmarks').upsert({
        project_id: projectId,
        client_id: clientId
      }, { onConflict: 'project_id,client_id' });
    } else {
      await supabase
        .from('user_bookmarks')
        .delete()
        .match({ project_id: projectId, client_id: clientId });
    }
  } catch (err) {
    console.warn('Supabase bookmark sync error:', err);
  }
}

// Log prompt generations to Supabase
export async function logAIGeneration(prompt: string, model: string, effort: string, projectId?: string): Promise<void> {
  try {
    await supabase.from('ai_generations').insert({
      prompt,
      model,
      effort,
      project_id: projectId || null
    });
  } catch (err) {
    console.warn('Could not log AI generation to Supabase:', err);
  }
}
