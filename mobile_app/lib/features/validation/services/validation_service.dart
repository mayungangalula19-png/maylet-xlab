import '../../../core/supabase_client.dart';
import '../models/validation_record.dart';

class ValidationService {
  Future<List<ValidationRecord>> listValidations({String? userId}) async {
    var query = SupabaseConfig.client.from('validations').select('*');
    if (userId != null) {
      query = query.eq('user_id', userId);
    }
    
    final res = await query.order('created_at', ascending: false);
    return (res as List).map((json) => ValidationRecord.fromJson(json)).toList();
  }

  Future<ValidationRecord> getValidation(String id) async {
    final res = await SupabaseConfig.client
        .from('validations')
        .select('*')
        .eq('id', id)
        .single();
    return ValidationRecord.fromJson(res);
  }

  Future<void> updateDecision(String id, String decision, String? notes) async {
    final Map<String, dynamic> updates = {'decision': decision};
    if (notes != null) {
      updates['reviewer_notes'] = notes;
    }
    await SupabaseConfig.client.from('validation_records').update(updates).eq('id', id);
  }
}
