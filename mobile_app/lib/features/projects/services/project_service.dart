import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/project.dart';

class ProjectService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<Project>> fetchUserProjects(String userId) async {
    try {
      final data = await _client
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', ascending: false);

      return (data as List<dynamic>)
          .map((json) => Project.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<Project> getProject(String id) async {
    try {
      final data = await _client
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

      return Project.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  Future<Project> createProject({
    required String userId,
    required String name,
    String? description,
    String? sector,
    String? status,
  }) async {
    try {
      final data = await _client
          .from('projects')
          .insert({
            'user_id': userId,
            'name': name,
            // ignore: use_null_aware_elements
            if (description != null) 'description': description,
            // ignore: use_null_aware_elements
            if (sector != null) 'sector': sector,
            // ignore: use_null_aware_elements
            if (status != null) 'status': status,
          })
          .select()
          .single();

      return Project.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  Future<Project> updateProject(String id, Map<String, dynamic> updates) async {
    try {
      final data = await _client
          .from('projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

      return Project.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteProject(String id) async {
    try {
      await _client.from('projects').delete().eq('id', id);
    } catch (e) {
      rethrow;
    }
  }
}
