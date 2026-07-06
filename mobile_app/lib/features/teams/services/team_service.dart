import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/team.dart';

class TeamService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<Team>> fetchUserTeams(String userId) async {
    final data = await _client
        .from('teams')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', ascending: false);

    return (data as List<dynamic>)
        .map((json) => Team.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<Team> getTeam(String id) async {
    final data = await _client
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();
    return Team.fromJson(data);
  }

  Future<Team> createTeam({
    required String ownerId,
    required String name,
    String? description,
    String? projectId,
  }) async {
    final data = await _client
        .from('teams')
        .insert({
          'owner_id': ownerId,
          'name': name,
          // ignore: use_null_aware_elements
          if (description != null) 'description': description,
          // ignore: use_null_aware_elements
          if (projectId != null) 'project_id': projectId,
        })
        .select()
        .single();
    return Team.fromJson(data);
  }

  Future<void> deleteTeam(String id) async {
    await _client.from('teams').delete().eq('id', id);
  }

  Future<List<Map<String, dynamic>>> getTeamMembers(String teamId) async {
    final data = await _client
        .from('team_members')
        .select('*, profiles(id, full_name, email, avatar_url)')
        .eq('team_id', teamId);
    return List<Map<String, dynamic>>.from(data as List);
  }
}
