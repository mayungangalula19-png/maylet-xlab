import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/experiment.dart';

class ExperimentService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<Experiment>> listExperiments({String? userId, String? projectId}) async {
    var query = _client.from('experiments').select('*');

    if (userId != null) query = query.eq('user_id', userId);
    if (projectId != null) query = query.eq('project_id', projectId);

    final data = await query.order('created_at', ascending: false);
    return (data as List<dynamic>)
        .map((json) => Experiment.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<Experiment> getExperiment(String id) async {
    final data = await _client
        .from('experiments')
        .select('*')
        .eq('id', id)
        .single();
    return Experiment.fromJson(data);
  }

  Future<Experiment> createExperiment({
    required String userId,
    required String title,
    required String hypothesis,
    String? type,
    String? projectId,
  }) async {
    final data = await _client
        .from('experiments')
        .insert({
          'user_id': userId,
          'title': title,
          'hypothesis': hypothesis,
          // ignore: use_null_aware_elements
          if (type != null) 'type': type,
          // ignore: use_null_aware_elements
          if (projectId != null) 'project_id': projectId,
          'status': 'draft',
          'pipeline_stage': 'Draft',
        })
        .select()
        .single();
    return Experiment.fromJson(data);
  }

  Future<void> deleteExperiment(String id) async {
    await _client.from('experiments').delete().eq('id', id);
  }
}
