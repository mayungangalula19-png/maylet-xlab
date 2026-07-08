import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/prototype.dart';

class PrototypeService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<Prototype>> listPrototypes({String? userId, String? projectId, String? researchId}) async {
    try {
      var query = _client.from('prototypes').select('*');

      if (userId != null) query = query.eq('user_id', userId);
      if (projectId != null) query = query.eq('project_id', projectId);
      if (researchId != null) query = query.eq('research_id', researchId);

      final response = await query.order('updated_at', ascending: false);
      final rows = response as List<dynamic>;
      return rows.map((json) => Prototype.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      rethrow;
    }
  }

  Future<Prototype> getPrototype(String id) async {
    final response = await _client.from('prototypes').select('*').eq('id', id).single();
    return Prototype.fromJson(response);
  }

  Future<Prototype> createPrototype(Prototype prototype) async {
    final response = await _client
        .from('prototypes')
        .insert(prototype.toJson())
        .select()
        .single();
    return Prototype.fromJson(response);
  }

  Future<Prototype> updatePrototype(String id, Map<String, dynamic> updates) async {
    final response = await _client.from('prototypes').update(updates).eq('id', id).select().single();
    return Prototype.fromJson(response);
  }

  Future<void> updatePrototypeStatus(String id, String status) async {
    await _client.from('prototypes').update({'status': status, 'lifecycle_status': status}).eq('id', id);
  }

  Future<List<PrototypeBuild>> listBuilds(String prototypeId) async {
    try {
      final response = await _client
          .from('prototype_builds')
          .select('*')
          .eq('prototype_id', prototypeId)
          .order('started_at', ascending: false);
      final rows = response as List<dynamic>;
      return rows.map((json) => PrototypeBuild.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<PrototypeTestRun>> listTestRuns(String prototypeId) async {
    try {
      final response = await _client
          .from('prototype_test_runs')
          .select('*')
          .eq('prototype_id', prototypeId)
          .order('created_at', ascending: false);
      final rows = response as List<dynamic>;
      return rows.map((json) => PrototypeTestRun.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<PrototypeTestRun> createTestRun({
    required String prototypeId,
    required String name,
    required String verdict,
    int? score,
    String? notes,
  }) async {
    final data = <String, dynamic>{
      'prototype_id': prototypeId,
      'name': name,
      'verdict': verdict,
    };
    if (score != null) {
      data['score'] = score;
    }
    if (notes != null && notes.isNotEmpty) {
      data['notes'] = notes;
    }

    final response = await _client.from('prototype_test_runs').insert(data).select().single();
    return PrototypeTestRun.fromJson(response);
  }

  Future<void> deletePrototype(String id) async {
    await _client.from('prototypes').delete().eq('id', id);
  }
}
