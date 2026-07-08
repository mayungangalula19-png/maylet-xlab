import '../../../core/supabase_client.dart';
import '../models/research_project.dart';

class ResearchService {
  Future<List<ResearchProject>> listProjects(String userId) async {
    final res = await SupabaseConfig.client
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return (res as List).map((json) => ResearchProject.fromJson(json)).toList();
  }

  Future<ResearchProject> getProject(String projectId) async {
    final res = await SupabaseConfig.client
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
    return ResearchProject.fromJson(res);
  }
}
