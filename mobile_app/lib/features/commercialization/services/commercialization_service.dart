import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';

class CommercializationWorkspace {
  final String id;
  final String projectId;
  final String launchStatus;
  final String revenueModel;

  CommercializationWorkspace({
    required this.id,
    required this.projectId,
    required this.launchStatus,
    required this.revenueModel,
  });

  factory CommercializationWorkspace.fromJson(Map<String, dynamic> json) {
    return CommercializationWorkspace(
      id: json['id'],
      projectId: json['project_id'],
      launchStatus: json['launch_status'] ?? 'draft',
      revenueModel: json['revenue_model'] ?? 'saas',
    );
  }
}

class CommercializationService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<CommercializationWorkspace>> fetchWorkspaces() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    try {
      final data = await _client
          .from('commercialization_workspaces')
          .select('*')
          .eq('user_id', userId);
      return (data as List).map((json) => CommercializationWorkspace.fromJson(json)).toList();
    } catch (_) {
      return [];
    }
  }
}
