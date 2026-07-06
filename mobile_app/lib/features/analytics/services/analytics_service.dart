import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/analytics_stats.dart';

class AnalyticsService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<AnalyticsStats> fetchStats() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) {
      return AnalyticsStats(
        totalProjects: 0, activeTeams: 0, totalExperiments: 0,
        totalPrototypes: 0, vaultEntries: 0,
        totalFundingRaised: 0, totalFundingTarget: 0, totalPitches: 0,
      );
    }

    try {
      // Run queries safely one-by-one to isolate errors
      final projects = await _client.from('projects').select('id').eq('user_id', userId);
      final teams = await _client.from('team_members').select('id').eq('user_id', userId);
      
      List experiments = [];
      try { experiments = await _client.from('experiments').select('id').eq('user_id', userId); } catch (_) {}
      
      List prototypes = [];
      try { prototypes = await _client.from('prototypes').select('id').eq('user_id', userId); } catch (_) {}
      
      List vault = [];
      try { vault = await _client.from('vault_entries').select('id').eq('created_by', userId); } catch (_) {}
      
      // Fetch pitches tied to any of the user's projects
      List pitches = [];
      try {
        final projectIds = (projects as List).map((p) => p['id'] as String).toList();
        if (projectIds.isNotEmpty) {
          pitches = await _client
              .from('funding_pitches')
              .select('raised_amount, target_amount')
              .inFilter('project_id', projectIds);
        }
      } catch (_) {}

      double raised = 0;
      double target = 0;
      for (final p in pitches) {
        raised += (p['raised_amount'] as num?)?.toDouble() ?? 0.0;
        target += (p['target_amount'] as num?)?.toDouble() ?? 0.0;
      }

      return AnalyticsStats(
        totalProjects: (projects as List).length,
        activeTeams: (teams as List).length,
        totalExperiments: experiments.length,
        totalPrototypes: prototypes.length,
        vaultEntries: vault.length,
        totalFundingRaised: raised,
        totalFundingTarget: target,
        totalPitches: pitches.length,
      );
    } catch (e) {
      rethrow;
    }
  }
}
