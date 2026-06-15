import { supabase } from '../../lib/supabase/client';

export type ResourceType = 'course' | 'video' | 'article' | 'workshop';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningResourceRecord {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  skill_level: SkillLevel;
  duration: string;
  thumbnail_url: string | null;
  url: string;
  author: string;
  tags: string[];
  created_at: string;
}

export interface UserLearningProgressRecord {
  id: string;
  resource_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface LearningHubData {
  resources: LearningResourceRecord[];
  progress: UserLearningProgressRecord[];
}

class LearningHubService {
  async getData(userId: string): Promise<LearningHubData> {
    const [{ data: resourcesData, error: resourcesError }, { data: progressData, error: progressError }] =
      await Promise.all([
        supabase.from('learning_resources').select('*').order('created_at', { ascending: false }),
        supabase.from('user_learning_progress').select('*').eq('user_id', userId),
      ]);

    if (resourcesError) throw resourcesError;
    if (progressError) throw progressError;

    return {
      resources: resourcesData ?? [],
      progress: progressData ?? [],
    };
  }

  async markComplete(userId: string, resourceId: string): Promise<UserLearningProgressRecord> {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .insert({
        user_id: userId,
        resource_id: resourceId,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async markIncomplete(progressId: string): Promise<void> {
    const { error } = await supabase.from('user_learning_progress').delete().eq('id', progressId);
    if (error) throw error;
  }
}

export const learningHubService = new LearningHubService();
