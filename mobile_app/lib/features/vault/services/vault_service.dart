import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/vault_entry.dart';

class VaultService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<VaultEntry>> listVaultEntries({String? userId}) async {
    var query = _client.from('vault_entries').select('*');

    if (userId != null) query = query.eq('user_id', userId);

    final data = await query.order('created_at', ascending: false);
    return (data as List<dynamic>)
        .map((json) => VaultEntry.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<VaultEntry> getVaultEntry(String id) async {
    final data = await _client.from('vault_entries').select('*').eq('id', id).single();
    return VaultEntry.fromJson(data);
  }

  Future<VaultEntry> createVaultEntry(VaultEntry entry) async {
    final data = await _client
        .from('vault_entries')
        .insert(entry.toJson())
        .select()
        .single();
    return VaultEntry.fromJson(data);
  }

  Future<void> updateVaultEntry(String id, Map<String, dynamic> updates) async {
    await _client.from('vault_entries').update(updates).eq('id', id);
  }

  Future<void> deleteVaultEntry(String id) async {
    await _client.from('vault_entries').delete().eq('id', id);
  }
}
