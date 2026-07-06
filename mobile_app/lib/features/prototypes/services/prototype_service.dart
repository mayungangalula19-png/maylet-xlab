import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/prototype.dart';

class PrototypeService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<Prototype>> listPrototypes({String? userId, String? projectId}) async {
    var query = _client.from('prototypes').select('*');

    if (userId != null) query = query.eq('user_id', userId);
    if (projectId != null) query = query.eq('project_id', projectId);

    final data = await query.order('created_at', ascending: false);
    return (data as List<dynamic>)
        .map((json) => Prototype.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<Prototype> getPrototype(String id) async {
    final data = await _client.from('prototypes').select('*').eq('id', id).single();
    return Prototype.fromJson(data);
  }

  Future<Prototype> createPrototype(Prototype prototype) async {
    final data = await _client
        .from('prototypes')
        .insert(prototype.toJson())
        .select()
        .single();
    return Prototype.fromJson(data);
  }

  Future<void> updatePrototypeStatus(String id, String status) async {
    await _client.from('prototypes').update({'status': status}).eq('id', id);
  }

  Future<void> deletePrototype(String id) async {
    await _client.from('prototypes').delete().eq('id', id);
  }
}
