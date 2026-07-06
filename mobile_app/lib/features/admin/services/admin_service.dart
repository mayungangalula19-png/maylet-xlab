import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';

class AdminService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<Map<String, dynamic>> getSystemStats() async {
    // In a real scenario, this might call a custom RPC `get_admin_stats`
    // For now, we aggregate some counts using basic queries.
    // Note: This relies on the admin having RLS bypass or read-all policies.
    
    final usersRes = await _client.from('profiles').select('id');
    final projectsRes = await _client.from('projects').select('id');
    final fundingRes = await _client.from('funding_pitches').select('id');

    return {
      'totalUsers': (usersRes as List).length,
      'totalProjects': (projectsRes as List).length,
      'totalPitches': (fundingRes as List).length,
    };
  }

  Future<List<Map<String, dynamic>>> getUsers() async {
    final response = await _client
        .from('profiles')
        .select('*')
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> getProjects() async {
    final response = await _client
        .from('projects')
        .select('*, profiles!projects_user_id_fkey(full_name)')
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }
}
