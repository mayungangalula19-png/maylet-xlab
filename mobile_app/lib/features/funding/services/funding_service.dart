import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/funding_pitch.dart';

class FundingService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<FundingPitch>> listPitches({String? projectId}) async {
    var query = _client.from('funding_pitches').select('*');

    if (projectId != null) {
      query = query.eq('project_id', projectId);
    }

    final data = await query.order('created_at', ascending: false);
    return (data as List<dynamic>)
        .map((json) => FundingPitch.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<FundingPitch> getPitch(String id) async {
    final data = await _client.from('funding_pitches').select('*').eq('id', id).single();
    return FundingPitch.fromJson(data);
  }

  Future<FundingPitch> createPitch(FundingPitch pitch) async {
    final data = await _client
        .from('funding_pitches')
        .insert(pitch.toJson())
        .select()
        .single();
    return FundingPitch.fromJson(data);
  }

  Future<void> updatePitchStatus(String id, String status) async {
    await _client.from('funding_pitches').update({'status': status}).eq('id', id);
  }

  Future<void> deletePitch(String id) async {
    await _client.from('funding_pitches').delete().eq('id', id);
  }
}
